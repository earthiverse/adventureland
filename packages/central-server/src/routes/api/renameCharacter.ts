import { Accounts, Client, Characters } from "../../database.ts";
import { verifier } from "../../jwt.ts";
import type { FastifyReplyTypebox, FastifyRequestTypebox } from "../types.ts";
import type { AuthToken } from "@adventureland/types";
import { Type } from "@sinclair/typebox";
import config from "config";
import { StatusCodes } from "http-status-codes";
import { MongoServerError } from "mongodb";

const enabled = config.get("centralServer.renameCharacter.enabled");
const minLength = config.get("centralServer.renameCharacter.minLength");
const maxLength = config.get("centralServer.renameCharacter.maxLength");
const pattern = config.get("centralServer.renameCharacter.pattern");
const costs = config.get("centralServer.renameCharacter.costs");

export const RenameCharacterSchema = {
  body: Type.Object({
    token: Type.String(),
    oldName: Type.String(),
    newName: Type.String({
      minLength,
      maxLength,
      pattern,
    }),
  }),
  response: {
    [StatusCodes.OK]: Type.Object({
      oldName: Type.String(),
      newName: Type.String(),
      cost: Type.Number(),
    }),
    [StatusCodes.FORBIDDEN]: Type.Object({
      error: Type.String(),
    }),
    [StatusCodes.INTERNAL_SERVER_ERROR]: Type.Object({
      error: Type.String(),
    }),
  },
};

export const renameCharacterHandler = async (
  request: FastifyRequestTypebox<typeof RenameCharacterSchema>,
  reply: FastifyReplyTypebox<typeof RenameCharacterSchema>,
) => {
  if (!enabled) {
    return reply
      .code(StatusCodes.FORBIDDEN)
      .send({ error: "Character renaming is currently disabled" });
  }

  const { token, oldName, newName } = request.body;

  // Return early if the names are the same
  if (oldName === newName)
    return reply.code(StatusCodes.OK).send({ oldName, newName, cost: 0 });

  // Check that the token they provided is valid
  const jwt = verifier(token) as AuthToken | undefined;
  if (jwt === undefined)
    return reply.code(StatusCodes.FORBIDDEN).send({ error: "Invalid token" });

  const cost = costs[newName.length];
  if (cost === undefined) {
    return reply.code(StatusCodes.INTERNAL_SERVER_ERROR).send({
      error: `The cost for renaming a character of length ${newName.length} is undefined.`,
    });
  }

  const session = Client.startSession();
  try {
    session.startTransaction();

    // Take the shells from the account
    const result = await Accounts.updateOne(
      {
        id: jwt.accountId,
        shells: { $gte: cost },
      },
      { $inc: { shells: -cost } },
      { session },
    );
    if (result.modifiedCount === 0) {
      return reply
        .code(StatusCodes.FORBIDDEN)
        .send({ error: "Insufficient shells to rename character" });
    }

    // Update the character name
    await Characters.updateOne(
      {
        accountId: jwt.accountId,
        name: oldName,
      },
      { $set: { name: newName } },
      { session },
    );
    if (result.modifiedCount === 0) {
      return reply
        .code(StatusCodes.FORBIDDEN)
        .send({ error: `You do not have a character named ${oldName}` });
    }

    await session.commitTransaction();
    console.info(`Character ${oldName} renamed to ${newName} (${cost} shells)`);
  } catch (error) {
    if (error instanceof MongoServerError) {
      if (error.code === 11000) {
        return reply
          .code(StatusCodes.FORBIDDEN)
          .send({ error: `Another character is already named ${newName}` });
      }
    }
    console.error(error); // TODO: Log the error
    return reply.code(StatusCodes.INTERNAL_SERVER_ERROR).send({
      error: "An unexpected error occurred during character renaming",
    });
  } finally {
    await session.endSession();
  }

  // Return the new name and how much it cost
  return reply.code(StatusCodes.OK).send({ oldName, newName, cost });
};
