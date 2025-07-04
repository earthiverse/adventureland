import type { AccountData, AuthTokenPayload } from "@adventureland/types";
import { Type, type Static } from "@sinclair/typebox";
import bcryptjs from "bcryptjs";
import config from "config";
import { StatusCodes } from "http-status-codes";
import { MongoServerError } from "mongodb";
import { Accounts } from "../../database.ts";
import { Emailer, generateVerificationCode, getVerifyUrl } from "../../email.ts";
import { signer } from "../../jwt.ts";
import { Logger } from "../../logger.ts";
import type { FastifyReplyTypebox, FastifyRequestTypebox } from "../types.ts";

const enabled = config.get("centralServer.signup.enabled");
const helpEmail = config.get("email.addressBook.help");
const initial = config.get("centralServer.signup.initial");

export const SignupSchema = {
  body: Type.Object({
    email: Type.String({ format: "email" }),
    password: Type.String(),
  }),
  response: {
    [StatusCodes.CREATED]: Type.Object({
      accountId: Type.String(),
      token: Type.String(),
    }),
    [StatusCodes.FORBIDDEN]: Type.Object({
      error: Type.String(),
    }),
    [StatusCodes.INTERNAL_SERVER_ERROR]: Type.Object({
      error: Type.String(),
    }),
  },
};

export type SignupResponse = Static<(typeof SignupSchema.response)[StatusCodes.CREATED]>;

export const signupHandler = async (
  request: FastifyRequestTypebox<typeof SignupSchema>,
  reply: FastifyReplyTypebox<typeof SignupSchema>,
) => {
  if (!enabled) {
    return reply.code(StatusCodes.FORBIDDEN).send({ error: "Signups are currently disabled" });
  }

  // Get the email and password from the request body
  const { email, password } = request.body;

  const verificationCode = generateVerificationCode();

  // Add the account to the database
  const account: AccountData = {
    ...initial,
    id: crypto.randomUUID(),
    email,
    password: bcryptjs.hashSync(password),
    signupDate: new Date(),
    verified: false,
    emailChange: {
      newEmail: email,
      verificationCode,
    },
  };
  try {
    await Accounts.insertOne(account);
  } catch (error) {
    if (error instanceof MongoServerError) {
      if (error.code === 11000) {
        return reply.code(StatusCodes.FORBIDDEN).send({ error: "An account with that email already exists" });
      }
    }
    const message = "An unexpected error occurred during signup";
    Logger.error(message, error);
    return reply.code(StatusCodes.INTERNAL_SERVER_ERROR).send({ error: message });
  }

  // Send a welcome email
  try {
    await Emailer.sendMail({
      to: email,
      replyTo: helpEmail,
      subject: "Welcome to Adventureland!",
      templateLayoutName: "template",
      templateLayoutSlots: {
        head: "partials/head",
        header: "partials/header",
        content: "partials/content/welcomeEmail",
        footer: "partials/footer",
      },
      templateData: {
        helpEmail,
        verifyUrl: getVerifyUrl(request, verificationCode),
      },
    });
  } catch (error) {
    Logger.error(error);
  }

  // Log the signup
  Logger.info("Signup", {
    ip: request.ip,
    accountId: account.id,
  });

  // Return the JWT token
  const data: AuthTokenPayload = {
    accountId: account.id,
  };
  return reply.code(StatusCodes.CREATED).send({
    accountId: account.id,
    token: signer(data),
  });
};
