import type { AccountData, CharacterData } from "@adventureland/types";
import Config from "config";
import { MongoClient } from "mongodb";

const uri = Config.get("database.uri");
const name = Config.get("database.name");
const options = Config.get("database.clientOptions");

const client = new MongoClient(uri, options);
await client.connect();

const database = client.db(name);

// Accounts have unique IDs and emails
const accounts = database.collection<AccountData>("accounts");
await accounts.createIndex({ id: 1 }, { unique: true });
await accounts.createIndex({ email: 1 }, { unique: true });

// Characters have unique IDs and names
const characters = database.collection<CharacterData>("characters");
await characters.createIndex({ id: 1 }, { unique: true });
await characters.createIndex({ name: 1 }, { unique: true });

export {
  client as Client,
  database as Database,

  // Collections
  accounts as Accounts,
  characters as Characters,
};
