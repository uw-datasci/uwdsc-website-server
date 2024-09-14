const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const fs = require("fs");

const User = require("../models/userModel");
const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.google.com",
  port: 465,
  secure: true,
  auth: {
    user: "membership-no-reply-f24@uwdatascience.ca",
    pass: "tkkg sqqd glva gpmp"
  }
})

//@desc Register a user
//@route POST /api/users/register
//@access public
const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    res.status(400);
    throw new Error("All fields are mandatory!");
  }
  const userAvailable = await User.findOne({ email });
  if (userAvailable) {
    res.status(400);
    throw new Error("User already registered!");
  }

  //Hash password
  const hashedPassword = await bcrypt.hash(password, 10);
  console.log("Hashed Password: ", hashedPassword);
  const user = await User.create({
    username,
    email,
    password: hashedPassword
  });

  console.log(`User created ${user}`);

  var emailHtml;
  try {
    emailHtml = fs.readFileSync("./emailHtml/verification.html", 'utf8');
    emailHtml = emailHtml.replace("<Verification Link>", "Unique link generated for this user's verification")
  } catch (err) {
    console.error('Error reading file:', err);
    res.status(400);
    throw new Error("Failed to read email HTML");
  }

  await transporter.sendMail({
    from: {
      name: "DSC Account Verification",
      address: "membership-no-reply-f24@uwdatascience.ca"
    },
    to: email,
    subject: "DSC Account Verification",
    html: emailHtml
  }).then(() => {
    console.log("Email Sent")
  }).catch(err => {
    console.err(err)
    //Add process to delete user generated above

    res.status(400);
    throw new Error("Email was not able to be sent");
  })

  if (user) {
    res.status(201).json({ _id: user.id, email: user.email });
  } else {
    res.status(400);
    throw new Error("User data is not valid");
  }
  res.json({ message: "Register the user" });
});

//@desc Login user
//@route POST /api/users/login
//@access public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400);
    throw new Error("All fields are mandatory!");
  }
  const user = await User.findOne({ email });
  //compare password with hashedpassword
  if (user && (await bcrypt.compare(password, user.password))) {
    const accessToken = jwt.sign(
      {
        user: {
          username: user.username,
          email: user.email,
          id: user.id,
          userStatus: user.userStatus,
        },
      },
      process.env.ACCESS_TOKEN_SECERT,
      { expiresIn: "3d" }
    );
    res.status(200).json({ accessToken });
  } else {
    res.status(401);
    throw new Error("email or password is not valid");
  }
});

//@desc Current user info
//@route POST /api/users/current
//@access private
const currentUser = asyncHandler(async (req, res) => {
  res.json(req.user);
});

module.exports = { registerUser, loginUser, currentUser };