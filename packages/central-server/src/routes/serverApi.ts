import { registerHandler, RegisterSchema } from "./serverApi/register.ts";
import { unregisterHandler, UnregisterSchema } from "./serverApi/unregister.ts";
import Config from "config";
import type { FastifyInstance } from "fastify";

export function setupServerApiRoutes(fastify: FastifyInstance) {
  fastify.post(
    "/serverApi/register",
    {
      schema: RegisterSchema,
      config: {
        rateLimit: Config.get("centralServer.signup.rateLimit"), // TODO: Proper config setting
      },
    },
    registerHandler,
  );
  fastify.post(
    "/serverApi/unregister",
    {
      schema: UnregisterSchema,
      config: {
        rateLimit: Config.get("centralServer.signup.rateLimit"), // TODO: Proper config setting
      },
    },
    unregisterHandler,
  );
}
