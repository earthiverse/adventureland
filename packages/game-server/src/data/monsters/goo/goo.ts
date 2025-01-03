import type { MonsterData } from "@adventureland/types";

const data: MonsterData = {
  maxHp: 100,
  maxMp: 2,
  idleSpeed: 6,
  targetSpeed: 12,
  xp: 100,
  attack: 5,
  frequency: 0.4,
};

export default { ...data };
