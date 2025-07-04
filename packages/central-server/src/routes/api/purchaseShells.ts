import type { AccountData, AuthToken } from "@adventureland/types";
import { Type } from "@sinclair/typebox";
import Config from "config";
import { StatusCodes } from "http-status-codes";
import { Accounts } from "../../database.ts";
import { verifier } from "../../jwt.ts";
import { Logger } from "../../logger.ts";
import { Stripe } from "../../stripe.ts";
import { generateUrl } from "../../url.ts";
import type { FastifyReplyTypebox, FastifyRequestTypebox } from "../types.ts";

const enabled = Config.get("centralServer.purchaseShells.enabled");
const costs = Config.get("centralServer.purchaseShells.costs");
const currency = Config.get("centralServer.purchaseShells.currency");

export const PurchaseShellsSchema = {
  body: Type.Object({
    token: Type.String(),
    numShells: Type.Integer(),
  }),
  response: {
    [StatusCodes.FORBIDDEN]: Type.Object({
      error: Type.String(),
    }),
    [StatusCodes.INTERNAL_SERVER_ERROR]: Type.Object({
      error: Type.String(),
    }),
  },
};

export const purchaseShellsHandler = async (
  request: FastifyRequestTypebox<typeof PurchaseShellsSchema>,
  reply: FastifyReplyTypebox<typeof PurchaseShellsSchema>,
) => {
  if (!enabled) {
    return reply.code(StatusCodes.FORBIDDEN).send({ error: "Purchasing shells is currently disabled" });
  }

  const { token, numShells } = request.body;

  // Check that the token they provided is valid
  let jwt: AuthToken;
  try {
    jwt = verifier(token) as AuthToken;
  } catch {
    return reply.code(StatusCodes.FORBIDDEN).send({ error: "Invalid token" });
  }

  // Get the cost for the number of shells
  const cost = costs[numShells];
  if (cost === undefined) {
    Logger.error(`The cost for purchasing ${numShells} shells is undefined.`);
    return reply.code(StatusCodes.INTERNAL_SERVER_ERROR).send({
      error: "An unexpected error occurred during shells purchase",
    });
  }

  // Get account's email
  let account: Pick<AccountData, "email"> | null;
  try {
    account = await Accounts.findOne({ id: jwt.accountId }, { projection: { email: 1 } });

    if (!account) {
      throw new Error(
        `ID ${jwt.accountId} was successfully authenticated via token, but the account could not be retrieved!`,
      );
    }
  } catch (error) {
    const message = "An unexpected error occurred during shells purchase";
    Logger.error(message, error);
    return reply.code(StatusCodes.INTERNAL_SERVER_ERROR).send({
      error: message,
    });
  }

  // Create Stripe session
  const stripeSession = await Stripe.checkout.sessions.create({
    metadata: {
      numShells,
    },
    client_reference_id: jwt.accountId,
    customer_email: account.email,
    line_items: [
      {
        price_data: {
          currency,
          product_data: {
            description: "Adventureland in-game currency", // TODO: This could be configurable
            name: `${numShells} Shells`, // TODO: This could be configurable
          },
          unit_amount: cost,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    // NOTE: This has to match with the schema for `verifyPurchaseShells`!
    success_url: generateUrl(request, `/api/verifyPurchaseShells/{CHECKOUT_SESSION_ID}`),
    // TODO: cancel_url that goes to the page for buying shells
  });

  Logger.info("Shell purchase initiated", {
    ip: request.ip,
    accountId: jwt.accountId,
    stripeSessionId: stripeSession.id,
    numShells,
    cost,
  });

  // Redirect to Stripe to handle the purchase
  return reply.redirect(stripeSession.url as string, StatusCodes.SEE_OTHER);
};
