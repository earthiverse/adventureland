import type { Movement } from "./Movement.js";
import type { Position } from "./Position.js";

export interface MonsterData {
  /** Maximum HP */
  maxHp: number;
  /** Maximum MP */
  maxMp: number;
  /** Speed idling */
  idleSpeed: number;
  /** Speed when targeting */
  targetSpeed: number;
  /** Experience given when killed */
  xp: number;
  /** Damage */
  attack: number;
  /** How fast the monster attacks (# attacks per second) */
  frequency: number;
}

export interface Monster extends MonsterData, Position, Movement {
  /** Unique ID for this monster on the server */
  id: string;
  /** Current HP */
  hp: number;
  /** Current MP */
  mp: number;
  /** If set, who this monster is currently targeting */
  target?: string;
}
