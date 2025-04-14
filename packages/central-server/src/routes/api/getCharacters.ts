import { Characters } from "../../database.ts";
import { verifier } from "../../jwt.ts";
import type { FastifyReplyTypebox, FastifyRequestTypebox } from "../types.ts";
import type { AuthToken } from "@adventureland/types";
import { Type, type Static } from "@sinclair/typebox";
import config from "config";
import { StatusCodes } from "http-status-codes";

const enabled = config.get("centralServer.getCharacters.enabled");

export const GetCharactersSchema = {
  body: Type.Object({
    token: Type.String(),
  }),
  response: {
    [StatusCodes.OK]: Type.Array(
      Type.Object({
        name: Type.String(),
        id: Type.String(),
        type: Type.String(),
        level: Type.Integer(),
        xp: Type.Integer(),
        createdDate: Type.Integer(),
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

export type GetCharactersResponse = Static<
  (typeof GetCharactersSchema.response)[StatusCodes.OK]
>;

export const getCharactersHandler = async (
  request: FastifyRequestTypebox<typeof GetCharactersSchema>,
  reply: FastifyReplyTypebox<typeof GetCharactersSchema>,
) => {
  if (!enabled) {
    return reply
      .code(StatusCodes.FORBIDDEN)
      .send({ error: "Getting characters is currently disabled" });
  }

  // Get the token from the request body
  const { token } = request.body;

  // Check that the token they provided is valid
  let jwt: AuthToken;
  try {
    jwt = verifier(token) as AuthToken;
  } catch {
    return reply.code(StatusCodes.FORBIDDEN).send({ error: "Invalid token" });
  }

  // Get all characters
  const characters = (await Characters.find({
    accountId: jwt.accountId,
  })
    .project({ name: 1, id: 1, type: 1, level: 1, xp: 1, createdDate: 1 })
    .sort({ created: 1 })
    .toArray()) as GetCharactersResponse;

  // Return all characters
  return reply.code(StatusCodes.OK).send(characters);
};
