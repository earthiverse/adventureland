import { type TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import Config from "config";
import Fastify from "fastify";
import { StatusCodes } from "http-status-codes";
import { checkLoop } from "./checkLoop.ts";
import { Logger } from "./logger.ts";
import { setupApiRoutes } from "./routes/api.ts";
import { setupServerApiRoutes } from "./routes/serverApi.ts";

const fastify = Fastify().withTypeProvider<TypeBoxTypeProvider>();
await fastify.register(import("@fastify/rate-limit"));
fastify.register(import("@fastify/cors"), {
  methods: ["GET", "POST"], // Allowed HTTP methods
  allowedHeaders: ["Content-Type", "Authorization"], // Allowed headers
  credentials: true,
  ...Config.get("centralServer.cors"),
});

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
      .send(new Error("It looks like something went VERY wrong. Please contact support with the current URL."));
  }

  return reply.send(error);
});

// Setup routes
setupApiRoutes(fastify);
setupServerApiRoutes(fastify);

// Start server
const port = Config.get("centralServer.port");
try {
  await fastify.listen({ port, host: "0.0.0.0" });
} catch (error) {
  Logger.alert("Failed starting!", { error });
  process.exit(1);
}

// Start health check loop
try {
  await checkLoop(true);
} catch (error) {
  Logger.alert("Failed executing initial health loop!", { error });
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
