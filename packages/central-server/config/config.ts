import type { RateLimitOptions } from "@fastify/rate-limit";
import type { SyslogTransportOptions } from "winston-syslog";

declare module "config" {
  interface IConfig {
    centralServer: {
      port: number;
      changeEmail: {
        enabled: boolean;
        rateLimit: RateLimitOptions;
      };
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
      purchaseSlot: {
        enabled: boolean;
        rateLimit: RateLimitOptions;
        /** Cost (shells) to add an additional slot */
        cost: number;
        maxSlots: number;
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
        /** What to give the account on signup */
        initial: {
          shells: number;
          slots: number;
        };
      };
      status: {
        rateLimit: RateLimitOptions;
      };
      verifyEmail: {
        enabled: boolean;
        rateLimit: RateLimitOptions;
        codeLength: number;
      };
    };
    database: {
      uri: string;
      clientOptions: object;
      name: string;
    };
    discord: {
      uri: string;
    };
    email: {
      transport: object;
      defaults: object;
      addressBook: {
        help: string;
      };
    };
    jwt: {
      secret: string;
      expiresIn: string;
    };
    logging: {
      /** Whether or not to enable logging to console */
      console: boolean;
      /** If set, we will create a Syslog transport with these options */
      syslog?: SyslogTransportOptions;
    };
  }
}
