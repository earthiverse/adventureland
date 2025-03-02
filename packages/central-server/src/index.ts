import {
  changeEmailHandler,
  ChangeEmailSchema,
} from "./routes/api/changeEmail.ts";
import {
  createCharacterHandler,
  CreateCharacterSchema,
} from "./routes/api/createCharacter.ts";
import { loginHandler, LoginSchema } from "./routes/api/login.ts";
import {
  renameCharacterHandler,
  RenameCharacterSchema,
} from "./routes/api/renameCharacter.ts";
import { signupHandler, SignupSchema } from "./routes/api/signup.ts";
import { statusHandler, StatusSchema } from "./routes/api/status.ts";
import { verifyEmailHandler, VerifyEmailSchema } from "./routes/api/verifyEmail.ts";
import { type TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import Config from "config";
import Fastify from "fastify";

const port = Config.get("centralServer.port");

const fastify = Fastify().withTypeProvider<TypeBoxTypeProvider>();
await fastify.register(import("@fastify/rate-limit"));

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

try {
  await fastify.listen({ port, host: "0.0.0.0" });
  console.debug("We're live!");
} catch (err) {
  console.error(err); // TODO: Log the error
  process.exit(1);
}

// Shutdown the server when we receive a ctrl+c
function gracefulShutdown() {
  fastify
    .close()
    .then(() => {
      console.debug("Bye bye!");
      process.exit(0);
    })
    .catch(console.error);
}
process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);
