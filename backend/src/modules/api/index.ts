import type { FastifyPluginAsync } from "fastify";
import { registerSessionRoutes } from "./routes/session";
import { registerLeaderboardRoutes } from "./routes/leaderboard";
import { registerMetricsRoutes } from "./routes/metrics";
import { registerClickRoutes } from "./routes/clicks";

export const registerApi: FastifyPluginAsync = async (app) => {
  await app.register(registerSessionRoutes, { prefix: "/api/sessions" });
  await app.register(registerLeaderboardRoutes, { prefix: "/api/leaderboard" });
  await app.register(registerMetricsRoutes, { prefix: "/api/metrics" });
  await app.register(registerClickRoutes, { prefix: "/api/clicks" });
};
