const asyncHandler = require("express-async-handler");
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcrypt");
const expires = require("expires");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const fs = require("fs");
const dotenv = require("dotenv").config();

const User = require("../models/userModel");
const Event = require("../models/eventModel");
const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.google.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.APPLICATION_PASSWORD,
  },
});

//@desc Register a user
//@route POST /api/users/register
//@access public
const registerUser = asyncHandler(async (req, res) => {
  const {
    username,
    email,
    password,
    watIAM,
    faculty,
    term,
    heardFromWhere,
    memberIdeas,
  } = req.body;
  if (
    !username ||
    !email ||
    !password ||
    !watIAM ||
    !faculty ||
    !term ||
    !heardFromWhere
  ) {
    res.status(400);
    throw new Error("All fields are mandatory!");
  }
  const userAvailable = await User.findOne({ email });
  if (userAvailable) {
    res.status(400);
    throw new Error("User already registered!");
  }

  //Generate hashed password, token, and expiry
  const hashedPassword = await bcrypt.hash(password, 10);
  const token = uuidv4();
  const expiry = expires.after("1 hours");
  console.log("Hashed Password: ", hashedPassword);
  console.log("Token: ", token);
  console.log("Expiry: ", expiry);

  var user;
  try {
    user = await User.create({
      username: username,
      uwEmail: email,
      password: hashedPassword,
      watIAM: watIAM,
      faculty: faculty,
      term: term,
      heardFromWhere: heardFromWhere,
      memberIdeas: memberIdeas,
      token: {
        hash: token,
        expires: expiry,
      },
    });
    console.log(`User created ${user}`);
  } catch (err) {
    console.log(err);
    res.status(500);
    throw new Error("User already registered!");
  }

  let emailHtml;
  try {
    emailHtml = fs.readFileSync("./emailHtml/verification.html", "utf8");
    emailHtml = emailHtml.replace(
      "<custom-link>",
      `${process.env.WEBSITE_URL}account/verification?id=${user.id}&token=${token}`
    );
    emailHtml = emailHtml.replace("<custom-email>", email);
  } catch (err) {
    console.error("Error reading file:", err);
    res.status(500);
    throw new Error("Failed to read email HTML");
  }

  console.log(__dirname);

  await transporter
    .sendMail({
      from: {
        name: "DSC Automated Mail",
        address: "membership-no-reply-f24@uwdatascience.ca",
      },
      to: email,
      subject: "DSC Account Verification",
      html: emailHtml,
      attachments: [
        {
          filename: "dsc.svg",
          path: __dirname + "/../emailHtml/dsc.svg",
          cid: "logo", //same cid value as in the html img src
        },
      ],
    })
    .then(() => {
      console.log("Verification email Sent");
    })
    .catch((err) => {
      console.err(err);
      //Add process to delete user generated above

      res.status(500);
      throw new Error("Email was not able to be sent");
    });

  if (user) {
    res.status(201).json({ _id: user.id, email: user.email });
  } else {
    res.status(400);
    throw new Error("User data is not valid");
  }
  res.json({ message: "Register the user" });
});

//@desc Verify user
//@route POST /api/users/verifyUser
//@access public
const verifyUser = asyncHandler(async (req, res) => {
  const { id, token } = req.body;
  let user;
  try {
    user = await User.findOne({ _id: id });
  } catch (err) {
    console.log(err);
  }

  if (!user) {
    res.status(404);
    throw new Error("Document id not found");
  }

  console.log(user);
  if (user.token.hash == token && !expires.expired(user.token.expiry)) {
    await User.findOneAndUpdate(
      { _id: id },
      {
        isEmailVerified: true,
        token: {
          hash: "",
          expires: -1,
        },
      }
    );
    res.status(200);
  } else {
    res.status(400);
    throw new Error("Token hash does not match or has expired");
  }
  res.json({ message: "Verified the user" });
});

