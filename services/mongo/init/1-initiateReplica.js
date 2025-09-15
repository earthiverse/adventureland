/* global rs */

console.log("Initiating replica set...");

rs.initiate({
  _id: "rs0",
  members: [
    { _id: 0, host: "mongo:27017" }
  ]
});
