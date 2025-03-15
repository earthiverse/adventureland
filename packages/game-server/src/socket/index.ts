import { setupConnection } from "./events/connection.ts";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from "@adventureland/types";
import { Server } from "socket.io";

const GameServer = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>({
  cors: {
    origin: "*",
  },
});

setupConnection(GameServer);

export { GameServer };
