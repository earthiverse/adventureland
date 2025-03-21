import { Logger } from "./logger.ts";
import Config from "config";

const serverId = Config.get("gameServer.id");

/**
 * Game logic
 * @param initial Whether this loop is the first loop or not
 */
export async function gameLoop(initial: boolean) {
  try {
    // TODO: Find monsters that aren't moving, but should be, and update them
  } catch (error) {
    if (initial) {
      throw error;
    } else {
      Logger.error("Error in game loop", { serverId, error });
    }
  } finally {
    setTimeout(() => void gameLoop(false), 1000 / 60); // TODO: Move to config
  }
}
