import { Scenes } from "telegraf";
import { prisma } from "../../../infra/prisma";
import type { SessionContext } from "../types";

export const createOnboardingScenes = () => {
  const onboardingScene = new Scenes.BaseScene<SessionContext>("ONBOARDING_SCENE");

  onboardingScene.enter(async (ctx) => {
    const userId = ctx.scene.session.userId;
    if (userId == null) {
      await ctx.scene.leave();
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (user?.username != null) {
      await ctx.scene.enter("MAIN_SCENE");
      return;
    }

    await ctx.reply("Welcome! Please share your preferred username to get started.");
  });

  onboardingScene.on("text", async (ctx) => {
    const userId = ctx.scene.session.userId;
    if (userId == null) {
      await ctx.scene.leave();
      return;
    }

    const username = ctx.message.text.trim();

    if (username.length === 0 || username.length > 32) {
      await ctx.reply("Usernames must be between 1 and 32 characters. Please try again.");
      return;
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        username,
        lastActiveAt: new Date(),
      },
    });

    await ctx.reply(`Thanks ${username}! Loading your profile...`);
    await ctx.scene.enter("MAIN_SCENE");
  });

  return [onboardingScene];
};
