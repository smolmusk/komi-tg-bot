import type { FastifyInstance } from "fastify";
import { prisma } from "../../../infra/prisma";
import { redis } from "../../../infra/redis";

export const registerUserRoutes = async (app: FastifyInstance) => {
  app.get("/telegram/:telegramId", async (request, reply) => {
    try {
      const { telegramId } = request.params as { telegramId: string };

      const user = await prisma.user.findUnique({
        where: { telegramId },
        select: {
          id: true,
          username: true,
          displayName: true,
          clicks: true,
          totalClicks: true,
          lastActiveAt: true,
          createdAt: true,
        },
      });

      if (!user) {
        return await reply.status(404).send({ error: "User not found" });
      }

      // Calculate rank from database - count users with higher totalClicks
      const rank = await prisma.user.count({
        where: {
          totalClicks: {
            gt: user.totalClicks,
          },
        },
      }) + 1;

      await reply.send({
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        clicks: String(user.clicks),
        totalClicks: String(user.totalClicks),
        lastActiveAt: user.lastActiveAt?.toISOString() || null,
        createdAt: user.createdAt.toISOString(),
        rank,
      });
    } catch (error) {
      console.error("User stats error:", error);
      await reply.status(500).send({ error: "Internal server error" });
    }
  });

  app.get("/:userId", async (request, reply) => {
    try {
      const { userId } = request.params as { userId: string };

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          clicks: true,
          totalClicks: true,
          lastActiveAt: true,
          createdAt: true,
        },
      });

      if (!user) {
        return await reply.status(404).send({ error: "User not found" });
      }

      // Calculate rank from database - count users with higher totalClicks
      const rank = await prisma.user.count({
        where: {
          totalClicks: {
            gt: user.totalClicks,
          },
        },
      }) + 1;

      await reply.send({
        id: user.id,
        username: user.username,
        clicks: String(user.clicks),
        totalClicks: String(user.totalClicks),
        lastActiveAt: user.lastActiveAt?.toISOString() || null,
        createdAt: user.createdAt.toISOString(),
        rank,
      });
    } catch (error) {
      console.error("User stats error:", error);
      await reply.status(500).send({ error: "Internal server error" });
    }
  });
};
