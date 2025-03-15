import type { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import type {
  FastifySchema,
  FastifyRequest,
  RouteGenericInterface,
  RawServerDefault,
  RawRequestDefaultExpression,
  FastifyReply,
  RawReplyDefaultExpression,
  ContextConfigDefault,
} from "fastify";
import type { ResolveFastifyReplyType } from "fastify/types/type-provider.js";

export type FastifyRequestTypebox<TSchema extends FastifySchema> =
  FastifyRequest<
    RouteGenericInterface,
    RawServerDefault,
    RawRequestDefaultExpression<RawServerDefault>,
    TSchema,
    TypeBoxTypeProvider
  >;

export type FastifyReplyTypebox<TSchema extends FastifySchema> = FastifyReply<
  RouteGenericInterface,
  RawServerDefault,
  RawRequestDefaultExpression<RawServerDefault>,
  RawReplyDefaultExpression<RawServerDefault>,
  ContextConfigDefault,
  TSchema,
  TypeBoxTypeProvider,
  ResolveFastifyReplyType<TypeBoxTypeProvider, TSchema, RouteGenericInterface>
>;
