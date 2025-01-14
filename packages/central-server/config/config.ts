import type { RateLimitOptions } from "@fastify/rate-limit";

declare module "config" {
  interface IConfig {
    centralServer: {
      port: number;
      createCharacter: {
        enabled: boolean;
        rateLimit: RateLimitOptions;
        /** Minimum allowed character name length */
        minLength: number;
        /** Maximum allowed character name length */
        maxLength: number;
        /** Regex pattern character names must adhere to */
        pattern: string;
      };
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
