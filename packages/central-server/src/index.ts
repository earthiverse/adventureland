import { Logger } from "./logger.ts";
import { setupApiRoutes } from "./routes/api.ts";
import { setupServerApiRoutes } from "./routes/serverApi.ts";
import { type TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import Config from "config";
import Fastify from "fastify";
import { StatusCodes } from "http-status-codes";

const port = Config.get("centralServer.port");

const fastify = Fastify().withTypeProvider<TypeBoxTypeProvider>();
await fastify.register(import("@fastify/rate-limit"));

// Setup error handler
fastify.setErrorHandler((error, request, reply) => {
  // 429
  if (error.statusCode === StatusCodes.TOO_MANY_REQUESTS) {
    Logger.debug("Rate limiting", { ip: request.ip, url: request.url });
    return reply.code(StatusCodes.TOO_MANY_REQUESTS).send({
      error: "Too many requests. Slow down, please!",
    });
  }

  // 500
  if (error.statusCode === StatusCodes.INTERNAL_SERVER_ERROR) {
    Logger.error("Unhandled Error", { error, request });
    return reply
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send(
        new Error(
          "It looks like something went VERY wrong. Please contact support with the current URL.",
        ),
      );
  }

  return reply.send(error);
});

// Setup routes
setupApiRoutes(fastify);
setupServerApiRoutes(fastify);

// Start server
try {
  await fastify.listen({ port, host: "0.0.0.0" });
} catch (error) {
  Logger.alert("Failed starting!", { error });
  process.exit(1);
}

Logger.notice("Started!", { port });

// Shutdown logic
async function gracefulShutdown() {
  Logger.warning("Shutting down!");
  let exitCode = 0;

  try {
    await fastify.close();
  } catch (error) {
    Logger.error("Error closing fastify", { error });
    exitCode++;
  }

  Logger.end();
  process.exit(exitCode);
}
// eslint-disable-next-line @typescript-eslint/no-misused-promises
process.on("SIGTERM", gracefulShutdown);
// eslint-disable-next-line @typescript-eslint/no-misused-promises
process.on("SIGINT", gracefulShutdown);
