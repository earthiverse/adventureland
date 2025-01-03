export interface Movement {
  /**
   * Where the entity is moving to.
   */
  going?: {
    x: number;
    y: number;
    speed: number;
  };
}
