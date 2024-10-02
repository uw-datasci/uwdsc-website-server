const { parse } = require("csv-parse/sync");
const fs = require("fs");
const User = require("../models/userModel");
const connectDb = require("../config/dbConnection");
const dotenv = require("dotenv").config({ path: '../.env' });

const FILE_PATH = 2;  // Path to CSV file from the command-line arguments
const INCONSISTENCIES_FILE = "importErrors/inconsistencies.txt";  // Output file for inconsistencies

// CSV column mappings
const WATERLOO_EMAIL = 4;
const PAID_CASH = 9;
const PAID_ONLINE = 10;
const PAID_MATHSOC = 11;

// Function to determine if the user has paid based on CSV row
const hasUserPaid = (csvRow) => {
  return csvRow[PAID_CASH] === "TRUE" || csvRow[PAID_ONLINE] === "TRUE" || csvRow[PAID_MATHSOC] === "TRUE";
};

async function main() {
  await connectDb();

  if (!fs.existsSync("importErrors")) {
    fs.mkdirSync("importErrors");
  }

  const args = process.argv;

  if (args.length != 3) {
    console.error("Usage: node migration.js [FILE NAME]");
    process.exit();
  }

  const path = args[FILE_PATH];
  if (!fs.existsSync(path)) {
    console.error(`No file at path: ${path}`);
    process.exit();
  }

  const membershipData = fs.readFileSync(path);
  let records = parse(membershipData, { bom: true });
  console.log("Checking Users...");

  let inconsistencies = [];

  const promises = records.map(async (record, i) => {
    if (i == 0) {  // Skip headers
      fs.writeFileSync(INCONSISTENCIES_FILE, "");  // Clear the file if it exists
      return;
    }

    const progress = ((i / records.length) * 100).toFixed(2);
    process.stdout.write(`Progress: ${progress}%\r`);

    const uwEmail = record[WATERLOO_EMAIL].toLowerCase().trim();
    const csvHasPaid = hasUserPaid(record);

    if(uwEmail === ""){
      return;
    }

    try {
      const dbUser = await User.findOne({ uwEmail });

     

      if (!dbUser) {
        // User not found in the database
        inconsistencies.push({
          uwEmail,
          error: "User not found in database",
        });
      } else if (dbUser.hasPaid !== csvHasPaid) {
        // `hasPaid` value does not match
        inconsistencies.push({
          uwEmail,
          csvHasPaid,
          dbHasPaid: dbUser.hasPaid,
          error: "Discrepancy in hasPaid status",
        });
      }
    } catch (error) {
      console.error(`Error checking user ${uwEmail}:`, error.message);
      inconsistencies.push({
        uwEmail,
        error: error.message,
      });
    }
  });

  await Promise.all(promises);

  // Write inconsistencies to the output file
  try {
    fs.writeFileSync(INCONSISTENCIES_FILE, JSON.stringify(inconsistencies, null, 2));
    console.log(`Finished. Found ${inconsistencies.length} inconsistencies. Check ${INCONSISTENCIES_FILE} for details.`);
  } catch (error) {
    console.error("Error when writing to inconsistencies file", error.message);
  }

  process.exit();
}

main();
