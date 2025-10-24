import { Telegraf, Scenes, session } from "telegraf";
import { env } from "./env";
import { prisma } from "../infra/prisma";
import { createSessionMiddleware } from "../modules/session/session.middleware";
import { createOnboardingScenes } from "../modules/telegram/scenes/onboarding";
import { createMainScenes } from "../modules/telegram/scenes/main";
import type { SessionContext } from "../modules/telegram/types";

export const bot = new Telegraf<SessionContext>(env.telegramBotToken, {
  telegram: { apiRoot: "https://api.telegram.org" },
});

const stage = new Scenes.Stage<SessionContext>([
  ...createOnboardingScenes(),
  ...createMainScenes(),
]);

bot.command("start", async (ctx) => {
  console.log("✅ /start command received!");

  if (!ctx.from?.id) {
    await ctx.reply("Error: Unable to identify user");
    return;
  }

  const userId = String(ctx.from.id);

  const user = await prisma.user.findUnique({
    where: { telegramId: userId },
  });

  if (!user || !user.username) {
    ctx.scene.session.userId = user?.id || userId;
    await ctx.scene.enter("ONBOARDING_SCENE");
  } else {
    await ctx.reply(
      `Welcome back, ${user.username}! 🚀\n\n` +
      "Ready to click your way to the top?\n\n" +
      "Click the button below to start playing!",
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "🎮 Play Komi Clicker",
                web_app: { url: env.miniAppUrl },
              },
            ],
          ],
        },
      }
    );
  }
});

bot.command("help", async (ctx) => {
  await ctx.reply(
    "Available commands:\n/start - Start the game\n/help - Show this help message\n/leaderboard - View the leaderboard\n/stats - View your stats"
  );
});

bot.command("leaderboard", async (ctx) => {
  await ctx.reply(
    "🏆 **Leaderboard**\n\nTop players will be shown here!\n\nClick the button below to view the full leaderboard!",
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "🏆 View Leaderboard",
              web_app: { url: env.miniAppUrl },
            },
          ],
        ],
      },
    }
  );
});

bot.command("stats", async (ctx) => {
  await ctx.reply(
    "📊 **Your Stats**\n\nYour game statistics will be shown here!\n\nClick the button below to view your stats!",
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "📊 View My Stats",
              web_app: { url: env.miniAppUrl },
            },
          ],
        ],
      },
    }
  );
});

bot.use(session());
bot.use(createSessionMiddleware());
bot.use(stage.middleware());

bot.catch(async (err, ctx) => {
  await ctx.reply("An unexpected error occurred. Please try again later.");
  console.error("Bot error", err);
});
