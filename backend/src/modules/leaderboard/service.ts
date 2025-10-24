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
    // Always fetch fresh data from database - no caching needed
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

    // Use database values directly
    return topUsers.map(
      (user, index): LeaderboardEntry => ({
        rank: index + 1,
        userId: user.id,
        username: user.username ?? user.displayName,
        totalClicks: user.totalClicks.toString(),
      })
    );
  }

  public async getTop20WithUser(currentUserId: string): Promise<{
    entries: LeaderboardEntry[];
    userRank: LeaderboardEntry | null;
  }> {
    // Get top 20 users
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

    // Check if current user is in top 20
    const currentUserInTop20 = topUsers.find(user => user.id === currentUserId);
    
    let entries = topUsers.map(
      (user, index): LeaderboardEntry => ({
        rank: index + 1,
        userId: user.id,
        username: user.username ?? user.displayName,
        totalClicks: user.totalClicks.toString(),
      })
    );

    let userRank: LeaderboardEntry | null = null;

    if (currentUserInTop20) {
      // User is in top 20, find their position
      const userIndex = topUsers.findIndex(user => user.id === currentUserId);
      userRank = {
        rank: userIndex + 1,
        userId: currentUserId,
        username: currentUserInTop20.username ?? currentUserInTop20.displayName,
        totalClicks: currentUserInTop20.totalClicks.toString(),
      };
    } else {
      // User is not in top 20, get their rank and replace the 20th position
      const userRankCount = await prisma.user.count({
        where: {
          totalClicks: {
            gt: topUsers[19]?.totalClicks || BigInt(0),
          },
        },
      });

      const currentUser = await prisma.user.findUnique({
        where: { id: currentUserId },
        select: {
          id: true,
          username: true,
          displayName: true,
          totalClicks: true,
        },
      });

      if (currentUser) {
        userRank = {
          rank: userRankCount + 1,
          userId: currentUserId,
          username: currentUser.username ?? currentUser.displayName,
          totalClicks: currentUser.totalClicks.toString(),
        };

        // Replace the 20th position with current user
        entries[19] = userRank;
      }
    }

    return { entries, userRank };
  }

  public async updateScore(userId: string, score: number) {
    // No longer needed - leaderboard uses database as single source of truth
    // Database is updated in click service, so leaderboard will reflect changes on next fetch
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

    // Use database values directly
    return entries.map((entry) => {
      const user = users.find((candidate) => candidate.id === entry.userId);
      return {
        ...entry,
        username: user?.username ?? user?.displayName ?? "Anonymous",
        totalClicks: user?.totalClicks.toString() ?? entry.totalClicks,
      };
    });
  }
}
