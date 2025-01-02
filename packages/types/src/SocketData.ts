import type { Account } from "./Account.js";
import type { Character } from "./Character.js";

export interface SocketData {
  account: Account;
  character: Character;
}
