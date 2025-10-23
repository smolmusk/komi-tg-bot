import type { MiddlewareFn } from "telegraf";
import { prisma } from "../../infra/prisma";
import type { SessionContext } from "../telegram/types";

export const createSessionMiddleware = (): MiddlewareFn<SessionContext> => {
  return async (ctx, next) => {
    if (ctx.from == null || ctx.chat == null) {
      return;
    }

    const telegramId = ctx.from.id.toString();
    const chatId = ctx.chat.id.toString();

    const user = await prisma.user.upsert({
      where: { telegramId },
      update: {
        lastActiveAt: new Date(),
        username: ctx.from.username ?? undefined,
        displayName:
          ctx.from.first_name != null
            ? `${ctx.from.first_name}${ctx.from.last_name != null ? ` ${ctx.from.last_name}` : ""}`
            : (ctx.from.username ?? undefined),
      },
      create: {
        telegramId,
        username: ctx.from.username,
        displayName:
          ctx.from.first_name != null
            ? `${ctx.from.first_name}${ctx.from.last_name != null ? ` ${ctx.from.last_name}` : ""}`
            : ctx.from.username,
      },
    });

    let session = await prisma.session.findFirst({
      where: {
        userId: user.id,
        chatId,
        status: "ACTIVE",
      },
    });

    if (session == null) {
      session = await prisma.session.create({
        data: {
          userId: user.id,
          chatId,
          status: "ACTIVE",
          lastHeartbeatAt: new Date(),
        },
      });
    } else {
      await prisma.session.update({
        where: { id: session.id },
        data: { lastHeartbeatAt: new Date(), status: "ACTIVE" },
      });
    }

    // Initialize scene session if it exists
    if (ctx.scene != null) {
      if (ctx.scene.session == null) {
        (ctx.scene as any).session = {};
      }
      (ctx.scene.session as any).userId = user.id;
      (ctx.scene.session as any).chatId = chatId;
    }

    await next();
  };
};
