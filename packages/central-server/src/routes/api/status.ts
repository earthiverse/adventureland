import type { FastifyReplyTypebox, FastifyRequestTypebox } from "../types.ts";
import { Type } from "@sinclair/typebox";
import { StatusCodes } from "http-status-codes";

// TODO: Add token

const started = Date.now();

export const StatusSchema = {
  response: {
    [StatusCodes.OK]: Type.Object({
      status: Type.String(),
      ip: Type.String(),
      started: Type.Integer(),
      uptime: Type.Integer(),
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

  return reply.code(StatusCodes.OK).send({ status, ip, started, uptime });
};
