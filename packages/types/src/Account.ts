import type { Character } from "./Character.js";

export interface Account {
  email: string;
  /** bcrypt of password */
  password: string;
  characters: Character[];
  signupDate: Date;
}
