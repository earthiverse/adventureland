export interface AuthTokenPayload {
  /** The account ID that the token is for */
  accountId: string;
}

export interface AuthToken extends AuthTokenPayload {
  /** When the token expires */
  exp: number;
}
