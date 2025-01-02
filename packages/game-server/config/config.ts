declare module "config" {
  interface IConfig {
    gameServer: {
      /** Unique ID for the current server */
      id: string;
      port: number;
      /**
       * How many characters an account can have active at one time
       *
       * NOTE: This does not include merchants
       */
      maxActiveCharacters: number;
      /** How many merchants an account can have online at one time */
      maxActiveMerchants: number;
      /** How many characters an account can have */
      maxCharacters: number;
    };
    database: {
      uri: string;
      clientOptions: object;
      name: string;
    };
    jwt: {
      secret: string;
    };
  }
}
