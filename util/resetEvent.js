const readline = require("readline-sync");
const mongoose = require("mongoose");
const connectDb = require("../config/dbConnection");
const Event = require("../models/eventModel");
const User = require("../models/userModel");

(async () => {
  await connectDb();

  console.log("_______________________________________________________________________");
  console.log("You are about to reset the event secret.");
  console.log("By doing this, you will be resetting all users to {isCheckedIn: false}.");
  console.log("To proceed, please enter the new event secret :");
  const newEventSecret = String(readline.question());

  let oldEventSecret;
  try {
    const event = await Event.findOne({ _id: "66e7be7a0efdeac0ca2b6644" });
    oldEventSecret = event.eventName;
    if (!oldEventSecret) {
      mongoose.connection.close();
      return;
    }
  } catch (err) {
    console.log(err);
    mongoose.connection.close();
    return;
  }

  if (!newEventSecret || newEventSecret == oldEventSecret) {
    console.log("The secret you entered is empty or invalid.");
    mongoose.connection.close();
    return;
  }

  console.log("_______________________________________________________________________");
  console.log("The new event secret would be '" + newEventSecret + "'");
  console.log("To confirm your action, please enter 'confirm' : ");
  const confirm = String(readline.question()).toLowerCase();
  if (confirm != "confirm") {
    console.log("You did not type confirm. Aborting action.");
    mongoose.connection.close();
    return;
  }

  console.log("_______________________________________________________________________");
  console.log("Changing event secret from '" + oldEventSecret +"' to new event secret '" + newEventSecret + "'");

  try {
    await Event.findOneAndUpdate({ _id: process.env.EVENT_ID }, { eventName: newEventSecret });
    console.log("Succesfully changed event secret");
  } catch (err) {
    console.log(err);
    mongoose.connection.close();
    return;
  }

  console.log("Resetting all users to {isCheckedIn: false}")

  let execAttendance;
  let memberAttendance;
  try {
    execAttendance = await User.countDocuments({ userStatus: "admin", isCheckedIn: true });
    memberAttendance = await User.countDocuments({ userStatus: "member", isCheckedIn: true });
    await User.updateMany({}, { isCheckedIn: false });
    console.log("Succesfully reset all users.");
  } catch (err) {
    console.log(err);
    mongoose.connection.close();
    return;
  }

  console.log("-----------------------------------------------------------------------");
  console.log("                                Report");
  console.log("-----------------------------------------------------------------------");
  console.log("Previous event : '" + oldEventSecret + "'");
  console.log("Exec attendance : " + execAttendance);
  console.log("Member attendance : " + memberAttendance);
  console.log("Total attendance : " + (execAttendance + memberAttendance));

  mongoose.connection.close();
  return;

})();


