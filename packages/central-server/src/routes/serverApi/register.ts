import {
  checkGameServerHealth,
  setCharactersOffline,
} from "../../checkLoop.ts";
import { verifier } from "../../jwt.ts";
import { Logger } from "../../logger.ts";
import State from "../../state.ts";
import type { FastifyReplyTypebox, FastifyRequestTypebox } from "../types.ts";
import type { ServerAuthToken } from "@adventureland/types/src/AuthToken.ts";
import { Type } from "@sinclair/typebox";
import { StatusCodes } from "http-status-codes";

export const RegisterSchema = {
  body: Type.Object({
    token: Type.String(),
  }),
  response: {
    [StatusCodes.OK]: Type.Object({}),
    [StatusCodes.FORBIDDEN]: Type.Object({
      error: Type.String(),
    }),
    [StatusCodes.INTERNAL_SERVER_ERROR]: Type.Object({
      error: Type.String(),
    }),
  },
};

export const registerHandler = async (
  request: FastifyRequestTypebox<typeof RegisterSchema>,
  reply: FastifyReplyTypebox<typeof RegisterSchema>,
) => {
  // Get the token from the request body
  const { token } = request.body;

  // Check that the token the server provided is valid
  let jwt: ServerAuthToken;
  try {
    jwt = verifier(token) as ServerAuthToken;
  } catch {
    return reply.code(StatusCodes.FORBIDDEN).send({ error: "Invalid token" });
  }

  const serverId = jwt.serverId;
  if (serverId === undefined || jwt.serverUrl === undefined) {
    return reply.code(StatusCodes.FORBIDDEN).send({ error: "Invalid token" });
  }

  // Check that no other server with the same ID has been registered
  let serverState = State.registeredServers[serverId];
  if (serverState === undefined) {
    // Ensure that there was never a server registered at this IP before
    for (const [previousServerId, previousServerState] of Object.entries(
      State.registeredServers,
    )) {
      if (previousServerState.ip === request.ip) {
        Logger.warning("Game server changed server ID", {
          serverId,
          previousServerId,
          ip: request.ip,
        });
        delete State.registeredServers[previousServerId];
        break;
      }
    }

    // Register new game server
    serverState = State.registeredServers[serverId] = {
      ip: request.ip,
      serverUrl: jwt.serverUrl,
      online: true,
    };
    Logger.notice("Registered Game Server", {
      serverId,
      ip: request.ip,
    });
    await setCharactersOffline(serverId);
    return reply.code(StatusCodes.OK).send({});
  }

  // If it has already been registered, but the registration is coming from the same IP, it has restarted
  if (serverState.ip === request.ip) {
    Logger.warning("Game server has restarted", { serverId });
    serverState.online = true;
    await setCharactersOffline(serverId);
    return reply.code(StatusCodes.OK).send({});
  }

  // Check if the game server at the registered IP is active
  if (await checkGameServerHealth(serverId, serverState)) {
    Logger.error(
      "A game server is trying to register with an ID that is already registered",
      {
        serverId,
        registeringIp: request.ip,
        registeredIp: serverState.ip,
      },
    );
    return reply.code(StatusCodes.FORBIDDEN).send({
      error: "There is another game server registered with this server ID",
    });
  } else {
    // The old IP did not respond
    Logger.warning("Game server changed IP", {
      oldIp: serverState.ip,
      newIp: request.ip,
      serverId,
    });
    serverState.ip = request.ip;
    await setCharactersOffline(serverId);
    return reply.code(StatusCodes.OK).send({});
  }
};
