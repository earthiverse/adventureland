import type { AccountData, CharacterData } from "@adventureland/types";
import Config from "config";
import { MongoClient } from "mongodb";

const uri = Config.get("database.uri");
const name = Config.get("database.name");
const options = Config.get("database.clientOptions");

const client = new MongoClient(uri, options);
await client.connect();

const database = client.db(name);

const accounts = database.collection<AccountData>("accounts");
const characters = database.collection<CharacterData>("characters");

export {
  // Collections
  accounts as Accounts,
  characters as Characters,
  client as Client,
  database as Database,
};
