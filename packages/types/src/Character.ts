export interface Character {
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
}
