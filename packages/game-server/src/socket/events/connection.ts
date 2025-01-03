import { Characters } from "../../database.ts";
import { verifier } from "../../jwt.ts";
import type { GameServer } from "../index.ts";
import type { AuthToken } from "@adventureland/types";
import config from "config";

const maxActiveCharacters = config.get("gameServer.maxActiveCharacters");
const serverId = config.get("gameServer.id");

export function setupConnection(gameServer: typeof GameServer) {
  // socket.io middleware that performs authentication and limit checks
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  gameServer.use(async (socket, next) => {
    const token = socket.handshake.auth.token as string | undefined;
    if (token === undefined) return next(new Error("No auth token provided"));

    const jwt = verifier(token) as AuthToken | undefined;
    if (jwt === undefined) return next(new Error("Invalid auth token"));

    const characterId = socket.handshake.auth.characterId as string | undefined;
    if (characterId === undefined)
      return next(new Error("No character ID provided"));

    try {
      const numActiveCharacters = await Characters.countDocuments({
        accountId: jwt.accountId,
      });

      if (numActiveCharacters >= maxActiveCharacters) {
        return next(new Error("Too many active characters"));
      }

      const character = await Characters.findOne({ id: characterId });
      if (character === null) return next(new Error("Character not found"));
      if (character.accountId !== jwt.accountId)
        return next(new Error("Character does not belong to you"));
      if (character.online !== undefined)
        return next(new Error("Character is online"));

      // Add data to the socket
      socket.data.character = character;
    } catch (error) {
      console.error(error); // TODO: Log the error
      return next(
        new Error("An unexpected error occurred while authenticating"),
      );
    }

    return next();
  });

  // Set the character to online when they connect, and offline when they disconnect
  gameServer.on("connection", async (socket) => {
    // Set the character online
    await Characters.updateOne(
      { id: socket.data.character.id },
      { $set: { online: serverId } },
    );

    socket.on("disconnect", async () => {
      // Set character offline
      await Characters.updateOne(
        { id: socket.data.character.id },
        { $unset: { online: true } },
      );
    });
  });
}
