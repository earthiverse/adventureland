export interface AccountData {
  /** Unique ID for the account */
  id: string;
  /** Email that the account belongs to */
  email: string;
  /** bcrypt of password */
  password: string;
  /** Number of shells the account has (in-game currency) */
  shells: number;
  /** When the account signed up */
  signupDate: Date;
  /** Whether the email has been verified */
  verified: boolean;

  /** If the player requests to change their email */
  emailChange?: {
    /** The new email they wish to use */
    newEmail: string;
    /** Verification code to check against */
    verificationCode: string;
  };
}