//@desc Forgot password route
//@route POST /api/users/verify/:id
//@access public
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  let user;
  try {
    user = await User.findOne({ uwEmail: email });
  } catch (err) {
    console.log(err);
    res.status(404);
    throw new Error("Email is not found");
  }

  const token = uuidv4();
  const expiry = expires.after("10 minutes");
  console.log("Token: ", token);
  console.log("Expiry: ", expiry);

  let isUpdated = false;
  try {
    await User.findOneAndUpdate(
      { _id: user.id },
      {
        token: {
          hash: token,
          expires: expiry,
        },
      }
    );
    isUpdated = true;
  } catch (err) {
    console.log(err);
  }

  if (!isUpdated) {
    res.status(500);
    throw new Error("Unable to update token");
  }

  let emailHtml;
  try {
    emailHtml = fs.readFileSync("./emailHtml/forgotpassword.html", "utf8");
    emailHtml = emailHtml.replace(
      "<custom-link>",
      `${process.env.WEBSITE_URL}account/resetPassword?id=${user.id}&token=${token}`
    );
    emailHtml = emailHtml.replace("<custom-email>", email);
  } catch (err) {
    console.error("Error reading file:", err);
  }

  if (!emailHtml) {
    res.status(500);
    throw new Error("Failed to read email HTML");
  }

  await transporter
    .sendMail({
      from: {
        name: "DSC Automated Mail",
        address: "membership-no-reply-f24@uwdatascience.ca",
      },
      to: email,
      subject: "Reset DSC Account Password",
      html: emailHtml,
      attachments: [
        {
          filename: "dsc.svg",
          path: __dirname + "/../emailHtml/dsc.svg",
          cid: "logo", //same cid value as in the html img src
        },
      ],
    })
    .then(() => {
      console.log("Forgot password email Sent");
      res.status(200).json({ message: "Forgot email sent" });
    })
    .catch((err) => {
      console.err(err);
      res.status(500);
      throw new Error("Email was not able to be sent");
    });
});

//@desc Reset member password
//@route POST /api/users/resetPass
//@access public
const resetPassword = asyncHandler(async (req, res) => {
  const { id, token, newPass } = req.body;
  const hashedPassword = await bcrypt.hash(newPass, 10);
  console.log(id);

  let user;
  try {
    user = await User.findOne({ _id: id });
  } catch (err) {
    console.log(err);
  }

  if (!user) {
    res.status(404);
    throw new Error("Document id not found");
  }
  
  console.log(user);
  if (user.token.hash == token && !expires.expired(user.token.expiry)) {
    await User.findOneAndUpdate(
      { _id: id },
      {
        password: hashedPassword,
        token: {
          hash: "",
          expires: -1,
        },
      }
    );
    res.status(200).json({ message: "Password reseted." });
  } else {
    res.status(400);
    throw new Error("Token hash does not match or has expired");
  }
});

//@desc Login user
//@route POST /api/users/login
//@access public
const loginUser = asyncHandler(async (req, res) => {
  console.log("log in called");

  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400);
    throw new Error("All fields are mandatory!");
  }

  let user;
  try {
    user = await User.findOne({ uwEmail: email });
  } catch (err) {
    console.log(err);
  }

  console.log("found user");

  if (!user) {
    res.status(404);
    throw new Error("Email is not found");
  }

  if (!user.isEmailVerified) {
    res.status(401);
    throw new Error("The email for this account has not been verified.");
  }
  console.log("before logged in");

  //compare password with hashedpassword
  if (await bcrypt.compare(password, user.password)) {
    const accessToken = await jwt.sign(
      {
        user: {
          username: user.username,
          email: user.email,
          id: user.id,
          userStatus: user.userStatus,
        },
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "3d" }
    );
    console.log(user.userStatus);
    console.log("logged in");
    res.status(200).json({
      accessToken: accessToken,
      name: user.username,
      role: user.userStatus,
    });
  } else {
    res.status(401);
    throw new Error("Email or password is not valid");
  }
});

//@desc Current user info
//@route POST /api/users/current
//@access private
const currentUser = asyncHandler(async (req, res) => {
  res.json(req.user);
});

//@desc Get QR JSON
//@route POST /api/users/getQr
//@access private
const getQr = asyncHandler(async (req, res) => {
  const id = req.user.id;
  let event;
  try {
    event = await Event.findOne({ _id: process.env.EVENT_ID });
  } catch (err) {
    console.err(err);
  }
  if (!event.eventName) {
    res.status(404);
    throw new Error("Event Document not found");
  }

  res
    .status(200)
    .json({ id: id, eventName: await bcrypt.hash(event.eventName, 10) });
});

module.exports = {
  registerUser,
  loginUser,
  verifyUser,
  forgotPassword,
  resetPassword,
  currentUser,
  getQr,
};
