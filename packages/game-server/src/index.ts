console.log("Running!?");

const interval = setInterval(() => {
  console.log("Wow, running!");
}, 60_000);

// Stop
function gracefulShutdown() {
  clearInterval(interval);
  console.debug("Bye bye!");
  process.exit(0);
}
process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);
