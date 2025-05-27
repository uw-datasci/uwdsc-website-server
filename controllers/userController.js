const asyncHandler = require("express-async-handler");
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcrypt");
const expires = require("expires");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const fs = require("fs");
const dotenv = require("dotenv").config();

const { default: mongoose } = require("mongoose");
const User = mongoose.model("users");
const Event = mongoose.model("events");
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

  const userAvailable = await User.findOne({ email });
  if (userAvailable && !userAvailable.isEmailVerified) {
    res.status(409);
    throw new Error("User already registered, but email is not verified.");
  }

  if (userAvailable) {
    res.status(400);
    throw new Error("User already registered!");
  }

  //Generate hashed password, token, and expiry
  console.log("Generating verification token...")
  const hashedPassword = await bcrypt.hash(password, 10);
  const token = uuidv4();
  const expiry = expires.after("1 hours");
  console.log("Verification token generated.")

  console.log("Creating user...")
  const user = await User.create({
    username: username,
    email: email,
    password: hashedPassword,
    watIAM: watIAM,
    faculty: faculty,
    term: term,
    heardFromWhere: heardFromWhere,
    memberIdeas: memberIdeas,
    isEmailVerified: true, // To remove when verification works
    token: {
      hash: token,
      expires: expiry,
    },
  });

  if (!user) {
    res.status(500);
    throw new Error("There was an issue creating your account.");
  }
  console.log(`User created ${user}`);

  res.status(201).json({ _id: user.id, email: user.email });

});

//@desc Login user
//@route POST /api/users/login
//@access public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  let user = await User.findOne({ email: email });
  if (!user) {
    res.status(404)
    throw Error("Unable to find user.")
  }

  if (!user.isEmailVerified) {
    res.status(401);
    throw new Error("The email for this account has not been verified.");
  }

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
      { expiresIn: "120d" }
    );
    res.status(200).json({
      accessToken: accessToken,
      name: user.username,
      role: user.userStatus,
    });
  } else {
    res.status(401);
    throw new Error("Email or password is not valid.");
  }
});

//@desc Sends the verification email
//@route POST /api/users/sendVerification
//@access public
const sendVerificationEmail = asyncHandler(async (req, res) => {
  const { email } = req.body;

  let user = await User.findOne({ email: email });
  if (!user) {
    res.status(404);
    throw Error("Unable to find user.")
  }

  // if (user.isEmailVerified) {
  //   res.status(400);
  //   throw Error("Email is already verified.")
  // }

  console.log("Generating verification token...")
  const token = uuidv4();
  const expiry = expires.after("1 hours");
  console.log("Verification token generated.")

  await User.findOneAndUpdate(
    { _id: user.id },
    {
      token: {
        hash: token,
        expires: expiry,
      },
    }
  );

  let emailHtml;
  try {
    emailHtml = fs.readFileSync("./emailHtml/verification.html", "utf8");
    emailHtml = emailHtml.replace(
      "<custom-link>",
      `${process.env.WEBSITE_URL}account/verification?id=${user.id}&token=${token}`
    );
    emailHtml = emailHtml.replace("<custom-email>", email);
    console.log("Email generated.")
  } catch (err) {
    console.error("Error reading file:", err);
    res.status(500);
    throw new Error("Failed to read verfication email HTML.");
  }

  console.log("Sending verification email...")
  transporter
    .sendMail({
      from: {
        name: "DSC Automated Mail",
        address: "membership-no-reply-f24@uwdatascience.ca",
      },
      to: email,
      subject: "DSC Account Confirmation",
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
      res.status(200).json({ message: "Verification email sent" });
    })
    .catch((err) => {
      console.error(err);
      res.status(500);
      throw new Error("Verification email was not able to be sent.");
    });
});

//@desc Sends the forgot password email
//@route POST /api/users/forgotPass
//@access public
const sendForgotPasswordEmail = asyncHandler(async (req, res) => {
  const { email } = req.body;

  let user = await User.findOne({ email: email });
  if (!user) {
    res.status(404)
    throw Error("Unable to find user.")
  }

  console.log("Generating forgot password token...")
  const token = uuidv4();
  const expiry = expires.after("10 minutes");
  console.log("Token generated.")

  await User.findOneAndUpdate(
    { _id: user.id },
    {
      token: {
        hash: token,
        expires: expiry,
      },
    }
  );

  console.log("Generating forgot password email...")
  let emailHtml;
  try {
    emailHtml = fs.readFileSync("./emailHtml/forgotpassword.html", "utf8");
    emailHtml = emailHtml.replace(
      "<custom-link>",
      `${process.env.WEBSITE_URL}account/resetPassword?id=${user.id}&token=${token}`
    );
    emailHtml = emailHtml.replace("<custom-email>", email);
    console.log("Forgot password email generated.")
  } catch (err) {
    console.error("Error reading file:", err);
    res.status(500);
    throw new Error("Failed to read forgot password email HTML.");
  }

  console.log("Sending forgot password email...");
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
      console.log("Forgot password email sent.");
      res.status(200).json({ message: "Forgot password email sent" });
    })
    .catch((err) => {
      console.error(err);
      res.status(500);
      throw new Error("Forgot password email was not able to be sent");
    });
});

//@desc Current user info
//@route GET /api/users/current
//@access private
const currentUser = asyncHandler(async (req, res) => {
  let user = await User.findOne({ _id: req.user.id })
  const userObject = user.toJSON();

  delete userObject.token;
  delete userObject.password;
  delete userObject._id;
  delete userObject.id;
  delete userObject.__v;

  res.status(200).json(userObject);
});

