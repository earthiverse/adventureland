export interface AuthTokenPayload {
  /** The account ID that the token is for */
  accountId: string;
}

export interface AuthToken extends AuthTokenPayload {
  /** When the token expires */
  exp: number;
  /** When the token was issued */
  iat: number;
}

export interface ServerAuthTokenPayload {
  /** The server ID that the token is for */
  serverId: string;
  /** The URL to connect to the server (schema, address & port) */
  serverUrl: string;
}

export interface ServerAuthToken extends ServerAuthTokenPayload {
  /** When the token was issued */
  iat: number;
}
