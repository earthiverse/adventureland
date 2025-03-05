import { Accounts, Characters } from "../../database.ts";
import {
  Emailer,
  generateVerificationCode,
  getVerifyUrl,
} from "../../email.ts";
import { verifier } from "../../jwt.ts";
import { Logger } from "../../logger.ts";
import type { FastifyReplyTypebox, FastifyRequestTypebox } from "../types.ts";
import type { AuthToken, CharacterData } from "@adventureland/types";
import { Type } from "@sinclair/typebox";
import config from "config";
import { StatusCodes } from "http-status-codes";

const enabled = config.get("centralServer.changeEmail.enabled");
const helpEmail = config.get("email.addressBook.help");

export const ChangeEmailSchema = {
  body: Type.Object({
    token: Type.String(),
    newEmail: Type.String({ format: "email" }),
  }),
  response: {
    [StatusCodes.OK]: Type.Object({
      newEmail: Type.String(),
    }),
    [StatusCodes.FORBIDDEN]: Type.Object({
      error: Type.String(),
    }),
    [StatusCodes.INTERNAL_SERVER_ERROR]: Type.Object({
      error: Type.String(),
    }),
  },
};

export const changeEmailHandler = async (
  request: FastifyRequestTypebox<typeof ChangeEmailSchema>,
  reply: FastifyReplyTypebox<typeof ChangeEmailSchema>,
) => {
  if (!enabled) {
    return reply
      .code(StatusCodes.FORBIDDEN)
      .send({ error: "Changing emails is currently disabled" });
  }

  const { token, newEmail } = request.body;

  // Check that the token they provided is valid
  let jwt: AuthToken;
  try {
    jwt = verifier(token) as AuthToken;
  } catch {
    return reply.code(StatusCodes.FORBIDDEN).send({ error: "Invalid token" });
  }

  try {
    // Check the current email against the new email
    const currentEmail = await Accounts.findOne(
      { id: jwt.accountId },
      { projection: { email: 1 } },
    );
    if (!currentEmail)
      throw new Error(
        `ID ${jwt.accountId} was successfully authenticated via token, but the current email could not be retrieved!`,
      );

    // Return 400 if the email is the same
    if (currentEmail.email === newEmail)
      return reply.code(StatusCodes.BAD_REQUEST).send({
        error: "Your account's email is already set to the requested email",
      });

    // Get character name to put in email for context
    const characters = await Characters.find({
      accountId: jwt.accountId,
    })
      .project({ name: 1 })
      .sort({ created: -1 })
      .limit(1)
      .toArray();

    if (characters.length === 0) {
      return reply.code(StatusCodes.FORBIDDEN).send({
        error: "You cannot change your email if you don't have any characters",
      });
    }
    const characterName = (characters[0] as Partial<CharacterData>).name;

    // Add the change request to the account
    const verificationCode = generateVerificationCode();

    const result = await Accounts.updateOne(
      {
        id: jwt.accountId,
      },
      {
        $set: {
          emailChange: {
            newEmail,
            verificationCode,
          },
        },
      },
    );
    if (result.modifiedCount === 0)
      throw new Error(
        `We couldn't modify ${jwt.accountId} to add an email change!`,
      );

    // Send notification email to old email
    await Emailer.sendMail({
      to: currentEmail.email,
      replyTo: helpEmail,
      subject: "Adventureland - Email change requested",
      templateLayoutName: "template",
      templateLayoutSlots: {
        head: "partials/head",
        header: "partials/header",
        content: "partials/content/changeEmailNotice",
        footer: "partials/footer",
      },
      templateData: {
        characterName,
        helpEmail,
        newEmail,
      },
    });

    // Send verification email to new email
    await Emailer.sendMail({
      to: newEmail,
      replyTo: helpEmail,
      subject: "Adventureland - Verify your new email",
      templateLayoutName: "template",
      templateLayoutSlots: {
        head: "partials/head",
        header: "partials/header",
        content: "partials/content/changeEmailVerify",
        footer: "partials/footer",
      },
      templateData: {
        characterName,
        helpEmail,
        verifyUrl: getVerifyUrl(request, verificationCode),
      },
    });
  } catch (error) {
    const message = "An unexpected error occurred during email change";
    Logger.error(message, error);
    return reply
      .code(StatusCodes.INTERNAL_SERVER_ERROR)
      .send({ error: message });
  }

  Logger.info("Email Change Request", {
    ip: request.ip,
    accountId: jwt.accountId,
  });

  // Return the new email
  return reply.code(StatusCodes.OK).send({ newEmail });
};
