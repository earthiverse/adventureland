import { setCharactersOffline } from "../../checkLoop.ts";
import { verifier } from "../../jwt.ts";
import { Logger } from "../../logger.ts";
import State from "../../state.ts";
import type { FastifyReplyTypebox, FastifyRequestTypebox } from "../types.ts";
import type { ServerAuthToken } from "@adventureland/types/src/AuthToken.ts";
import { Type } from "@sinclair/typebox";
import { StatusCodes } from "http-status-codes";

export const UnregisterSchema = {
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

export const unregisterHandler = async (
  request: FastifyRequestTypebox<typeof UnregisterSchema>,
  reply: FastifyReplyTypebox<typeof UnregisterSchema>,
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
  if (serverId === undefined) {
    return reply.code(StatusCodes.FORBIDDEN).send({ error: "Invalid token" });
  }

  // Get the current state
  const serverState = State.registeredServers[serverId];
  if (serverState === undefined) {
    Logger.warning(
      "Request to unregister a game server that was never registered",
      { serverId, ip: request.ip },
    );
    await setCharactersOffline(serverId);
    return reply.code(StatusCodes.OK).send({});
  }

  // Check IP against what's registered
  if (serverState.ip !== request.ip) {
    Logger.error(
      "Received request to unregister a game server whose IP does not match",
      {
        serverId,
        unregisteringIp: request.ip,
        registeredIp: serverState.ip,
      },
    );
    return reply
      .code(StatusCodes.FORBIDDEN)
      .send({ error: "Game server IP mismatch" });
  }

  delete State.registeredServers[serverId];
  try {
    const numSetOffline = await setCharactersOffline(serverId);
    Logger.notice("Unregistered game server", {
      serverId,
      ip: request.ip,
      numSetOffline,
    });
  } catch {
    Logger.alert("Failed setting characters offline", { serverId });
  }

  return reply.code(StatusCodes.OK).send({});
};
