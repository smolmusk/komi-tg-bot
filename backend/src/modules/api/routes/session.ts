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
        return await reply.status(400).send({ error: "Invalid payload" });
      }

      const { userId, chatId } = parseResult.data;

      // Try to update existing session
      const updated = await prisma.session.updateMany({
        where: {
          userId,
          status: "ACTIVE",
          ...(chatId != null ? { chatId } : {}),
        },
        data: { lastHeartbeatAt: new Date() },
      });

      // If no session exists, create one
      if (updated.count === 0) {
        await prisma.session.create({
          data: {
            userId,
            chatId: chatId ?? "unknown",
            status: "ACTIVE",
            lastHeartbeatAt: new Date(),
          },
        });
      }

      await reply.send({ status: "ok" });
    } catch (error) {
      const err = error as any;
      // Handle missing table gracefully
      if (err.code === "P2021") {
        console.error("Session table not initialized:", err.message);
        return await reply.status(503).send({ error: "Database not initialized" });
      }
      throw error;
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
