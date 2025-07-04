import type { AuthToken } from "@adventureland/types";
import config from "config";
import { Characters } from "../../database.ts";
import { verifier } from "../../jwt.ts";
import { Logger } from "../../logger.ts";
import type { GameServer } from "../index.ts";

const maxActiveCharacters = config.get("gameServer.maxActiveCharacters");
const serverId = config.get("gameServer.id");

export function setupConnection(gameServer: typeof GameServer) {
  // socket.io middleware that performs authentication and limit checks
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  gameServer.use(async (socket, next) => {
    const token = socket.handshake.auth.token as string | undefined;
    if (token === undefined) return next(new Error("No auth token provided"));

    let jwt: AuthToken;
    try {
      jwt = verifier(token) as AuthToken;
    } catch {
      return next(new Error("Invalid auth token"));
    }

    const characterId = socket.handshake.auth.characterId as string | undefined;
    if (characterId === undefined) return next(new Error("No character ID provided"));

    try {
      const numActiveCharacters = await Characters.countDocuments({
        accountId: jwt.accountId,
      });

      if (numActiveCharacters >= maxActiveCharacters) {
        return next(new Error("Too many active characters"));
      }

      const character = await Characters.findOne({ id: characterId });
      if (character === null) {
        Logger.info("Attempt to start a character which does not exist", {
          ip: socket.handshake.address,
          accountId: jwt.accountId,
          characterId,
        });
        return next(new Error("Character not found"));
      }
      if (character.accountId !== jwt.accountId) {
        Logger.info("Attempt to start a character which does not belong to the user", {
          ip: socket.handshake.address,
          accountId: jwt.accountId,
          characterId,
        });
        return next(new Error("Character does not belong to you"));
      }
      if (character.online !== undefined) return next(new Error("Character is online"));

      // Add data to the socket
      socket.data.character = character;
    } catch (error) {
      const message = "An unexpected error occurred while authentication";
      Logger.error(message, { error });
      return next(new Error(message));
    }

    return next();
  });

  // Set the character to online when they connect, and offline when they disconnect
  gameServer.on("connection", async (socket) => {
    // Set the character online
    await Characters.updateOne({ id: socket.data.character.id }, { $set: { online: serverId } });
    Logger.info("Character started", {
      ip: socket.handshake.address,
      accountId: socket.data.character.accountId,
      characterId: socket.data.character.id,
    });

    socket.on("disconnect", async () => {
      // Set character offline
      await Characters.updateOne({ id: socket.data.character.id }, { $unset: { online: true } });
      Logger.info("Character stopped", {
        ip: socket.handshake.address,
        accountId: socket.data.character.accountId,
        characterId: socket.data.character.id,
      });
    });
  });
}
