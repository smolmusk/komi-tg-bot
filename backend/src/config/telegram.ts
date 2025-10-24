import { Telegraf, Scenes, session } from "telegraf";
import { env } from "./env";
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
  await ctx.reply(
    "Welcome to Komi Clicker! 🚀\n\nThis is a simple clicker game where you can:\n• Click to earn points\n• View leaderboards\n• Compete with friends\n\nClick the button below to start playing!",
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
