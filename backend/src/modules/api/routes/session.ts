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
    const parseResult = heartbeatSchema.safeParse(request.body);

    if (!parseResult.success) {
      return await reply.status(400).send({ error: "Invalid payload" });
    }

    const { userId, chatId } = parseResult.data;

    await prisma.session.updateMany({
      where: {
        userId,
        status: "ACTIVE",
        ...(chatId != null ? { chatId } : {}),
      },
      data: { lastHeartbeatAt: new Date() },
    });

    await reply.send({ status: "ok" });
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
