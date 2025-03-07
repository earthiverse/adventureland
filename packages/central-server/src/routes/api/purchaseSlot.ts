import { Accounts } from "../../database.ts";
import { verifier } from "../../jwt.ts";
import { Logger } from "../../logger.ts";
import type { FastifyReplyTypebox, FastifyRequestTypebox } from "../types.ts";
import type { AuthToken } from "@adventureland/types";
import { Type } from "@sinclair/typebox";
import config from "config";
import { StatusCodes } from "http-status-codes";

const enabled = config.get("centralServer.purchaseSlot.enabled");
const cost = config.get("centralServer.purchaseSlot.cost");
const maxSlots = config.get("centralServer.purchaseSlot.maxSlots");

export const PurchaseSlotSchema = {
  body: Type.Object({
    token: Type.String(),
  }),
  response: {
    [StatusCodes.OK]: Type.Object({
      numSlots: Type.Integer(),
    }),
    [StatusCodes.FORBIDDEN]: Type.Object({
      error: Type.String(),
    }),
    [StatusCodes.INTERNAL_SERVER_ERROR]: Type.Object({
      error: Type.String(),
    }),
  },
};

export const purchaseSlotHandler = async (
  request: FastifyRequestTypebox<typeof PurchaseSlotSchema>,
  reply: FastifyReplyTypebox<typeof PurchaseSlotSchema>,
) => {
  if (!enabled) {
    return reply
      .code(StatusCodes.FORBIDDEN)
      .send({ error: "Purchasing slots is currently disabled" });
  }

  const { token } = request.body;

  // Check that the token they provided is valid
  let jwt: AuthToken;
  try {
    jwt = verifier(token) as AuthToken;
  } catch {
    return reply.code(StatusCodes.FORBIDDEN).send({ error: "Invalid token" });
  }

  // Check that they have enough shells and haven't hit the limit for how many slots they can have
  try {
    const account = await Accounts.findOne(
      { id: jwt.accountId },
      { projection: { slots: 1, shells: 1 } },
    );

    if (!account) {
      throw new Error(
        `ID ${jwt.accountId} was successfully authenticated via token, but the account could not be retrieved!`,
      );
    }
    if (account.shells < cost) {
      return reply
        .code(StatusCodes.FORBIDDEN)
        .send({ error: "Insufficient shells to purchase slot" });
    }
    if (account.slots >= maxSlots) {
      return reply
        .code(StatusCodes.FORBIDDEN)
        .send({ error: "You have reached the maximum number of slots" });
    }

    // Purchase the slot
    const result = await Accounts.updateOne(
      {
        id: jwt.accountId,
        shells: { $gte: cost },
        slots: { $lt: maxSlots },
      },
      { $inc: { shells: -cost, slots: 1 } },
    );
    if (result.modifiedCount === 0) {
      return reply.code(StatusCodes.FORBIDDEN).send({
        error:
          "Insufficient shells, or you have already reached the maximum number of slots",
      });
    }

    return reply.code(StatusCodes.OK).send({ numSlots: account.slots + 1 });
  } catch (error) {
    const message = "An unexpected error occurred during slot purchase";
    Logger.error(message, error);
    return reply.code(StatusCodes.INTERNAL_SERVER_ERROR).send({
      error: message,
    });
  }
};
