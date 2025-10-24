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

      const rankKey = "leaderboard:realtime";
      const userRank = await redis.zrevrank(rankKey, user.id);
      const rank = userRank !== null ? userRank + 1 : null;

      // Get current total clicks from Redis for real-time value
      const userTotalKey = `user:total:${user.id}`;
      const currentTotal = await redis.get(userTotalKey);
      const totalClicks = currentTotal || String(user.totalClicks);

      await reply.send({
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        clicks: String(user.clicks),
        totalClicks: totalClicks,
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

      const rankKey = "leaderboard:realtime";
      const userRank = await redis.zrevrank(rankKey, userId);
      const rank = userRank !== null ? userRank + 1 : null;

      // Get current total clicks from Redis for real-time value
      const userTotalKey = `user:total:${user.id}`;
      const currentTotal = await redis.get(userTotalKey);
      const totalClicks = currentTotal || String(user.totalClicks);

      await reply.send({
        id: user.id,
        username: user.username,
        clicks: String(user.clicks),
        totalClicks: totalClicks,
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
