import { Accounts } from "../../database.ts";
import type { FastifyReplyTypebox, FastifyRequestTypebox } from "../types.ts";
import { Type } from "@sinclair/typebox";
import bcryptjs from "bcryptjs";
import config from "config";
import { createSigner } from "fast-jwt";
import { StatusCodes } from "http-status-codes";

const enabled = config.get("centralServer.signup.enabled");

/** For signing JWT tokens */
const sign = createSigner({
  key: config.get("centralServer.jwt.secret"),
  expiresIn: config.get("centralServer.jwt.expiresIn"),
});

export const SignupSchema = {
  body: Type.Object({
    email: Type.String(),
    password: Type.String(),
  }),
  response: {
    [StatusCodes.CREATED]: Type.Object({
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
    // Signups are disabled
    return reply
      .code(StatusCodes.FORBIDDEN)
      .send({ error: "Signups are disabled" });
  }

  // Get the email and password from the request body
  const { email, password } = request.body;

  // Add the account to the database
  try {
    await Accounts.insertOne({
      email,
      password: bcryptjs.hashSync(password),
      characters: [],
      signupDate: new Date(),
    });
  } catch (error) {
    console.error(error); // TODO: Log the error
    return reply
      .code(StatusCodes.INTERNAL_SERVER_ERROR)
      .send({ error: "An error occurred during signup" });
  }

  // Send the CSRF token
  return reply.code(StatusCodes.CREATED).send({
    token: sign({ email }),
  });
};
