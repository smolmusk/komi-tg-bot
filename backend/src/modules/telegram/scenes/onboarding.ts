import { Scenes, Markup } from "telegraf";
import { prisma } from "../../../infra/prisma";
import { getUsernamesSuggestions, validateUsername, setUsername } from "../../username/service";
import { env } from "../../../config/env";
import type { SessionContext } from "../types";

interface OnboardingSession {
  userId?: string;
  chatId?: string;
  suggestions?: string[];
}

export const createOnboardingScenes = () => {
  const onboardingScene = new Scenes.BaseScene<SessionContext>("ONBOARDING_SCENE");

  onboardingScene.enter(async (ctx) => {
    const session = ctx.scene.session as OnboardingSession;
    const userId = session.userId;
    if (userId == null) {
      await ctx.scene.leave();
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (user?.username != null) {
      await ctx.scene.enter("MAIN_SCENE");
      return;
    }

    const telegramUser = ctx.from;
    const suggestions = getUsernamesSuggestions(telegramUser?.username);

    const messageText =
      "🎮 *Welcome to Komi Clicker!*\n\n" +
      "Let's set up your username to get started.\n\n" +
      "Here are some suggestions based on your Telegram username:\n\n" +
      suggestions.map((s, i) => `${i + 1}. *${s}*`).join("\n") +
      "\n\n" +
      "You can:\n" +
      "• Choose one of these by clicking the button\n" +
      "• Or send your own custom username (3-20 characters)\n\n" +
      "_Username must contain only letters, numbers, dashes, and underscores_";

    await ctx.reply(messageText, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "1️⃣ " + suggestions[0],
              callback_data: "select_0",
            },
            {
              text: "2️⃣ " + suggestions[1],
              callback_data: "select_1",
            },
          ],
          [
            {
              text: "3️⃣ " + suggestions[2],
              callback_data: "select_2",
            },
            {
              text: "4️⃣ " + suggestions[3],
              callback_data: "select_3",
            },
          ],
        ],
      },
    });

    const session2 = ctx.scene.session as OnboardingSession;
    session2.suggestions = suggestions;
  });

  onboardingScene.action(/select_(\d)/, async (ctx) => {
    const index = parseInt(ctx.match[1]);
    const session = ctx.scene.session as OnboardingSession;
    const suggestions = session.suggestions || [];
    const selectedUsername = suggestions[index];
    const userId = session.userId;

    if (!selectedUsername || !userId) {
      await ctx.answerCbQuery("Invalid selection", { show_alert: true });
      return;
    }

    const validation = await validateUsername(selectedUsername);

    if (!validation.valid) {
      await ctx.answerCbQuery(`❌ ${validation.message}`, { show_alert: true });
      return;
    }

    const result = await setUsername(userId, selectedUsername);

    if (!result.success) {
      await ctx.answerCbQuery(`❌ ${result.message}`, { show_alert: true });
      return;
    }

    await ctx.answerCbQuery(`✅ Username set to ${selectedUsername}!`);
    await ctx.editMessageText(
      `✅ *Great!*\n\n` +
      `Your username is now: *${selectedUsername}*\n\n` +
      `Open the game using the button below 👇`,
      {
        parse_mode: "Markdown",
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

    await ctx.scene.enter("MAIN_SCENE");
  });

  onboardingScene.on("text", async (ctx) => {
    const session = ctx.scene.session as OnboardingSession;
    const userId = session.userId;
    if (userId == null) {
      await ctx.scene.leave();
      return;
    }

    const customUsername = ctx.message.text.trim();

    const validation = await validateUsername(customUsername);

    if (!validation.valid) {
      await ctx.reply(`❌ ${validation.message}\n\nPlease try again:`);
      return;
    }

    const result = await setUsername(userId, customUsername);

    if (!result.success) {
      await ctx.reply(`❌ ${result.message}\n\nPlease try another username:`);
      return;
    }

    await ctx.reply(
      `✅ *Perfect!*\n\n` +
      `Your username is now: *${customUsername}*\n\n` +
      `Open the game using the button below 👇`,
      {
        parse_mode: "Markdown",
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

    await ctx.scene.enter("MAIN_SCENE");
  });

  return [onboardingScene];
};
