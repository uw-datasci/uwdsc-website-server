const { parse } = require("csv-parse/sync");
const fs  = require("fs");
const bcrypt = require("bcrypt");
const uuidv4 = require("uuid").v4;

const User = require("../models/userModel");
const connectDb = require("../config/dbConnection");
const dotenv = require("dotenv").config({ path: '../.env' });


const CREATED_AT = 0;
const EMAIL = 1;
const USERNAME = 2;
const WATIAM = 3;
const WATERLOO_EMAIL = 4;
const FACULTY = 5;
const TERM = 6;
const HEARD_FROM_WHERE = 8;
const MEMBER_IDEAS = 7;
const PAID_CASH = 9;
const PAID_ONLINE = 10;
const PAID_MATHSOC = 11;
const VERIFIER = 12;
const PAYMENT_LOCATION = 13;
const HAS_PAID = 14;

const parseCSVRow = (csvRow) => {
    let hasPaid = false;
    let paymentMethod;
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

    let isIncomplete = false;
    const indexOfAt = csvRow[WATERLOO_EMAIL].indexOf('@');

    if (csvRow[WATIAM].toLowerCase() !== csvRow[WATERLOO_EMAIL].substring(0, indexOfAt).toLowerCase()) {
        isIncomplete = true;
    }

    if (!csvRow[HEARD_FROM_WHERE]) {
        isIncomplete = true;
    }

    const salt = bcrypt.genSaltSync(Number(process.env.SALT_ROUNDS));
    const hash = bcrypt.hashSync(process.env.TEMP_PASSWORD+uuidv4(), salt);

    return {
        createdAt: csvRow[CREATED_AT],
        email: csvRow[EMAIL],
        uwEmail: csvRow[WATERLOO_EMAIL],
        username: csvRow[USERNAME],
        watIAM: csvRow[WATIAM],
        faculty: csvRow[FACULTY].split(',')[0],
        term: csvRow[TERM],
        memberIdeas: csvRow[MEMBER_IDEAS],
        heardFromWhere: csvRow[HEARD_FROM_WHERE],
        verifier: csvRow[VERIFIER],
        paymentLocation: csvRow[PAYMENT_LOCATION],
        userStatus: "member",
        password: hash,
        hasPaid,
        paymentMethod,
        isIncomplete
    };
}

// REMMEBER TO SWITCH HEARD_FROM_WHERE AND MEMBER IDEAS
connectDb();

const membershipData = fs.readFileSync('./members2024.csv');
const records = parse(membershipData, { bom: true });

const parsedRow = parseCSVRow(records[60]);
User.create(
    parsedRow
).then(record => {
    const updatedRecord = User.findOneAndUpdate(
        { _id: record._id },
        {
            createdAt: new Date(parsedRow.createdAt)
        },
        {
            new: true
        }
    );

    return updatedRecord;
}).then(updatedRecord => {
    console.log(updatedRecord);
    User.deleteOne({ _id: updatedRecord._id });
}).catch(error => console.error(error));
