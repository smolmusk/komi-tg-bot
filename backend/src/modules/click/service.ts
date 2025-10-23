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
    await this.ensureRateLimit(userId);

    const userTotalKey = `${USER_TOTAL_KEY_PREFIX}${userId}`;
    await redis.incrby(userTotalKey, CLICK_INCREMENT);
    await redis.pexpire(userTotalKey, RATE_LIMIT_WINDOW_MS * 10);
    await redis.incrby(GLOBAL_METRIC_KEY, CLICK_INCREMENT);

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

    await leaderboardService.updateScore(userId, Number(totalClicks));

    return {
      totalClicks: totalClicks.toString(),
      delta: CLICK_INCREMENT,
    };
  }

  private async ensureRateLimit(userId: string) {
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
      throw new Error(`Rate limit exceeded: ${usage} clicks within ${ttl}`);
    }
  }
}
