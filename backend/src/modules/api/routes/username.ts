import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { getUsernamesSuggestions, validateUsername, setUsername } from "../../username/service";

const suggestionsSchema = z.object({
  telegramUsername: z.string().optional(),
});

const validateSchema = z.object({
  username: z.string().min(1),
});

const setUsernameSchema = z.object({
  userId: z.string().min(1),
  username: z.string().min(1),
});

export const registerUsernameRoutes = async (app: FastifyInstance) => {
  app.post("/suggestions", async (request, reply) => {
    try {
      const parseResult = suggestionsSchema.safeParse(request.body);

      if (!parseResult.success) {
        return await reply.status(400).send({ error: "Invalid payload" });
      }

      const { telegramUsername } = parseResult.data;
      const suggestions = getUsernamesSuggestions(telegramUsername);

      await reply.send({ suggestions });
    } catch (error) {
      console.error("Username suggestions error:", error);
      await reply.status(500).send({ error: "Internal server error" });
    }
  });

  app.post("/validate", async (request, reply) => {
    try {
      const parseResult = validateSchema.safeParse(request.body);

      if (!parseResult.success) {
        return await reply.status(400).send({ error: "Invalid payload" });
      }

      const { username } = parseResult.data;
      const validation = await validateUsername(username);

      await reply.send(validation);
    } catch (error) {
      console.error("Username validation error:", error);
      await reply.status(500).send({ error: "Internal server error" });
    }
  });

  app.post("/set", async (request, reply) => {
    try {
      const parseResult = setUsernameSchema.safeParse(request.body);

      if (!parseResult.success) {
        return await reply.status(400).send({ error: "Invalid payload" });
      }

      const { userId, username } = parseResult.data;
      const result = await setUsername(userId, username);

      if (!result.success) {
        return await reply.status(400).send(result);
      }

      await reply.send(result);
    } catch (error) {
      console.error("Set username error:", error);
      await reply.status(500).send({ error: "Internal server error" });
    }
  });
};
