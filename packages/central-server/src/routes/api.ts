import { changeEmailHandler, ChangeEmailSchema } from "./api/changeEmail.ts";
import {
  createCharacterHandler,
  CreateCharacterSchema,
} from "./api/createCharacter.ts";
import { loginHandler, LoginSchema } from "./api/login.ts";
import {
  purchaseShellsHandler,
  PurchaseShellsSchema,
} from "./api/purchaseShells.ts";
import { purchaseSlotHandler, PurchaseSlotSchema } from "./api/purchaseSlot.ts";
import {
  renameCharacterHandler,
  RenameCharacterSchema,
} from "./api/renameCharacter.ts";
import { signupHandler, SignupSchema } from "./api/signup.ts";
import { statusHandler, StatusSchema } from "./api/status.ts";
import { verifyEmailHandler, VerifyEmailSchema } from "./api/verifyEmail.ts";
import {
  verifyPurchaseShellsHandler,
  VerifyPurchaseShellsSchema,
} from "./api/verifyPurchaseShells.ts";
import Config from "config";
import type { FastifyInstance } from "fastify";

export function setupApiRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/api/status",
    {
      schema: StatusSchema,
      config: {
        rateLimit: Config.get("centralServer.status.rateLimit"),
      },
    },
    statusHandler,
  );
  fastify.post(
    "/api/login",
    {
      schema: LoginSchema,
      config: {
        rateLimit: Config.get("centralServer.login.rateLimit"),
      },
    },
    loginHandler,
  );
  fastify.post(
    "/api/signup",
    {
      schema: SignupSchema,
      config: {
        rateLimit: Config.get("centralServer.signup.rateLimit"),
      },
    },
    signupHandler,
  );
  fastify.post(
    "/api/changeEmail",
    {
      schema: ChangeEmailSchema,
      config: {
        rateLimit: Config.get("centralServer.changeEmail.rateLimit"),
      },
    },
    changeEmailHandler,
  );
  fastify.post(
    "/api/createCharacter",
    {
      schema: CreateCharacterSchema,
      config: {
        rateLimit: Config.get("centralServer.createCharacter.rateLimit"),
      },
    },
    createCharacterHandler,
  );
  fastify.post(
    "/api/purchaseShells",
    {
      schema: PurchaseShellsSchema,
      config: {
        rateLimit: Config.get("centralServer.purchaseShells.rateLimit"),
      },
    },
    purchaseShellsHandler,
  );
  fastify.post(
    "/api/purchaseSlot",
    {
      schema: PurchaseSlotSchema,
      config: {
        rateLimit: Config.get("centralServer.purchaseSlot.rateLimit"),
      },
    },
    purchaseSlotHandler,
  );
  fastify.post(
    "/api/renameCharacter",
    {
      schema: RenameCharacterSchema,
      config: {
        rateLimit: Config.get("centralServer.renameCharacter.rateLimit"),
      },
    },
    renameCharacterHandler,
  );
  fastify.get(
    "/api/verifyEmail/:verificationCode",
    {
      schema: VerifyEmailSchema,
      config: {
        rateLimit: Config.get("centralServer.verifyEmail.rateLimit"),
      },
    },
    verifyEmailHandler,
  );
  fastify.get(
    "/api/verifyPurchaseShells/:stripeSessionId",
    {
      schema: VerifyPurchaseShellsSchema,
      config: {
        rateLimit: Config.get("centralServer.purchaseShells.rateLimit"),
      },
    },
    verifyPurchaseShellsHandler,
  );
}
