import Fastify from "fastify";
import config from "config";

const port = config.get("centralServer.port");
const fastify = Fastify();

fastify.get("/", () => {
  return { hello: "world" };
});

try {
  await fastify.listen({ port, host: "0.0.0.0" });
} catch (err) {
  console.error(err);
  process.exit(1);
}

console.log("Running!?");

const interval = setInterval(() => {
  console.log("Wow, running!");
}, 60_000);

// Stop
function gracefulShutdown() {
  clearInterval(interval);
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
