import { verifier } from "../../jwt.ts";
import state from "../../state.ts";
import type { FastifyReplyTypebox, FastifyRequestTypebox } from "../types.ts";
import type { AuthToken } from "@adventureland/types";
import { Type, type Static } from "@sinclair/typebox";
import config from "config";
import { StatusCodes } from "http-status-codes";

const enabled = config.get("centralServer.getServers.enabled");

export const GetServersSchema = {
  body: Type.Object({
    token: Type.String(),
  }),
  response: {
    [StatusCodes.OK]: Type.Record(
      Type.String(),
      Type.Object({
        serverUrl: Type.String(),
      }),
    ),
    [StatusCodes.FORBIDDEN]: Type.Object({
      error: Type.String(),
    }),
    [StatusCodes.INTERNAL_SERVER_ERROR]: Type.Object({
      error: Type.String(),
    }),
  },
};

export type GetServersResponse = Static<
  (typeof GetServersSchema.response)[StatusCodes.OK]
>;

export const getServersHandler = async (
  request: FastifyRequestTypebox<typeof GetServersSchema>,
  reply: FastifyReplyTypebox<typeof GetServersSchema>,
) => {
  if (!enabled) {
    return reply
      .code(StatusCodes.FORBIDDEN)
      .send({ error: "Getting servers is currently disabled" });
  }

  // Get the token from the request body
  const { token } = request.body;

  // Check that the token they provided is valid
  try {
    verifier(token) as AuthToken;
  } catch {
    return reply.code(StatusCodes.FORBIDDEN).send({ error: "Invalid token" });
  }

  // Get all servers
  const servers: GetServersResponse = {};
  for (const [serverName, serverState] of Object.entries(
    state.registeredServers,
  )) {
    if (!serverState.online) continue;
    servers[serverName] = {
      serverUrl: serverState.serverUrl,
    };
  }

  // Return all characters
  return reply.code(StatusCodes.OK).send(servers);
};
