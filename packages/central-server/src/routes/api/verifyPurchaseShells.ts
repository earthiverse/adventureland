import { Accounts } from "../../database.ts";
import { Logger } from "../../logger.ts";
import { Stripe } from "../../stripe.ts";
import type { FastifyReplyTypebox, FastifyRequestTypebox } from "../types.ts";
import { Type } from "@sinclair/typebox";
import config from "config";
import { StatusCodes } from "http-status-codes";
import type { Stripe as BaseStripe } from "stripe";

// NOTE: This endpoint has to be synced with purchaseShells
const enabled = config.get("centralServer.purchaseShells.enabled");

export const VerifyPurchaseShellsSchema = {
  params: Type.Object({
    stripeSessionId: Type.String(),
  }),
  response: {
    [StatusCodes.OK]: Type.String(),
    [StatusCodes.INTERNAL_SERVER_ERROR]: Type.Object({
      error: Type.String(),
      stripeSessionId: Type.Optional(Type.String()),
    }),
  },
};

export const verifyPurchaseShellsHandler = async (
  request: FastifyRequestTypebox<typeof VerifyPurchaseShellsSchema>,
  reply: FastifyReplyTypebox<typeof VerifyPurchaseShellsSchema>,
) => {
  const { stripeSessionId } = request.params;

  if (!enabled) {
    return reply.code(StatusCodes.FORBIDDEN).send({
      error:
        "Verifying shell purchases is currently disabled. Please email support with the Stripe session ID if you actually purchased shells.",
      stripeSessionId,
    });
  }

  // Retrieve the session from Stripe
  let stripeSession: BaseStripe.Response<BaseStripe.Checkout.Session>;
  try {
    stripeSession = await Stripe.checkout.sessions.retrieve(stripeSessionId);
  } catch (error) {
    Logger.error("Unable to retrieve Stripe session", {
      stripeSessionId,
      error,
    });
    return reply.code(StatusCodes.INTERNAL_SERVER_ERROR).send({
      error:
        "Something went wrong verifying shells purchase. Please email support with the Stripe session ID if you actually purchased shells.",
      stripeSessionId,
    });
  }

  // Get the Account ID from the Stripe session
  const accountId = stripeSession?.client_reference_id;
  if (accountId === null) {
    Logger.error("No account ID found in Stripe session metadata", {
      ip: request.ip,
      stripeSessionId,
    });
    return reply.code(StatusCodes.INTERNAL_SERVER_ERROR).send({
      error:
        "Something went wrong verifying shells purchase. Please email support with the Stripe session ID",
      stripeSessionId,
    });
  }

  // Ensure that the payment was successful
  if (stripeSession.payment_status !== "paid") {
    Logger.info("Stripe session is not paid", {
      ip: request.ip,
      accountId,
      stripeSessionId,
    });
    return reply.code(StatusCodes.PAYMENT_REQUIRED).send({
      error:
        "The payment has not been completed. Please email support with the Stripe sesssion ID if this is incorrect.",
      stripeSessionId,
    });
  }

  // Ensure that the sesssion hasn't already been processed
  const processed = stripeSession.metadata?.processed;
  if (processed !== undefined) {
    Logger.warning(
      "Stripe session was attempted to be processed multiple times",
      {
        ip: request.ip,
        accountId,
        stripeSessionId,
        stripeSessionMetadata: stripeSession.metadata,
      },
    );
    return reply.code(StatusCodes.FORBIDDEN).send({
      error:
        "The shells for this purchase have already been credited. Please email support with the Stripe sesssion ID if this is incorrect.",
      stripeSessionId,
    });
  }

  // Get the number of shells purchased
  const numShells = stripeSession.metadata?.numShells;
  if (numShells === undefined || numShells === null || numShells === "") {
    Logger.error(
      "The number of shells purchased was not found in the Stripe session metadata",
      {
        ip: request.ip,
        accountId,
        stripeSessionId,
        stripeSessionMetadata: stripeSession.metadata,
      },
    );
    return reply.code(StatusCodes.FORBIDDEN).send({
      error:
        "Something went wrong verifying shells purchase. Please email support with the Stripe session ID.",
      stripeSessionId,
    });
  }

  // Add shells to account
  try {
    await Accounts.updateOne(
      { id: accountId },
      { $inc: { shells: Number.parseInt(numShells) } },
    );
  } catch (error) {
    Logger.error("Could not credit account with shells purchase", {
      ip: request.ip,
      accountId,
      stripeSessionId,
      error,
    });
    return reply.code(StatusCodes.FORBIDDEN).send({
      error:
        "Something went wrong verifying shells purchase. Please email support with the Stripe session ID.",
      stripeSessionId,
    });
  }

  // Mark the session as processed
  try {
    await Stripe.checkout.sessions.update(stripeSessionId, {
      metadata: {
        processed: Date.now(),
      },
    });
  } catch (error) {
    Logger.error("Unable to mark Stripe session as processed", {
      ip: request.ip,
      accountId,
      stripeSessionId,
      error,
    });
    // NOTE: The account has been credited with the shells at this point, don't return an error to the user.
    //       However, if the user revisits this endpoint with the same session ID, they will be credited again!
  }

  Logger.notice("Shell purchase verified", {
    ip: request.ip,
    accountId,
    stripeSessionId,
    numShells,
  });
  return reply
    .code(StatusCodes.OK)
    .send("Your purchase of " + numShells + " shells has been applied!"); // TODO: Redirect? HTML Page?
};
