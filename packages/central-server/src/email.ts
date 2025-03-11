import { generateUrl } from "./url.ts";
import Config from "config";
import cryptoRandomString from "crypto-random-string";
import type { FastifyRequest } from "fastify";
import NodeMailer from "nodemailer";
import { nodemailerMjmlPlugin } from "nodemailer-mjml";
import { join } from "path";

const transportOptions = Config.get("email.transport");
const transportDefaults = Config.get("email.defaults");
const codeLength = Config.get("centralServer.verifyEmail.codeLength");

const transport = NodeMailer.createTransport(
  transportOptions,
  transportDefaults,
);
transport.use(
  "compile",
  nodemailerMjmlPlugin({
    templateFolder: join(import.meta.dirname, "templates", "email"),
    mjmlOptions: { validationLevel: "strict" },
  }),
);

/**
 * Generates a verification code that can be used to verify an email
 * @returns
 */
export function generateVerificationCode() {
  return cryptoRandomString({
    length: codeLength,
    type: "url-safe",
  });
}

/**
 * Returns the URL that the user can visit to verify their email address
 * @param request
 * @param verificationCode
 * @returns
 */
export function getVerifyUrl(
  request: FastifyRequest,
  verificationCode: string,
) {
  return generateUrl(request, `/api/verifyEmail/${verificationCode}`);
}

export { transport as Emailer };
