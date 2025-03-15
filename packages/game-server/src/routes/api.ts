import { statusHandler, StatusSchema } from "./api/status.ts";
import Config from "config";
import type { FastifyInstance } from "fastify";

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
