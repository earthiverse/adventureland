import type { RateLimitOptions } from "@fastify/rate-limit";
import type { SyslogTransportOptions } from "winston-syslog";

declare module "config" {
  interface IConfig {
    centralServer: {
      /** Url to access central server (scheme, hostname, and port) */
      url: string;
    };
    gameServer: {
      /** Unique ID for the current server */
      id: string;
      /** Url to access server (scheme and hostname) */
      url: string;
      /** Port to access server */
      port: number;
      /** How many non-merchant characters an account can have active at one time */
      maxActiveCharacters: number;
      /** How many merchants an account can have online at one time */
      maxActiveMerchants: number;
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
    };
    logging: {
      /** Whether or not to enable logging to console */
      console: boolean;
      /** If set, we will create a Syslog transport with these options */
      syslog?: SyslogTransportOptions;
    };
  }
}
