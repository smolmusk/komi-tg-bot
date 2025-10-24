import Redis, { type RedisOptions } from "ioredis";
import { env } from "../config/env";

const globalForRedis = globalThis as unknown as { redis?: Redis };

const buildRedisClient = () => {
  const baseUrl = env.redisUrl ?? "redis://localhost:6379";

  const connectionString = baseUrl;

  const options: RedisOptions = {
    connectTimeout: 30000,
    keepAlive: 30000,
    maxRetriesPerRequest: 3,
    enableReadyCheck: false,
    lazyConnect: false,
    enableOfflineQueue: true,
  };
  
  console.log(`Redis connection string: ${connectionString}`);
  console.log(`Redis TLS: disabled (no TLS config)`);

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

  redis.on("connect", () => {
    console.log("Redis connecting...");
  });

  redis.on("close", () => {
    console.log("Redis connection closed");
  });

  redisLogAttached = true;
}

// Test Redis connection with retry
const testRedisConnection = async () => {
  try {
    await redis.ping();
    console.log("Redis ping successful");
  } catch (error) {
    console.error("Redis ping failed:", error);
    console.log("⚠️  Redis is not available, app will continue without Redis features");
    // Don't throw, let the app continue without Redis
  }
};

// Test connection after a short delay
setTimeout(testRedisConnection, 1000);

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}
