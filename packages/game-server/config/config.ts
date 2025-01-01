declare module "config" {
  interface IConfig {
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
