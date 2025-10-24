import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { ClickService } from "../../click/service";
import { prisma } from "../../../infra/prisma";

const clickService = new ClickService();

const clickSchema = z
  .object({
    userId: z.string().min(1), // This will be telegramId from frontend
  })
  .strict();

export const registerClickRoutes = async (app: FastifyInstance) => {
  app.post("/", async (request, reply) => {
    const parseResult = clickSchema.safeParse(request.body);

    if (!parseResult.success) {
      return await reply.status(400).send({ error: "Invalid payload" });
    }

    const { userId: telegramId } = parseResult.data;

    try {
      // Find user by telegramId
      const user = await prisma.user.findUnique({
        where: { telegramId },
      });

      if (!user) {
        return await reply.status(404).send({ error: "User not found" });
      }

      const output = await clickService.registerClick(user.id);
      await reply.status(200).send(output);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      if (message.includes("Rate limit")) {
        await reply.status(429).send({ error: "Rate limit exceeded" });
      } else {
        await reply.status(500).send({ error: message });
      }
    }
  });
};
