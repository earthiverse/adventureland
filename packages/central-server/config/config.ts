declare module "config" {
  interface IConfig {
    centralServer: {
      port: number;
      jwt: {
        secret: string;
        expiresIn: string;
      };
      login: {
        enabled: boolean;
      };
      signup: {
        enabled: boolean;
      };
    };
    database: {
      uri: string;
      clientOptions: object;
      name: string;
    };
  }
}
