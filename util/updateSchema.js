const bcrypt = require('bcrypt');
const User = require("../models/userModel");
const connectDb = require("../config/dbConnection");
const dotenv = require("dotenv").config({ path: '../.env'});

const newColumns = [
    {
        name: "hasPaid",
        tempVal: false
    }, 
    {
        name: "watIAM",
        tempVal: undefined
    },
    {
        name: "uwEmail",
        tempVal: undefined
    },
    {
        name: "faculty",
        tempVal: "Math"
    }, 
    {
        name: "term",
        tempVal: "2B"
    }, 
    {
        name: "heardFromWhere",
        tempVal: "online :)"
    },
    {
        name: "paymentLocation",
        tempVal: "Online"
    },
    {
        name: "paymentMethod",
        tempVal: "Online"
    },
    {
        name: "verifier",
        tempVal: "shae"
    },
    {
        name: "memberIdeas",
        tempVal: ""
    },
    {
        name: "token",
        tempVal: undefined
    },
    {
        name: "password",
        tempVal: Number(process.env.SALT_ROUNDS)
    }
];

const updateDocuments = async (user, columns) => {
    columns.map(async column => {
        if (user[column.name] || column.name === "token") {
            return;
        }

        console.log(column);

        if (column.name === "watIAM") {
            const atSymbolIndex = user.email.indexOf("@");
            user[column.name] = user.email.substring(0, atSymbolIndex);
        } else if (column.name === "uwEmail") {
            user[column.name] = user.watIAM + '@uwaterloo.ca';
        } else if (column.name === "password") {
            const salt = bcrypt.genSaltSync(column.tempVal);
            const hash = bcrypt.hashSync(process.env.TEMP_PASSWORD, salt);
            user[column.name] = hash;
        } else  {
            user[column.name] = column.tempVal;
        }
    });

    await user.save();
    return user;
};

const updateAllDocuments = async () => {
    const users = await User.find({});

    const updatePromises = users.map(async user => await updateDocuments(user, newColumns));
    const updatedUsers = await Promise.all(updatePromises);

    console.log("Updated Users: ", updatedUsers);
};

connectDb();
updateAllDocuments();