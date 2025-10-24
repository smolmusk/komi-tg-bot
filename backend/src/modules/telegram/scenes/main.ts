import { Scenes, Markup } from "telegraf";
import { prisma } from "../../../infra/prisma";
import type { SessionContext } from "../types";
import { buildMainMenu } from "../ui/main-menu";
import { buildLeaderboardMessage } from "../ui/leaderboard";
import { ClickService } from "../../click/service";

const clickService = new ClickService();

export const createMainScenes = () => {
  const mainScene = new Scenes.BaseScene<SessionContext>("MAIN_SCENE");

  mainScene.enter(async (ctx) => {
    const userId = ctx.scene.session.userId;
    if (userId == null) {
      await ctx.scene.leave();
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (user == null) {
      await ctx.scene.leave();
      return;
    }

    const leaderboardText = await buildLeaderboardMessage(user.id);

    await ctx.replyWithHTML(
      `Welcome back <b>${
        user.username || user.displayName || "player"
      }</b>!\nYour total clicks: <b>${user.totalClicks.toString()}</b>\n${leaderboardText}`,
      Markup.inlineKeyboard(buildMainMenu())
    );
  });

  mainScene.action("CLICK_INCREMENT", async (ctx) => {
    try {
      const userId = ctx.scene.session.userId;
      if (userId == null) {
        await ctx.answerCbQuery("Session expired. Please restart with /start");
        return;
      }

      const { totalClicks, delta } = await clickService.registerClick(userId);

      await ctx.answerCbQuery(`+${delta} clicks! Total: ${totalClicks}`);

      await ctx.editMessageReplyMarkup(Markup.inlineKeyboard(buildMainMenu()).reply_markup);
    } catch (error) {
      await ctx.answerCbQuery("We hit a limit. Please wait a moment.", {
        show_alert: true,
      });
    }
  });

  mainScene.action("REFRESH_LEADERBOARD", async (ctx) => {
    const userId = ctx.scene.session.userId;
    if (userId == null) {
      await ctx.answerCbQuery("Session expired. Please restart with /start");
      return;
    }

    const leaderboardText = await buildLeaderboardMessage(userId);
    await ctx.editMessageText(leaderboardText, { parse_mode: "HTML" });
    await ctx.answerCbQuery("Leaderboard updated");
  });

  mainScene.leave(async (ctx) => {
    const userId = ctx.scene.session.userId;
    const chatId = ctx.scene.session.chatId;
    if (userId != null && chatId != null) {
      await prisma.session.updateMany({
        where: {
          userId,
          chatId,
          status: "ACTIVE",
        },
        data: { status: "INACTIVE" },
      });
    }
  });

  return [mainScene];
};
