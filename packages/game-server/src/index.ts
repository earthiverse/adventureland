import { gameLoop } from "./gameLoop.ts";
import { GameServer } from "./socket/index.ts";
import { initializeState } from "./state.ts";
import Config from "config";

const port = Config.get("gameServer.port");

initializeState();

// TODO: Register with the central server

// Main game server logic
void gameLoop()

// Start listening for players
GameServer.listen(port);
console.debug("We're live!");

// Stop logic
async function gracefulShutdown() {
  await GameServer.close();
  console.debug("Bye bye!");
  process.exit(0);
}
// eslint-disable-next-line @typescript-eslint/no-misused-promises
process.on("SIGTERM", gracefulShutdown);
// eslint-disable-next-line @typescript-eslint/no-misused-promises
process.on("SIGINT", gracefulShutdown);
