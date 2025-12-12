const { MongoClient } = require("mongodb");
const { createObjectCsvWriter } = require("csv-writer");
const os = require("os");
const path = require("path");
require("dotenv").config();

const uri = process.env.MONGODB_CONNECTION_STR;
const client = new MongoClient(uri);

function getTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function exportPaidUsers() {
  try {
    await client.connect();
    const db = client.db();
    const users = db.collection("users");

    // Fetch only paid members
    const paidUsers = await users.find({ hasPaid: true }).toArray();
    const timestamp = getTimestamp();

    // Path to Downloads folder
    const downloadsPath = path.join(
      os.homedir(),
      "Downloads",
      `paid_users_${timestamp}.csv`
    );

    // Configure CSV writer
    const csvWriter = createObjectCsvWriter({
      path: downloadsPath,
      header: [
        { id: "username", title: "Username" },
        { id: "email", title: "Email" },
        { id: "watIAM", title: "watIAM" },
        { id: "faculty", title: "Faculty" },
        { id: "isMathSocMember", title: "isMathSocMember" },
        { id: "term", title: "Term" },
        { id: "paymentMethod", title: "PaymentMethod" },
        { id: "paymentLocation", title: "PaymentLocation" },
        { id: "verifier", title: "Verified By" },
      ],
    });

    // Map users to plain objects
    const records = paidUsers.map((user) => ({
      username: user.username,
      email: user.email,
      watIAM: user.watIAM,
      faculty: user.faculty,
      isMathSocMember: user.isMathSocMember,
      term: user.term,
      paymentMethod: user.paymentMethod || "",
      paymentLocation: user.paymentLocation || "",
      verifier: user.verifier || "",
    }));

    await csvWriter.writeRecords(records);
    console.log(`Paid users exported to ${downloadsPath}`);
  } catch (err) {
    console.error("Error exporting paid users:", err);
  } finally {
    await client.close();
  }
}

// to run: node ./scripts/exportPaidUsers.js
if (require.main === module) {
  exportPaidUsers();
}

module.exports = exportPaidUsers;
