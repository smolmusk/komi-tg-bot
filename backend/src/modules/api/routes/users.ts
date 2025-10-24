import type { FastifyInstance } from "fastify";
import { prisma } from "../../../infra/prisma";
import { redis } from "../../../infra/redis";

export const registerUserRoutes = async (app: FastifyInstance) => {
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

      const rankKey = "leaderboard:rank";
      const userRank = await redis.zrevrank(rankKey, userId);
      const rank = userRank !== null ? userRank + 1 : 999999;

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
