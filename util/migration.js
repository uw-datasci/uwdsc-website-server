/**
 * This is a script for migrating data from a CSV file into the MongoDB database.
 * The expected CSV file should be the same as the Fall 2024 Membership Tracker file.
 * The column names don't have to be the exact same, but the order of the information should be.
 * 
 * To run the script type: node migration.js [PATH TO CSV FILE]
 * 
 * The script will create the importErrors directory and create 2 files:
 *     * duplicate.txt -- containing the emails of duplicate rows in the csv
 *     * error.json -- containing the csv row that caused the error and the error message
 * 
 * Extra Notes:
 *     * The csv files from Google Sheets contain a bunch of extra rows because the Paid Cash, 
 *         Paid Mathsoc, and Paid Online extend way further down, which will cause the script 
 *         to show that there are 1000+ errors. It will probably be fine but you could also
 *         just manually delete those extra rows.
 *     * Between the Summer 2024 and Fall 2024 Membership Trackers, the "heard from where" and 
 *         "member ideas" columns are swapped so similar things can happen in the future.
 *         Be careful with the CSV files!
 */

const { parse } = require("csv-parse/sync");
const fs  = require("fs");
const bcrypt = require("bcrypt");

const User = require("../models/userModel");
const connectDb = require("../config/dbConnection");
const dotenv = require("dotenv").config({ path: '../.env' });


const CREATED_AT = 0;
const USERNAME = 2;
const WATIAM = 3;
const WATERLOO_EMAIL = 4;
const FACULTY = 5;
const TERM = 6;
const HEARD_FROM_WHERE = 7;
const MEMBER_IDEAS = 8;
const PAID_CASH = 9;
const PAID_ONLINE = 10;
const PAID_MATHSOC = 11;
const VERIFIER = 12;
const PAYMENT_LOCATION = 13;

const parseCSVRow = (csvRow) => {
    let hasPaid = false;
    let paymentMethod;
    let faculty = "";
    let hash = "";
    let isIncomplete = false;
    try {
        if (csvRow[PAID_CASH] === "TRUE") {
            hasPaid = true;
            paymentMethod = "Cash";
        } else if (csvRow[PAID_ONLINE] === "TRUE") {
            hasPaid = true;
            paymentMethod = "Online";
        } else if (csvRow[PAID_MATHSOC] === "TRUE") {
            hasPaid = true;
            paymentMethod = "MathSoc";
        }

        const indexOfAt = csvRow[WATERLOO_EMAIL].indexOf('@');

        if (csvRow[WATIAM].toLowerCase() !== csvRow[WATERLOO_EMAIL].substring(0, indexOfAt).toLowerCase()) {
            isIncomplete = true;
        }

        if (!csvRow[HEARD_FROM_WHERE]) {
            isIncomplete = true;
        }

        faculty = csvRow[FACULTY].split(',')[0];
        if (csvRow[FACULTY].split(',').includes("Math")) {
            faculty = "Math";
        }

        const salt = bcrypt.genSaltSync(10);
        hash = bcrypt.hashSync(process.env.TEMP_PASSWORD, salt);
    } catch (err) {
        console.log("An error occured while parsing this:", csvRow);
        console.log(err);
        isIncomplete = true;
    }

    return {
        createdAt: csvRow[CREATED_AT],
        uwEmail: csvRow[WATERLOO_EMAIL],
        username: csvRow[USERNAME],
        watIAM: csvRow[WATIAM],
        faculty: faculty,
        term: csvRow[TERM],
        memberIdeas: csvRow[MEMBER_IDEAS],
        heardFromWhere: csvRow[HEARD_FROM_WHERE],
        verifier: csvRow[VERIFIER],
        paymentLocation: csvRow[PAYMENT_LOCATION],
        userStatus: "member",
        password: hash,
        isEmailVerified: true,
        hasPaid,
        paymentMethod,
        isIncomplete
    };
}

const FILE_PATH = 2;
const DUPLICATES_FILE = "importErrors/duplicates.txt";
const ERROR_FILE = "importErrors/error.json";

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
    console.log("Creating Users...");
    let errors = [];
    const promises = records.map(async (record, i, records) => {
        if (i == 0) { // skip the headers and overwrite existing files
            fs.writeFileSync(DUPLICATES_FILE, "");
            fs.writeFileSync(ERROR_FILE, "");
            return;
        }

        const progress = ((i / records.length) * 100).toFixed(2);
        process.stdout.write(`Progress: ${progress}%\r`);
        
        let parsedRow = parseCSVRow(record);
        try {

            // If these values don't exist, then there isn't really a way of finding the person
            if (!parsedRow.email && !parsedRow.uwEmail && !parsedRow.username && !parsedRow.watIAM) {
                throw new Error("Parsed Row Error: Missing email, uwEmail, username, and watIAM!");
            }

            delete parsedRow.email;
            const createdRecord = await User.create(parsedRow);
            if (parsedRow.createdAt) {
                await User.findOneAndUpdate(
                    { _id: createdRecord._id },
                    { createdAt: new Date(parsedRow.createdAt) }
                );
            }
        } catch(error) {
            if (error?.errorResponse?.errmsg?.includes("duplicate key error")) {
                const existingUser = await User.findOne({ uwEmail: parsedRow.uwEmail });
                if (!existingUser.hasPaid && parsedRow.hasPaid) {
                    await User.findOneAndUpdate({ uwEmail: parsedRow.uwEmail }, { hasPaid: parsedRow.hasPaid });
                }
                fs.appendFileSync(
                    DUPLICATES_FILE,
                    JSON.stringify(error.errorResponse.keyValue.uwEmail) + '\n'
                );
            } else {
                errors.push({row: parsedRow, error: error.message});
            }
        }
    });

    await Promise.all(promises);
    try {
        fs.writeFileSync(ERROR_FILE, JSON.stringify(errors));
    } catch (error) {
        console.error("Error when writing to error file");
        console.error(error);
    }

    console.log(`Finished with ${errors.length} errors`);
    process.exit();
}

main();
