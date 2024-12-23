import type { Account, Character } from "@adventureland/types";
import Config from "config";
import { MongoClient } from "mongodb";

const host = Config.get("database.host");
const port = Config.get("database.port");
const username = Config.get("database.username");
const password = Config.get("database.password");
const name = Config.get("database.name");

const client = new MongoClient(
  `mongodb+srv://${username}:${password}@${host}:${port}/${name}`,
);

await client.connect();

const database = client.db(name);

// Accounts have unique emails
const accounts = database.collection<Account>("accounts");
await accounts.createIndex({ email: 1 }, { unique: true });

// Characters have unique IDs and names
const characters = database.collection<Character>("characters");
await characters.createIndex({ id: 1 }, { unique: true });
await characters.createIndex({ name: 1 }, { unique: true });

export {
  client as Client,
  database as Database,

  // Collections
  accounts as Accounts,
  characters as Characters,
};
