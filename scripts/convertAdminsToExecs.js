const { MongoClient } = require("mongodb");

require("dotenv").config();

const uri = process.env.MONGODB_CONNECTION_STR;

async function run() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db();
    const users = db.collection("users");

    // Convert all admins to execs, except for specific admin names
    const excludedAdminNames = [
      "Jacob Yan",
      "Andrew Chu", // hehe
    ];

    const result = await users.updateMany(
      {
        userStatus: "admin",
        username: { $nin: excludedAdminNames }
      },
      { $set: { userStatus: "exec" } }
    );

    console.log("Migration completed.");

    console.log(`Updated ${result.modifiedCount} user(s).`);
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await client.close();
  }
}

run();
