declare module "config" {
  interface IConfig {
    centralServer: {
      port: number;
    };
    database: {
      database: string;
      host: string;
      username: string;
      password: string;
      port: number;
    };
  }
}
