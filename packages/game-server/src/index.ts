import Config from "config";
import Fastify from "fastify";
import { gameLoop } from "./gameLoop.ts";
import { Logger } from "./logger.ts";
import { registerWithCentralServer, unregisterWithCentralServer } from "./registration.ts";
import { setupApiRoutes } from "./routes/api.ts";
import { GameServer } from "./socket/index.ts";
import { initializeState } from "./state.ts";

const port = Config.get("gameServer.port");

const fastify = Fastify();

initializeState();

// Start game server logic
try {
  await gameLoop(true);
} catch (error) {
  Logger.alert("Failed executing initial game loop!", { error });
  process.exit(1);
}

// Setup routes
setupApiRoutes(fastify);

try {
  // Listen for websockets
  GameServer.listen(fastify.server);

  // Listen for API requests
  await fastify.listen({ port, host: "0.0.0.0" });
} catch (error) {
  Logger.alert("Failed starting!", { error });
  Logger.end();
  process.exit(1);
}

// Register with the central server
if (!(await registerWithCentralServer())) {
  Logger.end();
  process.exit(1);
}

Logger.notice("Started!", { port });

// Shutdown logic
async function gracefulShutdown() {
  Logger.warning("Shutting down!");
  let exitCode = 0;

  // Unregister with the central server
  if (!(await unregisterWithCentralServer())) {
    exitCode += 1;
  }

  try {
    await GameServer.close();
  } catch (error) {
    Logger.error("Error closing socket.io", { error });
    exitCode += 2;
  }

  try {
    await fastify.close();
  } catch (error) {
    Logger.error("Error closing fastify", { error });
    exitCode += 4;
  }

  Logger.end();
  process.exit(exitCode);
}
// eslint-disable-next-line @typescript-eslint/no-misused-promises
process.on("SIGTERM", gracefulShutdown);
// eslint-disable-next-line @typescript-eslint/no-misused-promises
process.on("SIGINT", gracefulShutdown);
