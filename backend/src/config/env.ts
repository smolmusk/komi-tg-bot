import { config as loadEnv } from "dotenv";
import { z } from "zod";

loadEnv();

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.string().default("3000"),
  DATABASE_URL: z.string().min(1).optional(),
  REDIS_URL: z.string().optional(),
  REDIS_TLS: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
  TELEGRAM_BOT_TOKEN: z.string().min(1),
  TELEGRAM_BOT_WEBHOOK: z
    .union([z.string().url(), z.literal("")])
    .optional(),
  TELEGRAM_BOT_MODE: z.enum(["polling", "webhook"]).default("polling"),
  TELEGRAM_BOT_SECRET: z.string().min(1),
  MINI_APP_URL: z.string().url(),
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
  databaseUrl: result.data.DATABASE_URL ?? process.env.DATABASE_URL,
  redisUrl: result.data.REDIS_URL ?? process.env.REDIS_URL,
  redisTls: result.data.REDIS_TLS ?? false,
  telegramBotToken: result.data.TELEGRAM_BOT_TOKEN,
  telegramBotWebhook:
    result.data.TELEGRAM_BOT_WEBHOOK != null &&
    result.data.TELEGRAM_BOT_WEBHOOK.length > 0
      ? result.data.TELEGRAM_BOT_WEBHOOK
      : undefined,
  telegramBotMode: result.data.TELEGRAM_BOT_MODE,
  telegramBotSecret: result.data.TELEGRAM_BOT_SECRET,
  miniAppUrl: result.data.MINI_APP_URL,
  rateLimitMax: Number(result.data.RATE_LIMIT_MAX),
  rateLimitWindow: Number(result.data.RATE_LIMIT_WINDOW),
};
