import { Accounts } from "../../database.ts";
import { signer } from "../../jwt.ts";
import type { FastifyReplyTypebox, FastifyRequestTypebox } from "../types.ts";
import { Type } from "@sinclair/typebox";
import bcryptjs from "bcryptjs";
import config from "config";
import { StatusCodes } from "http-status-codes";
import { MongoServerError } from "mongodb";

const enabled = config.get("centralServer.signup.enabled");

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
      .send({ error: "Signups are currently disabled" });
  }

  // Get the email and password from the request body
  const { email, password } = request.body;

  // Add the account to the database
  try {
    await Accounts.insertOne({
      id: crypto.randomUUID(),
      email,
      password: bcryptjs.hashSync(password),
      signupDate: new Date(),
      verified: false,
    });
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
  return reply.code(StatusCodes.CREATED).send({
    token: signer({ email }),
  });
};
