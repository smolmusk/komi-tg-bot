import { config as loadEnv } from "dotenv";
import { z } from "zod";

loadEnv();

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.string().default("3000"),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().default("redis://redis:6379/0"),
  TELEGRAM_BOT_TOKEN: z.string().min(1),
  TELEGRAM_BOT_WEBHOOK: z.string().url().optional(),
  TELEGRAM_BOT_SECRET: z.string().min(1),
  RATE_LIMIT_MAX: z.string().default("30"),
  RATE_LIMIT_WINDOW: z.string().default("60000"),
});

const result = schema.safeParse(process.env);

if (!result.success) {
  throw new Error(result.error.message);
}

export const env = {
  nodeEnv: result.data.NODE_ENV,
  port: Number(result.data.PORT),
  databaseUrl: result.data.DATABASE_URL,
  redisUrl: result.data.REDIS_URL,
  telegramBotToken: result.data.TELEGRAM_BOT_TOKEN,
  telegramBotWebhook: result.data.TELEGRAM_BOT_WEBHOOK,
  telegramBotSecret: result.data.TELEGRAM_BOT_SECRET,
  rateLimitMax: Number(result.data.RATE_LIMIT_MAX),
  rateLimitWindow: Number(result.data.RATE_LIMIT_WINDOW),
};
