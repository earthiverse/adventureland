import { Characters } from "../../database.ts";
import { verifier } from "../../jwt.ts";
import type { FastifyReplyTypebox, FastifyRequestTypebox } from "../types.ts";
import type { AuthToken, CharacterData } from "@adventureland/types";
import { Type } from "@sinclair/typebox";
import config from "config";
import { StatusCodes } from "http-status-codes";
import { MongoServerError } from "mongodb";

const enabled = config.get("centralServer.createCharacter.enabled");
const minLength = config.get("centralServer.createCharacter.minLength");
const maxLength = config.get("centralServer.createCharacter.maxLength");
const pattern = config.get("centralServer.createCharacter.pattern");

export const characterType = Type.Union([
  Type.Literal("mage"),
  Type.Literal("merchant"),
  Type.Literal("paladin"),
  Type.Literal("priest"),
  Type.Literal("ranger"),
  Type.Literal("rogue"),
  Type.Literal("warrior"),
]);

export const CreateCharacterSchema = {
  body: Type.Object({
    token: Type.String(),
    character: Type.Object({
      name: Type.String({
        minLength,
        maxLength,
        pattern,
      }),
      type: characterType,
    }),
  }),
  response: {
    [StatusCodes.CREATED]: Type.Object({
      character: Type.Object({
        accountId: Type.String(),
        id: Type.String(),
        name: Type.String(),
        type: characterType,
      }),
    }),
    [StatusCodes.FORBIDDEN]: Type.Object({
      error: Type.String(),
    }),
    [StatusCodes.INTERNAL_SERVER_ERROR]: Type.Object({
      error: Type.String(),
    }),
  },
};

export const createCharacterHandler = async (
  request: FastifyRequestTypebox<typeof CreateCharacterSchema>,
  reply: FastifyReplyTypebox<typeof CreateCharacterSchema>,
) => {
  if (!enabled) {
    return reply
      .code(StatusCodes.FORBIDDEN)
      .send({ error: "Character creation is currently disabled" });
  }

  const { token, character } = request.body;

  // Check that the token they provided is valid
  const jwt = verifier(token) as AuthToken | undefined;
  if (jwt === undefined)
    return reply.code(StatusCodes.FORBIDDEN).send({ error: "Invalid token" });

  // Add the character to the database
  const characterData: CharacterData = {
    accountId: jwt.accountId,
    id: crypto.randomUUID(),
    name: character.name,
    createdDate: new Date(),
    type: character.type,
    level: 1,
    xp: 0,
  };
  try {
    await Characters.insertOne(characterData);
  } catch (error) {
    if (error instanceof MongoServerError) {
      if (error.code === 11000) {
        return reply
          .code(StatusCodes.FORBIDDEN)
          .send({ error: "A character with that name already exists" });
      }
    }
    console.error(error); // TODO: Log the error
    return reply.code(StatusCodes.INTERNAL_SERVER_ERROR).send({
      error: "An unexpected error occurred during character creation",
    });
  }

  // Return the character data
  return reply.code(StatusCodes.CREATED).send({ character: characterData });
};
