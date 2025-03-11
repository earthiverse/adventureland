import { Accounts } from "../../database.ts";
import { Logger } from "../../logger.ts";
import type { FastifyReplyTypebox, FastifyRequestTypebox } from "../types.ts";
import { Type } from "@sinclair/typebox";
import config from "config";
import { StatusCodes } from "http-status-codes";

const enabled = config.get("centralServer.verifyEmail.enabled");
const codeLength = config.get("centralServer.verifyEmail.codeLength");

export const VerifyEmailSchema = {
  params: Type.Object({
    verificationCode: Type.String({
      minLength: codeLength,
      maxLength: codeLength,
    }),
  }),
  response: {
    [StatusCodes.OK]: Type.String(),
    [StatusCodes.FORBIDDEN]: Type.Object({
      error: Type.String(),
    }),
    [StatusCodes.INTERNAL_SERVER_ERROR]: Type.Object({
      error: Type.String(),
    }),
  },
};

export const verifyEmailHandler = async (
  request: FastifyRequestTypebox<typeof VerifyEmailSchema>,
  reply: FastifyReplyTypebox<typeof VerifyEmailSchema>,
) => {
  if (!enabled) {
    return reply
      .code(StatusCodes.FORBIDDEN)
      .send({ error: "Verifying emails is currently disabled" });
  }

  const { verificationCode } = request.params;

  try {
    // Get the Account ID and the email to set if it matches the verification code
    const account = await Accounts.findOne(
      {
        "emailChange.verificationCode": verificationCode,
      },
      { projection: { id: 1, emailChange: 1 } },
    );
    if (account === null) {
      return reply
        .code(StatusCodes.FORBIDDEN)
        .send({ error: "Invalid verification code" });
    }

    if (account.emailChange === undefined) {
      throw new Error(
        "Email change object is undefined, but it should have been set",
      );
    }

    // Set the new email, remove the email change
    await Accounts.updateOne(
      { id: account.id },
      {
        $set: { email: account.emailChange.newEmail, verified: true },
        $unset: { emailChange: "" },
      },
    );

    // Log the verification
    Logger.info("Email Verified", {
      ip: request.ip,
      accountId: account.id,
    });

    return reply.code(StatusCodes.OK).send("Email verified"); // TODO: Redirect? HTML Page?
  } catch (error) {
    Logger.error(error);
    return reply.code(StatusCodes.INTERNAL_SERVER_ERROR).send({
      error: "An unexpected error occurred during email verification",
    });
  }
};
