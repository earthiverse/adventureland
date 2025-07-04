import Config from "config";
import type { FastifyInstance } from "fastify";
import { statusHandler, StatusSchema } from "./api/status.ts";

export function setupApiRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/api/status",
    {
      schema: StatusSchema,
      config: {
        rateLimit: Config.get("gameServer.status.rateLimit"),
      },
    },
    statusHandler,
  );
}
