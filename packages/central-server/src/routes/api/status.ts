import type { FastifyReplyTypebox, FastifyRequestTypebox } from "../types.ts";
import { Type } from "@sinclair/typebox";
import { StatusCodes } from "http-status-codes";

export const StatusSchema = {
  response: {
    [StatusCodes.OK]: Type.Object({
      status: Type.String(),
      ip: Type.String(),
    }),
  },
};

export const statusHandler = async (
  request: FastifyRequestTypebox<typeof StatusSchema>,
  reply: FastifyReplyTypebox<typeof StatusSchema>,
) => {
  const status = "OK";
  const ip = request.ip;

  return reply.code(StatusCodes.OK).send({ status, ip });
};
