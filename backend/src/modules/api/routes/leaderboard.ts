import type { FastifyInstance } from "fastify";
import { prisma } from "../../../infra/prisma";
import { redis } from "../../../infra/redis";
import { LeaderboardService } from "../../leaderboard/service";
import type { LeaderboardEntry } from "../../leaderboard/service";

const leaderboardService = new LeaderboardService();

interface LeaderboardPayload extends LeaderboardEntry {}

const LEADERBOARD_KEY = "leaderboard:top20";
const GLOBAL_CLICKS_KEY = "metrics:global_clicks";
const CACHE_TTL_SECONDS = 15;

export const registerLeaderboardRoutes = async (app: FastifyInstance) => {
  app.get("/", async (request, reply) => {
    try {
      const { userId } = request.query as { userId?: string };
      
      if (userId) {
        // Use the new method that includes current user position
        const result = await leaderboardService.getTop20WithUser(userId);
        await reply.send({
          entries: result.entries,
          userRank: result.userRank,
        });
      } else {
        // Fallback to original method
        const entries = await leaderboardService.getTop20();
        await reply.send({
          entries,
          userRank: null,
        });
      }
    } catch (error) {
      const err = error as any;
      // Check if database table doesn't exist
      if (err.code === "P2021") {
        console.error("Database table missing, returning 503:", err.message);
        await reply.code(503).send({ error: "Database not initialized. Please redeploy." });
        return;
      }
      throw error;
    }
  });

  app.get("/global", async (_request, reply) => {
    try {
      const cached = await redis.get(GLOBAL_CLICKS_KEY);

      if (cached != null) {
        await reply.send({ totalClicks: cached });
        return;
      }

      const total = await prisma.user.aggregate({ _sum: { totalClicks: true } });
      const totalClicks = total._sum.totalClicks?.toString() ?? "0";

      await redis.set(GLOBAL_CLICKS_KEY, totalClicks, "EX", CACHE_TTL_SECONDS);

      await reply.send({ totalClicks });
    } catch (error) {
      const err = error as any;
      // Check if database table doesn't exist
      if (err.code === "P2021") {
        console.error("Database table missing, returning 503:", err.message);
        await reply.code(503).send({ error: "Database not initialized. Please redeploy." });
        return;
      }
      throw error;
    }
  });
};
