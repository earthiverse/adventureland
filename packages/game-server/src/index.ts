import { gameLoop } from "./gameLoop.ts";
import { Logger } from "./logger.ts";
import { GameServer } from "./socket/index.ts";
import { initializeState } from "./state.ts";
import Config from "config";
import Fastify from "fastify";

const port = Config.get("gameServer.port");

const fastify = Fastify();

initializeState();

// TODO: Register with the central server

// Main game server logic
void gameLoop();

try {
  // Listen for websockets
  GameServer.listen(fastify.server);

  // Listen for API requests
  await fastify.listen({ port, host: "0.0.0.0" });
} catch (error) {
  Logger.alert("Failed starting!", { error });
  process.exit(1);
}

// TODO: Status API route

Logger.notice("Started!", { port });

// Stop logic
function gracefulShutdown() {
  Logger.warning("Shutting down!");
  // TODO: Close API route
  GameServer.close()
    .then(() => {
      Logger.end();
      process.exit(0);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
// eslint-disable-next-line @typescript-eslint/no-misused-promises
process.on("SIGTERM", gracefulShutdown);
// eslint-disable-next-line @typescript-eslint/no-misused-promises
process.on("SIGINT", gracefulShutdown);
