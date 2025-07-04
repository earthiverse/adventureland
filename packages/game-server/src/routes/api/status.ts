import { Type } from "@sinclair/typebox";
import Config from "config";
import { StatusCodes } from "http-status-codes";
import type { FastifyReplyTypebox, FastifyRequestTypebox } from "../types.ts";

const serverId = Config.get("gameServer.id");

const started = Date.now();

export const StatusSchema = {
  response: {
    [StatusCodes.OK]: Type.Object({
      serverId: Type.String(),
      status: Type.String(),
      ip: Type.String(),
      started: Type.Integer(),
      uptime: Type.Integer(),
      // TODO: Add stats about number of online players
    }),
  },
};

export const statusHandler = async (
  request: FastifyRequestTypebox<typeof StatusSchema>,
  reply: FastifyReplyTypebox<typeof StatusSchema>,
) => {
  const status = "OK";
  const ip = request.ip;
  const uptime = (Date.now() - started) / 1000;

  return reply.code(StatusCodes.OK).send({ serverId, status, ip, started, uptime });
};
