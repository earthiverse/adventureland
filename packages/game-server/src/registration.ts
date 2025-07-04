import Config from "config";
import { StatusCodes } from "http-status-codes";
import { signer } from "./jwt.ts";
import { Logger } from "./logger.ts";

const centralServerUrl = Config.get("centralServer.url");
const serverId = Config.get("gameServer.id");
const url = Config.get("gameServer.url");
const port = Config.get("gameServer.port");
const serverUrl = port === 80 ? `${url}` : `${url}:${port}`;

const token = signer({ serverId, serverUrl });

export async function registerWithCentralServer(): Promise<boolean> {
  try {
    const response = await fetch(`${centralServerUrl}/serverApi/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
    const success = response.status === StatusCodes.OK;

    if (!success) {
      Logger.alert("Unable to register with central server", {
        centralServerUrl,
        serverId,
        serverUrl,
        response: response.json(),
      });
    }

    return success;
  } catch (error) {
    Logger.alert("Unable to register with central server", {
      centralServerUrl,
      serverId,
      serverUrl,
      error: error instanceof Error ? error.message : undefined,
    });

    return false;
  }
}

export async function unregisterWithCentralServer(): Promise<boolean> {
  try {
    const response = await fetch(`${centralServerUrl}/serverApi/unregister`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
    const success = response.status === StatusCodes.OK;

    if (!success) {
      Logger.alert("Unable to unregister with central server", {
        centralServerUrl,
        serverId,
        serverUrl,
        response: response.json(),
      });
    }

    return success;
  } catch (error) {
    Logger.alert("Unable to unregister with central server", {
      centralServerUrl,
      serverId,
      serverUrl,
      error: error instanceof Error ? error.message : undefined,
    });

    return false;
  }
}
