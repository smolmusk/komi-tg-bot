import Fastify from "fastify";
import fastifyCors from "@fastify/cors";
import fastifyHelmet from "@fastify/helmet";
import fastifyRateLimit from "@fastify/rate-limit";
import { env } from "./config/env";
import { registerApi } from "./modules/api";
import { bot } from "./config/telegram";
import { scheduleSessionCleanup } from "./jobs/session-cleaner";

const buildServer = async () => {
  const app = Fastify({
    logger: {
      transport:
        env.nodeEnv === "development"
          ? {
              target: "pino-pretty",
              options: {
                colorize: true,
              },
            }
          : undefined,
    },
  });

  void app.register(fastifyHelmet, { global: true });
  void app.register(fastifyCors, { 
    origin: env.corsOrigin ? env.corsOrigin.split(',') : [
      "https://komi-frontend-production.up.railway.app",
      "https://komi-tg-bot-frontend.vercel.app",
      "http://localhost:5173",
      "http://localhost:3000"
    ],
    credentials: true 
  });
  void app.register(fastifyRateLimit, {
    max: env.rateLimitMax,
    timeWindow: env.rateLimitWindow,
  });
  void app.register(registerApi);

  // Health check endpoint for Railway
  app.get("/health", async (request, reply) => {
    return { status: "ok", timestamp: new Date().toISOString() };
  });

  app.addHook("onClose", async () => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    bot.stop();
  });

  // eslint-disable-next-line @typescript-eslint/return-await
  return app;
};

const start = async () => {
  const app = await buildServer();

  try {
    if (env.telegramBotWebhook != null) {
      console.log("Setting webhook...");
      await bot.telegram.setWebhook(env.telegramBotWebhook, {
        allowed_updates: ["message", "callback_query"],
      });
    } else {
      console.log("Launching bot...");
      
      // Retry logic for bot connection
      let retries = 3;
      while (retries > 0) {
        try {
          await bot.launch();
          console.log("Bot launched successfully!");
          break;
        } catch (error) {
          retries--;
          console.log(`Bot launch failed, retries left: ${retries}`);
          if (retries === 0) {
            throw error;
          }
          await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
        }
      }
    }

    await scheduleSessionCleanup();

    console.log(`Starting server on port ${env.port}...`);
    await app.listen({ port: env.port, host: "0.0.0.0" });
    console.log(`Server started successfully on port ${env.port}!`);
  } catch (err) {
    console.error("Failed to start:", err);
    app.log.error(err);
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    bot.stop();
    process.exit(1);
  }
};

void start();
