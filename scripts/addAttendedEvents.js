const { MongoClient } = require("mongodb");

require("dotenv").config();

const uri = process.env.MONGODB_CONNECTION_STR;

async function run() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    // Use the database from the connection string
    const db = client.db();
    const users = db.collection("users");
    const events = db.collection("events");

    const allEvents = await events.find({}).toArray();
    console.log(`Processing ${allEvents.length} events...`);

    // Initialize eventList for users who don't have it
    const result = await users.updateMany(
      { eventList: { $exists: false } },
      { $set: { eventList: [] } }
    );

    for (const event of allEvents) {
      if (!Array.isArray(event.registrants)) continue;

    const checkedInRegistrantIds = event.registrants
      .filter(r => r.checkedIn === true)
      .map(r => r.user);

    if (checkedInRegistrantIds.length > 0) {
      await users.updateMany(
        { _id: { $in: checkedInRegistrantIds } },
        { $addToSet: { eventList: event._id } } // $addToSet avoids duplicates
      );
    }
    }

    console.log("Migration completed.");

    console.log(`Updated ${result.modifiedCount} user(s).`);
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await client.close();
  }
}

run();
