require("../models/eventModel");
const { default: mongoose } = require("mongoose");
const Event = mongoose.model("events");
const connectDb = require("../config/dbConnection");
const dotenv = require("dotenv").config({ path: "../.env" });
const fs = require('fs');

function convertArrayToCSV(array) {
    if (!array.length) {
        console.error("Array is empty");
        return;
    }

    const headers = Object.keys(array[0]);
    const csvRows = array.map(row => 
        headers.map(header => JSON.stringify(row[header] || "")).join(",")
    );

    csvRows.unshift(headers.join(","));
    return csvRows.join("\n");
}

function saveCSVToFile(csvContent, filename = "data.csv") {
    fs.writeFileSync(filename, csvContent);
    console.log(`CSV file saved as ${filename}`);
}

// Main function
async function main() {
    await connectDb();

    // TARGET EVENT
    const event_id = "67892e1eb18a5ecba55e17f7";

    // 1) Get target event
    const event = await Event.findOne({ _id: event_id}).populate(
      "registrants.user"
    );
    
    // 2) Generate QR for selected registrants
    const scores = (await Promise.all(event.registrants.filter(
      registrant => registrant.selected
    ).map(
      async (registrant) => {
        return { 
          name: registrant.user.username.toString().replace(",",""),
          points: event.subEvents.map((subEvent) => {
            const checkedIn = subEvent.checkedIn.map((obj) => {return obj.toString()});
            if (["67a2f94b6da3f377f01c8f2e", "67a2fc9fae52e68814ecb7df", "67a2fd56ae52e68814ecb7e7"].includes(subEvent.id)) {
              if (checkedIn.includes(registrant.user._id.toString())) {
                return 2;
              }
            } else if (["67a2fbf3ae52e68814ecb7d7", "67a2fcc4ae52e68814ecb7e1", "67a2fd0dae52e68814ecb7e3", "67a6fd0fd158e81d78377cf1", "67a6ff85d158e81d78377cf7", "67a702bad158e81d78377cf9", "67a70324d158e81d78377cfd", "67a70376d158e81d78377cff"].includes(subEvent.id)) {
              if (checkedIn.includes(registrant.user._id.toString())) {
                return 1;
              }
            }
            return 0;
          }).reduce((accScore, score) => accScore + score, 0)
        }
    }))).sort(
      (a,b) => {
        if (a.name > b.name) {
          return 1;
        } else if (a.name < b.name) {
          return -1;
        } else {
          return 0;
        }
      }
    );

    console.log(`Totol scores: ${scores.reduce((accScore, score) => accScore + score.points,0)}`)

    saveCSVToFile(convertArrayToCSV(scores), "points.csv")

    await mongoose.disconnect();
}

main();
