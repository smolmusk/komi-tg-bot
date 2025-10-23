import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { ClickService } from "../../click/service";

const clickService = new ClickService();

const clickSchema = z
  .object({
    userId: z.string().min(1),
  })
  .strict();

export const registerClickRoutes = async (app: FastifyInstance) => {
  app.post("/", async (request, reply) => {
    const parseResult = clickSchema.safeParse(request.body);

    if (!parseResult.success) {
      return await reply.status(400).send({ error: "Invalid payload" });
    }

    const { userId } = parseResult.data;

    try {
      const output = await clickService.registerClick(userId);
      await reply.status(200).send(output);
    } catch (error) {
      await reply.status(429).send({ error: "Rate limit exceeded" });
    }
  });
};
