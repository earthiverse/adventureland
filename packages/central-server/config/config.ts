declare module "config" {
  interface IConfig {
    centralServer: {
      port: number;
      jwt: {
        secret: string;
        expiresIn: string;
      };
      signup: {
        enabled: boolean;
      };
    };
    database: {
      name: string;
      host: string;
      username: string;
      password: string;
      port: number;
    };
  }
}
