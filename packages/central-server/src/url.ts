import type { FastifyRequest } from "fastify";

/**
 * Generates a URL with the route using whatever host Fastify received the request with
 * @param request
 * @param route
 * @returns
 */
export function generateUrl(request: FastifyRequest, route: string) {
  let url = `${request.protocol}://${request.hostname}`;
  if (request.port !== 80) {
    url += `:${request.port}`;
  }
  return url + route;
}
