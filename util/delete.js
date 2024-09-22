/**
 * This is a script that can undo the changes that the migration.js script does by
 * deleting all the newly inserted records by matching their createdAt times.
 * 
 * To run the script type: node delete.js [PATH TO CSV FILE]
 */

const { parse } = require("csv-parse/sync");
const fs  = require("fs");

const User = require("../models/userModel");
const connectDb = require("../config/dbConnection");
const dotenv = require("dotenv").config({ path: '../.env' });

const CREATED_AT = 0;
const FILE_PATH = 2;

async function deleteRecords () {
  await connectDb();

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
  const records = parse(membershipData, { bom: true });
  
  console.log("Deleting...");
  const promises = records.map(async (record, i, records) => {
    if (i == 0 || !record[0]) {
      return;
    }
    
    await User.deleteOne({ createdAt: new Date(record[CREATED_AT]) });
  });

  await Promise.all(promises);
  console.log(`Finished`);
  process.exit();
}


deleteRecords();
