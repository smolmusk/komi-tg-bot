import {
  CLICK_INCREMENT,
  USER_TOTAL_KEY_PREFIX,
  GLOBAL_METRIC_KEY,
  RATE_LIMIT_KEY_PREFIX,
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX_ACTIONS,
} from "./constants";
import { redis } from "../../infra/redis";
import { prisma } from "../../infra/prisma";
import { LeaderboardService } from "../leaderboard/service";

const leaderboardService = new LeaderboardService();

export class ClickService {
  public async registerClick(userId: string) {
    const rateLimitResult = await this.ensureRateLimit(userId);
    
    if (!rateLimitResult.allowed) {
      throw new Error(`Rate limit exceeded. Try again in ${Math.ceil((rateLimitResult.retryAfter || 1000) / 1000)} seconds.`);
    }

    const userTotalKey = `${USER_TOTAL_KEY_PREFIX}${userId}`;
    await redis.incrby(userTotalKey, CLICK_INCREMENT);
    await redis.pexpire(userTotalKey, RATE_LIMIT_WINDOW_MS * 10);
    await redis.incrby(GLOBAL_METRIC_KEY, CLICK_INCREMENT);

    // Get the current Redis value for leaderboard update
    const currentRedisTotal = await redis.get(userTotalKey);

    const { totalClicks } = await prisma.user.update({
      where: { id: userId },
      data: {
        totalClicks: {
          increment: CLICK_INCREMENT,
        },
        clicks: {
          increment: CLICK_INCREMENT,
        },
        lastActiveAt: new Date(),
      },
      select: {
        totalClicks: true,
      },
    });

    await prisma.clickEvent.create({
      data: {
        userId,
        delta: BigInt(CLICK_INCREMENT),
        totalClicks,
      },
    });

    // Use Redis value for leaderboard update to ensure consistency
    await leaderboardService.updateScore(userId, Number(currentRedisTotal));

    return {
      totalClicks: totalClicks.toString(),
      delta: CLICK_INCREMENT,
    };
  }

  private async ensureRateLimit(userId: string): Promise<{ allowed: boolean; retryAfter?: number; usage?: number }> {
    const key = `${RATE_LIMIT_KEY_PREFIX}${userId}`;

    const results = await redis.multi().incr(key).pttl(key).exec();

    if (results == null) {
      throw new Error("Failed to enforce rate limit");
    }

    const usage = Number(results[0][1]);
    const ttl = Number(results[1][1]);

    if (usage === 1) {
      await redis.pexpire(key, RATE_LIMIT_WINDOW_MS);
    }

    await redis.set(
      "metrics:rate_limit_usage",
      usage.toString(),
      "EX",
      Math.ceil(RATE_LIMIT_WINDOW_MS / 1000)
    );

    if (usage > RATE_LIMIT_MAX_ACTIONS) {
      return {
        allowed: false,
        retryAfter: ttl > 0 ? ttl : RATE_LIMIT_WINDOW_MS,
        usage
      };
    }

    return { allowed: true, usage };
  }
}
