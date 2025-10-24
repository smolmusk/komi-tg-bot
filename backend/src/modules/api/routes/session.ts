import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../../../infra/prisma";

const heartbeatSchema = z
  .object({
    userId: z.string().min(1),
    chatId: z.string().min(1).optional(),
  })
  .strict();

const terminateSchema = z
  .object({
    userId: z.string().min(1),
  })
  .strict();

export const registerSessionRoutes = async (app: FastifyInstance) => {
  app.get("/", async (request, reply) => {
    const activeCount = await prisma.session.count({ where: { status: "ACTIVE" } });
    const inactiveCount = await prisma.session.count({ where: { status: "INACTIVE" } });

    await reply.send({
      active: activeCount,
      inactive: inactiveCount,
    });
  });

  app.post("/heartbeats", async (request, reply) => {
    try {
      const parseResult = heartbeatSchema.safeParse(request.body);

      if (!parseResult.success) {
        console.error("❌ Invalid heartbeat payload:", parseResult.error);
        return await reply.status(400).send({ error: "Invalid payload" });
      }

      const { userId: telegramId, chatId } = parseResult.data;
      console.log("📍 Heartbeat received:", { telegramId, chatId });

      let user = await prisma.user.findUnique({
        where: { telegramId },
      });

      if (!user) {
        console.log("📝 Creating user for telegramId:", telegramId);
        user = await prisma.user.create({
          data: {
            telegramId,
            username: null,
            displayName: `User ${telegramId}`,
            clicks: 0,
            totalClicks: 0,
            lastActiveAt: new Date(),
          },
        });
        console.log("✅ User created:", user.id);
      }

      try {
        let session = await prisma.session.findFirst({
          where: {
            userId: user.id,
            status: "ACTIVE",
            ...(chatId != null ? { chatId } : {}),
          },
        });

        if (session) {
          await prisma.session.update({
            where: { id: session.id },
            data: { lastHeartbeatAt: new Date() },
          });
          console.log("✅ Updated session heartbeat");
        } else {
          // Create new session
          console.log("📝 Creating new session for userId:", user.id);
          await prisma.session.create({
            data: {
              userId: user.id,
              chatId: chatId ?? "unknown",
              status: "ACTIVE",
              lastHeartbeatAt: new Date(),
            },
          });
          console.log("✅ New session created");
        }

        await reply.send({ status: "ok" });
      } catch (dbError) {
        const err = dbError as any;
        console.error("❌ Database error in heartbeat:", err.code, err.message);

        if (err.code === "P2021") {
          console.error("Session table not initialized");
          return await reply.status(503).send({ error: "Database not initialized" });
        }

        throw dbError;
      }
    } catch (error) {
      console.error("❌ Heartbeat error:", error);
      const err = error as any;
      await reply.status(500).send({ error: err.message || "Internal server error" });
    }
  });

  app.post("/terminate", async (request, reply) => {
    const parseResult = terminateSchema.safeParse(request.body);

    if (!parseResult.success) {
      return await reply.status(400).send({ error: "Invalid payload" });
    }

    const { userId } = parseResult.data;

    await prisma.session.updateMany({
      where: {
        userId,
        status: "ACTIVE",
      },
      data: { status: "TERMINATED" },
    });

    await reply.send({ status: "terminated" });
  });
};
