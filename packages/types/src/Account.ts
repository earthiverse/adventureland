export interface Account {
  /** Unique ID for the account */
  id: string;
  /** Email that the account belongs to */
  email: string;
  /** bcrypt of password */
  password: string;
  /** When the account signed up */
  signupDate: Date;
  /** Whether the email has been verified */
  verified: boolean;
}
