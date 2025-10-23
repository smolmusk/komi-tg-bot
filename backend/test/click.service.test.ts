import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { ClickService } from "../src/modules/click/service";
import { prisma } from "../src/infra/prisma";
import { redis } from "../src/infra/redis";

describe("ClickService", () => {
  const service = new ClickService();
  let userId: string;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        telegramId: "test_user",
        username: "tester",
      },
    });

    userId = user.id;
  });

  afterAll(async () => {
    await prisma.clickEvent.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();
    await redis.flushdb();
  });

  it("increments clicks and respects rate limits", async () => {
    const result = await service.registerClick(userId);
    expect(result.totalClicks).toBe("1");
  });
});
