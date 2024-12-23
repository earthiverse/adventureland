import { signupHandler, SignupSchema } from "./routes/api/signup.js";
import { type TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import Config from "config";
import Fastify from "fastify";

const port = Config.get("centralServer.port");
const fastify = Fastify().withTypeProvider<TypeBoxTypeProvider>();

fastify.get("/", () => {
  return { hello: "world" };
});

fastify.post("/api/signup", { schema: SignupSchema }, signupHandler);

try {
  await fastify.listen({ port, host: "0.0.0.0" });
} catch (err) {
  console.error(err);
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
