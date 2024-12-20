/* global db, rs */

// TODO: Add variables
//       process.env["VARIABLE_NAME"]

// Create the adventureland user
db.createUser({
  user: "adventureland",
  pwd: "adventureland",
  roles: [
    {
      role: "readWrite",
      db: "adventureland",
    },
  ],
});

// Initiate replica set
rs.initiate();
