import { Accounts } from "../../database.ts";
import { signer } from "../../jwt.ts";
import type { FastifyReplyTypebox, FastifyRequestTypebox } from "../types.ts";
import type { AccountData, AuthTokenPayload } from "@adventureland/types";
import { Type } from "@sinclair/typebox";
import bcryptjs from "bcryptjs";
import config from "config";
import { StatusCodes } from "http-status-codes";
import { MongoServerError } from "mongodb";

const enabled = config.get("centralServer.signup.enabled");
const initialShells = config.get("centralServer.signup.initialShells");

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

export const signupHandler = async (
  request: FastifyRequestTypebox<typeof SignupSchema>,
  reply: FastifyReplyTypebox<typeof SignupSchema>,
) => {
  if (!enabled) {
    return reply
      .code(StatusCodes.FORBIDDEN)
      .send({ error: "Signups are currently disabled" });
  }

  // Get the email and password from the request body
  const { email, password } = request.body;

  // Add the account to the database
  const account: AccountData = {
    id: crypto.randomUUID(),
    email,
    password: bcryptjs.hashSync(password),
    shells: initialShells,
    signupDate: new Date(),
    verified: false,
  };
  try {
    await Accounts.insertOne(account);
  } catch (error) {
    if (error instanceof MongoServerError) {
      if (error.code === 11000) {
        return reply
          .code(StatusCodes.FORBIDDEN)
          .send({ error: "An account with that email already exists" });
      }
    }
    console.error(error); // TODO: Log the error
    return reply
      .code(StatusCodes.INTERNAL_SERVER_ERROR)
      .send({ error: "An unexpected error occurred during signup" });
  }

  // Send the CSRF token
  const data: AuthTokenPayload = {
    accountId: account.id,
  };
  return reply.code(StatusCodes.CREATED).send({
    accountId: account.id,
    token: signer(data),
  });
};
