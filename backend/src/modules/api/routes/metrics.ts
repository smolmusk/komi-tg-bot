import type { FastifyInstance } from "fastify";
import { redis } from "../../../infra/redis";

export const registerMetricsRoutes = async (app: FastifyInstance) => {
  app.get("/health", async (_request, reply) => {
    await reply.send({ status: "ok" });
  });

  app.get("/rate-limit", async (_request, reply) => {
    const usage = await redis.get("metrics:rate_limit_usage");

    await reply.send({ usage: usage != null ? Number(usage) : 0 });
  });
};
