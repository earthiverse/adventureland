import { Characters } from "./database.ts";
import { Logger } from "./logger.ts";
import State, { type ServerState } from "./state.ts";
import Config from "config";
import { StatusCodes } from "http-status-codes";
import { LRUCache } from "lru-cache";

const checkLoopInterval = Config.get("centralServer.checkLoop.interval");
const timeout = Config.get("centralServer.checkLoop.timeout");
const numBeforeUnhealthy = Config.get(
  "centralServer.checkLoop.numChecksBeforeUnhealthy",
);

const healthData = new LRUCache<string, number>({ max: 10 });

/**
 * Queries the game server's /api/status endpoint to see if it responds
 * @param serverId
 * @param serverState
 * @returns True if the game server seems healthy
 */
export async function checkGameServerHealth(
  serverId: string,
  serverState: ServerState,
): Promise<boolean> {
  try {
    // Ping the server
    const response = await fetch(serverState.serverUrl + "/api/status", {
      signal: AbortSignal.timeout(timeout),
    });

    // Check the response
    // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
    if (response.status !== StatusCodes.OK) {
      return false;
    }

    const responseJson = (await response.json()) as {
      status: string;
      serverId: string;
    };
    if (responseJson.status !== "OK" || responseJson.serverId !== serverId) {
      return false;
    }
  } catch {
    return false; // Couldn't ping
  }

  // Server is healthy
  return true;
}

/**
 * Sets any characters that are marked as online on the given server offline
 * @param serverId
 * @returns Number of characters set offline
 */
export async function setCharactersOffline(serverId: string): Promise<number> {
  const result = await Characters.updateMany(
    { online: serverId },
    { $unset: { online: 1 } },
  );
  return result.modifiedCount;
}

/**
 * Check logic
 * @param initial Whether this loop is the first loop or not
 */
export async function checkLoop(initial: boolean) {
  try {
    // Check the health of servers
    for (const [serverId, serverData] of Object.entries(
      State.registeredServers,
    )) {
      if (await checkGameServerHealth(serverId, serverData)) {
        if (!serverData.online) {
          serverData.online = true;
          Logger.notice("Game server recovered", {
            serverId,
            ip: serverData.ip,
            numFails: healthData.get(serverId),
          });
        }

        // Server is healthy
        healthData.delete(serverId);
        continue;
      }

      const numFails = (healthData.get(serverId) ?? 0) + 1;
      healthData.set(serverId, numFails);
      if (numFails >= numBeforeUnhealthy && serverData.online) {
        serverData.online = false;
        const numCharactersSetOffline = await setCharactersOffline(serverId);
        Logger.warning("Game server is unhealthy", {
          serverId,
          ip: serverData.ip,
          numCharactersSetOffline,
        });
      }
    }
  } catch (error) {
    if (initial) {
      throw error;
    } else {
      Logger.error("Error in health loop", { error });
    }
  } finally {
    setTimeout(() => void checkLoop(false), checkLoopInterval);
  }
}
