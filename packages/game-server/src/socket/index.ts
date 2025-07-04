import type { ClientToServerEvents, InterServerEvents, ServerToClientEvents, SocketData } from "@adventureland/types";
import { Server } from "socket.io";
import { setupConnection } from "./events/connection.ts";

const GameServer = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>({
  cors: {
    origin: "*",
  },
});

setupConnection(GameServer);

export { GameServer };
