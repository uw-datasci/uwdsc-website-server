const { MongoClient } = require("mongodb");
const readline = require("readline");

require("dotenv").config();

const uri = process.env.MONGODB_CONNECTION_STR;
const exportPaidUsers = require("./exportPaidUsers");

async function resetPayments() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db();
    const users = db.collection("users");

    // reset all payment fields for previously paid users
    const result = await users.updateMany(
      { hasPaid: true },
      {
        $set: {
          hasPaid: false,
          paymentLocation: "",
          paymentMethod: "",
          verifier: "",
        },
      }
    );
    console.log(`Reset payments for ${result.modifiedCount} users.`);
  } catch (err) {
    console.error("Error resetting payments: ", err);
  } finally {
    await client.close();
  }
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// payment reset confirmation question
rl.question(
  "⚠️ Are you sure you want to reset all payments for members? Type YES to continue: ",
  async (answer) => {
    if (answer === "YES") {
      await exportPaidUsers();
      await resetPayments();
    } else {
      console.log("Cancelled.");
    }
    rl.close();
  }
);

// to run: node ./scripts/resetPayments.js
