/* global db */

// Create the user that we will authenticate with
db.createUser({
  user: process.env.MONGO_USERNAME,
  pwd: process.env.MONGO_PASSWORD,
  roles: [
    {
      role: "readWrite",
      db: process.env.MONGO_DATABASE,
    },
  ],
});
