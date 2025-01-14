import type { CharacterType } from "./CharacterType.ts";
import type { Movement } from "./Movement.js";
import type { Position } from "./Position.js";

export interface CharacterData {
  /** The account that this character belongs to */
  accountId: string;
  /** Internal ID (can NOT be changed) */
  id: string;
  /** Character name (can be changed) */
  name: string;
  /** When the character was created */
  createdDate: Date;
  /** If the character is online, this is the server it is connected to */
  online?: string;
  /** What type of character it is */
  type: CharacterType;
  /** Current level */
  level: number;
  /** NOTE: This will reset when the character levels up */
  xp: number;
}

export interface Character extends CharacterData, Position, Movement {}
