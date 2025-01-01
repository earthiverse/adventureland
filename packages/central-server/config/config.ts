import type { RateLimitOptions } from "@fastify/rate-limit";

declare module "config" {
  interface IConfig {
    centralServer: {
      port: number;
      login: {
        enabled: boolean;
        rateLimit: RateLimitOptions;
      };
      signup: {
        enabled: boolean;
        rateLimit: RateLimitOptions;
      };
      status: {
        rateLimit: RateLimitOptions;
      };
    };
    database: {
      uri: string;
      clientOptions: object;
      name: string;
    };
    jwt: {
      secret: string;
      expiresIn: string;
    };
  }
}
