import { gameLoop } from "./gameLoop.ts";
import { Logger } from "./logger.ts";
import { GameServer } from "./socket/index.ts";
import { initializeState } from "./state.ts";
import Config from "config";

const port = Config.get("gameServer.port");

initializeState();

// TODO: Register with the central server

// Main game server logic
void gameLoop();

// Start listening for players
try {
  GameServer.listen(port);
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
