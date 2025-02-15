import type { RateLimitOptions } from "@fastify/rate-limit";

declare module "config" {
  interface IConfig {
    centralServer: {
      port: number;
      createCharacter: {
        enabled: boolean;
        rateLimit: RateLimitOptions;
        /** Minimum allowed character name length when creating */
        minLength: number;
        /** Maximum allowed character name length when creating */
        maxLength: number;
        /** Regex pattern character names must adhere to */
        pattern: string;
      };
      login: {
        enabled: boolean;
        rateLimit: RateLimitOptions;
      };
      renameCharacter: {
        enabled: boolean;
        rateLimit: RateLimitOptions;
        /** Minimum allowed character name length when renaming */
        minLength: number;
        /** Maximum allowed character name length when renaming */
        maxLength: number;
        /** Cost (shells) to rename a character of the given length */
        costs: { [T in number]: number };
        /** Regex pattern character names must adhere to */
        pattern: string;
      };
      signup: {
        enabled: boolean;
        rateLimit: RateLimitOptions;
        /** How many shells to give a user on signup */
        initialShells: number;
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
