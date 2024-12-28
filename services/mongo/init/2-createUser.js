/* global db */

const alDb = db.getSiblingDB(process.env.MONGO_DATABASE);

console.log("creating", process.env.MONGO_USERNAME, process.env.MONGO_PASSWORD);

// Create the user that we will authenticate with
alDb.createUser({
  user: process.env.MONGO_USERNAME,
  pwd: process.env.MONGO_PASSWORD,
  roles: [
    {
      role: "readWrite",
      db: process.env.MONGO_DATABASE,
    },
  ],
});
