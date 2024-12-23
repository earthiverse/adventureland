export interface Character {
  /** Internal ID (can NOT be changed) */
  id: number;
  /** Character name (can be changed) */
  name: string;
  /** When the character was created */
  createdDate: Date;
}
