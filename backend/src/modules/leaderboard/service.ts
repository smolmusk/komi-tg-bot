import { redis } from "../../infra/redis";
import { prisma } from "../../infra/prisma";
import { GLOBAL_METRIC_KEY, LEADERBOARD_KEY } from "../click/constants";

interface MinimalUser {
  id: string;
  username: string | null;
  displayName: string | null;
  totalClicks: bigint;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username?: string | null;
  totalClicks: string;
}

export class LeaderboardService {
  public async getTop20(): Promise<LeaderboardEntry[]> {
    const cached = await redis.zrevrange(LEADERBOARD_KEY, 0, 19, "WITHSCORES");

    if (cached.length > 0) {
      return await this.hydrateEntries(this.parseZRange(cached));
    }

    const topUsers: MinimalUser[] = await prisma.user.findMany({
      orderBy: { totalClicks: "desc" },
      take: 20,
      select: {
        id: true,
        username: true,
        displayName: true,
        totalClicks: true,
      },
    });

    const pipeline = redis.multi();

    topUsers.forEach((user) => {
      pipeline.zadd(LEADERBOARD_KEY, Number(user.totalClicks), user.id);
    });

    pipeline.expire(LEADERBOARD_KEY, 10);

    await pipeline.exec();

    return topUsers.map(
      (user, index): LeaderboardEntry => ({
        rank: index + 1,
        userId: user.id,
        username: user.username ?? user.displayName,
        totalClicks: user.totalClicks.toString(),
      })
    );
  }

  public async updateScore(userId: string, score: number) {
    await redis.multi().zadd(LEADERBOARD_KEY, score, userId).expire(LEADERBOARD_KEY, 10).exec();
  }

  public async getGlobalTotal() {
    const cached = await redis.get(GLOBAL_METRIC_KEY);

    if (cached != null) {
      return cached;
    }

    const total = await prisma.user.aggregate({ _sum: { totalClicks: true } });
    const totalClicks = total._sum.totalClicks?.toString() ?? "0";

    await redis.set(GLOBAL_METRIC_KEY, totalClicks);

    return totalClicks;
  }

  private parseZRange(entries: string[]) {
    const result: Array<{ rank: number; userId: string; totalClicks: string }> = [];

    for (let i = 0; i < entries.length; i += 2) {
      const userId = entries[i];
      const score = entries[i + 1];

      result.push({
        rank: i / 2 + 1,
        userId,
        totalClicks: score,
      });
    }

    return result;
  }

  private async hydrateEntries(
    entries: Array<{ rank: number; userId: string; totalClicks: string }>
  ): Promise<LeaderboardEntry[]> {
    if (entries.length === 0) {
      return [];
    }

    const users: MinimalUser[] = await prisma.user.findMany({
      where: { id: { in: entries.map((entry) => entry.userId) } },
      select: {
        id: true,
        username: true,
        displayName: true,
        totalClicks: true,
      },
    });

    return entries.map((entry) => {
      const user = users.find((candidate) => candidate.id === entry.userId);
      return {
        ...entry,
        username: user?.username ?? user?.displayName ?? "Anonymous",
      };
    });
  }
}
