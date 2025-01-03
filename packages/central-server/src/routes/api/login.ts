import { Accounts } from "../../database.ts";
import { signer } from "../../jwt.ts";
import type { FastifyReplyTypebox, FastifyRequestTypebox } from "../types.ts";
import type { AccountData, AuthTokenPayload } from "@adventureland/types";
import { Type } from "@sinclair/typebox";
import bcryptjs from "bcryptjs";
import config from "config";
import { StatusCodes } from "http-status-codes";

const enabled = config.get("centralServer.login.enabled");

export const LoginSchema = {
  body: Type.Object({
    email: Type.String(),
    password: Type.String(),
  }),
  response: {
    [StatusCodes.OK]: Type.Object({
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

export const loginHandler = async (
  request: FastifyRequestTypebox<typeof LoginSchema>,
  reply: FastifyReplyTypebox<typeof LoginSchema>,
) => {
  if (!enabled) {
    // Signups are disabled
    return reply
      .code(StatusCodes.FORBIDDEN)
      .send({ error: "Logins are currently disabled" });
  }

  // Get the email and password from the request body
  const { email, password } = request.body;

  // Add the account to the database
  let account: AccountData | null;
  try {
    account = await Accounts.findOne({ email });

    if (account === null) {
      // Account not found
      return reply
        .code(StatusCodes.FORBIDDEN)
        .send({ error: "Invalid email or password" });
    }

    if (!bcryptjs.compareSync(password, account.password)) {
      // Password is incorrect
      return reply
        .code(StatusCodes.FORBIDDEN)
        .send({ error: "Invalid email or password" });
    }
  } catch (error) {
    console.error(error); // TODO: Log the error
    return reply
      .code(StatusCodes.INTERNAL_SERVER_ERROR)
      .send({ error: "An unexpected error occurred during login" });
  }

  // Send the CSRF token
  const data: AuthTokenPayload = {
    accountId: account.id,
  };
  return reply.code(StatusCodes.OK).send({
    token: signer(data),
  });
};
