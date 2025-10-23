import type { FastifyInstance } from "fastify";
import { prisma } from "../../../infra/prisma";
import { redis } from "../../../infra/redis";
import type { LeaderboardEntry } from "../../leaderboard/service";

interface LeaderboardPayload extends LeaderboardEntry {}

const LEADERBOARD_KEY = "leaderboard:top20";
const GLOBAL_CLICKS_KEY = "metrics:global_clicks";
const CACHE_TTL_SECONDS = 15;

export const registerLeaderboardRoutes = async (app: FastifyInstance) => {
  app.get("/", async (_request, reply) => {
    const cached = await redis.get(LEADERBOARD_KEY);

    if (cached != null) {
      await reply.send(JSON.parse(cached) as LeaderboardPayload[]);
      return;
    }

    const topUsers: Array<{
      id: string;
      username: string | null;
      displayName: string | null;
      totalClicks: bigint;
    }> = await prisma.user.findMany({
      orderBy: { totalClicks: "desc" },
      take: 20,
      select: {
        id: true,
        username: true,
        displayName: true,
        totalClicks: true,
      },
    });

    const payload: LeaderboardPayload[] = topUsers.map((user, index) => ({
      rank: index + 1,
      userId: user.id,
      username: user.username ?? user.displayName,
      totalClicks: user.totalClicks.toString(),
    }));

    await redis.set(LEADERBOARD_KEY, JSON.stringify(payload), "EX", CACHE_TTL_SECONDS);

    await reply.send(payload);
  });

  app.get("/global", async (_request, reply) => {
    const cached = await redis.get(GLOBAL_CLICKS_KEY);

    if (cached != null) {
      await reply.send({ totalClicks: cached });
      return;
    }

    const total = await prisma.user.aggregate({ _sum: { totalClicks: true } });
    const totalClicks = total._sum.totalClicks?.toString() ?? "0";

    await redis.set(GLOBAL_CLICKS_KEY, totalClicks, "EX", CACHE_TTL_SECONDS);

    await reply.send({ totalClicks });
  });
};
