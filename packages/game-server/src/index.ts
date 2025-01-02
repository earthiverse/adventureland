import { GameServer } from "./socket/index.ts";
import Config from "config";

const port = Config.get("gameServer.port");

// TODO: Register with the central server

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