//@desc Get QR payload
//@route GET /api/users/getQr
//@access private
const getQr = asyncHandler(async (req, res) => {
  const id = req.user.id;

  let events = await Event.find().eventsHappeningOnBuffered(new Date());
  if (!events) {
    res.status(404)
    throw new Error("There are no events happening right now.");
  }
  
  events = await Promise.all(
    events.map(async (event) => {
      console.log(id)
      console.log(process.env.ACCESS_TOKEN_SECRET)
      console.log(event.secretName)
      return {
        id: event._id,
        secret: await bcrypt.hash(id + process.env.ACCESS_TOKEN_SECRET + event.secretName, 10)
      }
    })
  );
  
  
  res.status(200).json({ id: id, eventArray: events });
});

//@desc Verifiesd a user
//@route PATCH /api/users/verifyUser
//@access public
const verifyUser = asyncHandler(async (req, res) => {
  const { id, token } = req.body;

  const user = await User.findOne({ _id: id });
  if (!user) {
    res.status(404)
    throw Error("Unable to find user.")
  }

  console.log("Verifying user...");
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
    console.log("User verified.")
    res.status(200).json({ message: "Verified the user" });
  } else {
    res.status(400);
    throw new Error("Token hash does not match or has expired.");
  }
});

//@desc Resets user password
//@route PATCH /api/users/resetPass
//@access public
const resetPassword = asyncHandler(async (req, res) => {
  const { id, token, newPass } = req.body;

  const hashedPassword = await bcrypt.hash(newPass, 10);

  let user = await User.findOne({ _id: id });
  if (!user) {
    res.status(404)
    throw Error("Unable to find user.")
  }
  
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
    throw new Error("Token hash does not match or has expired.");
  }
});

//@desc Check if user has paid
//@route GET /api/users/hasPaid/:user_id
//@access public
const checkUserHasPaid = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.user_id);
    if (!user) {
        res.status(404);
        throw new Error("User not found");
    }

    res.status(200).json({ hasPaid: user.hasPaid });
});

//@desc Backfill user registration for all events from past week
//@route POST /api/users/backfillAll/:user_id
//@access public
const backfillUserEvents = asyncHandler(async (req, res) => {
    const user_id = req.params.user_id;
    
    // Find the user
    const user = await User.findById(user_id);
    if (!user) {
        res.status(404);
        throw new Error("User not found");
    }

    // Get date from a week ago
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Find the latest event
    const latestEvent = await Event.findOne().sort({ startTime: -1 });
    if (!latestEvent) {
        res.status(404);
        throw new Error("No events found in the system");
    }

    // Find all events from a week ago up to the latest event
    const events = await Event.find({
        startTime: { 
            $gte: oneWeekAgo,
            $lte: latestEvent.startTime
        }
    });

    // Add user to each event's registrants
    const updatePromises = events.map(event => {
        // Check if user is already registered
        const isAlreadyRegistered = event.registrants && event.registrants.some(
            reg => reg.user.toString() === user_id
        );

        if (!isAlreadyRegistered) {
            return Event.findByIdAndUpdate(
                event._id,
                { 
                    $push: { 
                        registrants: {
                            user: user_id,
                            checkedIn: false,
                            selected: true,
                            status: 'Applied'
                        }
                    }
                }
            );
        }
        return Promise.resolve(); // Skip if already registered
    });

    await Promise.all(updatePromises);

    // Get updated events to return
    const updatedEvents = await Event.find({
        startTime: { 
            $gte: oneWeekAgo,
            $lte: latestEvent.startTime
        }
    });

    res.status(200).json({ 
        message: "Successfully backfilled user registrations",
        eventsRegistered: events.length,
        events: updatedEvents.map(event => ({
            id: event._id,
            name: event.name,
            startTime: event.startTime
        }))
    });
});

//@desc Remove user from all events from past week to latest
//@route DELETE /api/users/removeFromEvents/:user_id
//@access public
const removeUserFromEvents = asyncHandler(async (req, res) => {
    const user_id = req.params.user_id;
    
    // Find the user
    const user = await User.findById(user_id);
    if (!user) {
        res.status(404);
        throw new Error("User not found");
    }

    // Get date from a week ago
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Find the latest event
    const latestEvent = await Event.findOne().sort({ startTime: -1 });
    if (!latestEvent) {
        res.status(404);
        throw new Error("No events found in the system");
    }

    // Find all events from a week ago up to the latest event
    const events = await Event.find({
        startTime: { 
            $gte: oneWeekAgo,
            $lte: latestEvent.startTime
        }
    });

    // Remove user from each event's registrants
    const updatePromises = events.map(event => {
        // Check if user is registered
        const isRegistered = event.registrants && event.registrants.some(
            reg => reg.user.toString() === user_id
        );

        if (isRegistered) {
            return Event.findByIdAndUpdate(
                event._id,
                { 
                    $pull: { 
                        registrants: {
                            user: user_id
                        }
                    }
                }
            );
        }
        return Promise.resolve(); // Skip if not registered
    });

    await Promise.all(updatePromises);

    // Get updated events to return
    const updatedEvents = await Event.find({
        startTime: { 
            $gte: oneWeekAgo,
            $lte: latestEvent.startTime
        }
    });

    res.status(200).json({ 
        message: "Successfully removed user from events",
        eventsRemoved: events.length,
        events: updatedEvents.map(event => ({
            id: event._id,
            name: event.name,
            startTime: event.startTime
        }))
    });
});

module.exports = {
  registerUser,
  sendVerificationEmail,
  loginUser,
  verifyUser,
  sendForgotPasswordEmail,
  resetPassword,
  currentUser,
  getQr,
  checkUserHasPaid,
  backfillUserEvents,
  removeUserFromEvents
};
