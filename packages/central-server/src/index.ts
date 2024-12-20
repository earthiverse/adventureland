import Fastify from "fastify";

const fastify = Fastify();

fastify.get("/", () => {
  return { hello: "world" };
});

try {
  await fastify.listen({ port: 80, host: "0.0.0.0" });
} catch (err) {
  console.error(err);
  process.exit(1);
}

console.log("Running!?");

setInterval(() => {
  console.log("Wow, running!");
}, 60_000);
