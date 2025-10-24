import type { FastifyPluginAsync } from "fastify";
import { registerSessionRoutes } from "./routes/session";
import { registerLeaderboardRoutes } from "./routes/leaderboard";
import { registerMetricsRoutes } from "./routes/metrics";
import { registerClickRoutes } from "./routes/clicks";
import { registerUsernameRoutes } from "./routes/username";
import { registerUserRoutes } from "./routes/users";

export const registerApi: FastifyPluginAsync = async (app) => {
  await app.register(registerSessionRoutes, { prefix: "/api/sessions" });
  await app.register(registerLeaderboardRoutes, { prefix: "/api/leaderboard" });
  await app.register(registerMetricsRoutes, { prefix: "/api/metrics" });
  await app.register(registerClickRoutes, { prefix: "/api/clicks" });
  await app.register(registerUsernameRoutes, { prefix: "/api/username" });
  await app.register(registerUserRoutes, { prefix: "/api/users" });
};
