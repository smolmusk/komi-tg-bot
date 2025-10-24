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

  void app.register(fastifyHelmet, { 
    global: true,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
  });
  void app.register(fastifyCors, { 
    origin: true, // Allow all origins
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
  });
  void app.register(fastifyRateLimit, {
    max: env.rateLimitMax,
    timeWindow: env.rateLimitWindow,
  });
  
  try {
    void app.register(registerApi);
  } catch (error) {
    console.error("Failed to register API routes:", error);
    throw error;
  }

  // Add CORS headers to all responses
  app.addHook('onSend', async (request, reply, payload) => {
    reply.header('Access-Control-Allow-Origin', '*');
    reply.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
    reply.header('Access-Control-Allow-Credentials', 'true');
    return payload;
  });

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
    console.log("=".repeat(50));
    console.log("Starting Komi Bot Backend");
    console.log("=".repeat(50));
    console.log(`Environment: ${env.nodeEnv}`);
    console.log(`Port: ${env.port}`);
    console.log(`Database: ${env.databaseUrl ? "configured" : "not configured"}`);
    console.log(`Redis: ${env.redisUrl ? "configured" : "not configured"}`);
    console.log("=".repeat(50));

    // Start server immediately
    console.log(`Starting server on port ${env.port}...`);
    await app.listen({ port: env.port, host: "0.0.0.0" });
    console.log(`✅ Server started successfully on port ${env.port}!`);
    console.log(`✅ Health check available at http://0.0.0.0:${env.port}/health`);

    // Launch bot in background (non-blocking)
    (async () => {
      try {
        if (env.telegramBotWebhook != null) {
          console.log("Setting webhook...");
          await bot.telegram.setWebhook(env.telegramBotWebhook, {
            allowed_updates: ["message", "callback_query"],
          });
        } else {
          console.log("Launching bot...");
          console.log(`Bot token: ${env.telegramBotToken.substring(0, 10)}...`);
          
          // Test network connectivity
          try {
            console.log("Testing network connectivity...");
            const response = await fetch("https://api.telegram.org/bot" + env.telegramBotToken + "/getMe");
            console.log(`Network test response: ${response.status}`);
          } catch (error) {
            console.error("Network connectivity test failed:", (error as Error).message);
          }
          
          // Retry logic for bot connection
          let retries = 3;
          while (retries > 0) {
            try {
              await bot.launch();
              console.log("✅ Bot launched successfully!");
              break;
            } catch (error) {
              retries--;
              console.error(`Bot launch failed, retries left: ${retries}`, error);
              if (retries === 0) {
                console.error("⚠️  Bot launch failed after all retries, continuing without bot...");
              }
              await new Promise(resolve => setTimeout(resolve, 5000));
            }
          }
        }
      } catch (error) {
        console.error("❌ Error launching bot:", error);
      }
    })();

    // Schedule session cleanup in background
    try {
      await scheduleSessionCleanup();
    } catch (error) {
      console.error("Failed to schedule session cleanup:", error);
      console.log("⚠️  Continuing without session cleanup...");
    }
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    app.log.error(err);
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    bot.stop();
    process.exit(1);
  }
};

void start();
