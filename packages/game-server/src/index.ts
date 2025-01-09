import data from "./data/data.ts";
import { GameServer } from "./socket/index.ts";
import Config from "config";

const port = Config.get("gameServer.port");

// TODO: Register with the central server

// TODO: Initialize game
for (const map in data.maps) {
  // TODO: Initialize maps
}

/** Game Loop */
async function gameLoop() {
  try {
    // TODO: Find monsters that aren't moving, but should be, and update them
  } catch (e) {
    console.error(e); // TODO: Log errors
  } finally {
    setTimeout(() => void gameLoop(), 1000 / 60);
  }
}
void gameLoop();

GameServer.listen(port);
console.debug("We're live!");

// Stop
async function gracefulShutdown() {
  await GameServer.close();
  console.debug("Bye bye!");
  process.exit(0);
}
// eslint-disable-next-line @typescript-eslint/no-misused-promises
process.on("SIGTERM", gracefulShutdown);
// eslint-disable-next-line @typescript-eslint/no-misused-promises
process.on("SIGINT", gracefulShutdown);
