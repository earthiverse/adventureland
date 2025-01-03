import type { MonsterData } from "@adventureland/types";

const data: MonsterData = {
  maxHp: 400,
  maxMp: 6,
  idleSpeed: 12,
  targetSpeed: 20,
  xp: 400,
  attack: 16,
  frequency: 0.5,
};

export default { ...data };
