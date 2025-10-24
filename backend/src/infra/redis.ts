import Redis, { type RedisOptions } from "ioredis";
import { env } from "../config/env";

const globalForRedis = globalThis as unknown as { redis?: Redis };

const buildRedisClient = () => {
  const baseUrl = env.redisUrl ?? "redis://localhost:6379";

  const options: RedisOptions = {
    maxRetriesPerRequest: 2,
    enableReadyCheck: true,
    lazyConnect: true,
  };

  let connectionString = baseUrl;

  try {
    const parsed = new URL(baseUrl);
    const requiresRailwayTls = /\.proxy\.rlwy\.net$/i.test(parsed.hostname);
    const usesTlsProtocol = parsed.protocol === "rediss:";

    if (requiresRailwayTls || usesTlsProtocol) {
      options.tls = {
        rejectUnauthorized: false,
      };

      if (!usesTlsProtocol) {
        parsed.protocol = "rediss:";
        connectionString = parsed.toString();
      }
    }
  } catch {
    // Leave connectionString/options unchanged if parsing fails.
  }

  return new Redis(connectionString, options);
};

export const redis = globalForRedis.redis ?? buildRedisClient();

let redisLogAttached = false;

if (!redisLogAttached) {
  redis.on("ready", () => {
    console.log("Redis connection established");
  });

  redis.on("error", (error) => {
    console.error("Redis connection error", error);
  });

  redisLogAttached = true;
}

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}
