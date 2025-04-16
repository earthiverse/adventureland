import { Accounts, Characters } from "../../database.ts";
import { verifier } from "../../jwt.ts";
import { Logger } from "../../logger.ts";
import type { FastifyReplyTypebox, FastifyRequestTypebox } from "../types.ts";
import type { AuthToken, CharacterData } from "@adventureland/types";
import { Type, type Static } from "@sinclair/typebox";
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

export type CreateCharacterResponse = Static<
  (typeof CreateCharacterSchema.response)[StatusCodes.CREATED]
>;

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
  let jwt: AuthToken;
  try {
    jwt = verifier(token) as AuthToken;
  } catch {
    return reply.code(StatusCodes.FORBIDDEN).send({ error: "Invalid token" });
  }

  // Check that they have enough slots to make a new character
  try {
    const account = await Accounts.findOne(
      { id: jwt.accountId },
      { projection: { slots: 1 } },
    );
    if (!account) {
      throw new Error(
        `ID ${jwt.accountId} was successfully authenticated via token, but the account could not be retrieved!`,
      );
    }

    const numCharacters = await Characters.countDocuments({
      accountId: jwt.accountId,
    });
    if (numCharacters >= account.slots) {
      return reply
        .code(StatusCodes.FORBIDDEN)
        .send({ error: "You do not have any available slots" });
    }
  } catch (error) {
    const message = "An unexpected error occurred during character creation";
    Logger.error(message, error);
    return reply.code(StatusCodes.INTERNAL_SERVER_ERROR).send({
      error: message,
    });
  }

  // Add the character to the database
  const characterData: CharacterData = {
    accountId: jwt.accountId,
    id: crypto.randomUUID(),
    name: character.name,
    createdDate: Date.now(),
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
    const message = "An unexpected error occurred during character creation";
    Logger.error(message, error);
    return reply.code(StatusCodes.INTERNAL_SERVER_ERROR).send({
      error: message,
    });
  }

  Logger.info("Character Created", {
    ip: request.ip,
    accountId: jwt.accountId,
    character,
  });

  // Return the character data
  return reply.code(StatusCodes.CREATED).send({ character: characterData });
};
