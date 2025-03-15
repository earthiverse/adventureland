import { Logger } from "./logger.ts";

/** Game Loop */
export async function gameLoop() {
  try {
    // TODO: Find monsters that aren't moving, but should be, and update them
  } catch (error) {
    Logger.error("Error in game loop", { error });
  } finally {
    setTimeout(() => void gameLoop(), 1000 / 60); // TODO: Move to config
  }
}
