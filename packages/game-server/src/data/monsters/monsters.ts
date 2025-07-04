import type { MonsterData } from "@adventureland/types";
import bee from "./bee/bee.ts";
import goo from "./goo/goo.ts";

const monsterData: { [T in string]: MonsterData } = {
  bee,
  goo,
};

export default monsterData;
