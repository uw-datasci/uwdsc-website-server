const { parse } = require("csv-parse/sync");
const fs  = require("fs");
const bcrypt = require("bcrypt");
const uuidv4 = require("uuid").v4;

const User = require("../models/userModel");
const connectDb = require("../config/dbConnection");
const dotenv = require("dotenv").config({ path: '../.env' });


const CREATED_AT = 0;
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

        const salt = bcrypt.genSaltSync(Number(process.env.SALT_ROUNDS));
        hash = bcrypt.hashSync(process.env.TEMP_PASSWORD+uuidv4(), salt);
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
        hasPaid,
        paymentMethod,
        isIncomplete
    };
}

// REMMEBER TO SWITCH HEARD_FROM_WHERE AND MEMBER IDEAS
connectDb();

const membershipData = fs.readFileSync('./members2024.csv');
const records = parse(membershipData, { bom: true });

for (let record of records) {
    const parsedRow = parseCSVRow(record);
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
}