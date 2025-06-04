const { MongoClient } = require("mongodb");

require("dotenv").config();

const uri = process.env.MONGODB_CONNECTION_STR;

async function run() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db();
    const users = db.collection("users");

    // Initialize isMathSocMember field for all users
    const result = await users.updateMany(
      { isMathSocMember: { $exists: false } },
      { $set: { isMathSocMember: false } }
    );

    // Set isMathSocMember to true if they are in the math faculty
    await users.updateMany(
      { faculty: "Math" },
      { $set: { isMathSocMember: true } }
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
