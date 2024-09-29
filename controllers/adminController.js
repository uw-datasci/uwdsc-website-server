const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const Event = require("../models/eventModel");
const dotenv = require("dotenv").config();


//@desc Get all users
//@route GET /api/admin/getAllUsers
//@access Private
const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find({}); // Retrieves all users from the database
    res.status(200).json(users);
});


//@desc Get user by email
//@route GET /api/admin/getUserByEmail/:email
//@access Private
const getUserByEmail = asyncHandler(async (req, res) => {
    const email = req.params.email; // Extracting email from URL parameters
    const user = await User.findOne({ uwEmail: email });
    res.status(200).json(user);
});

//@desc Get user by ID
//@route GET /api/admin/getUserById/:id
//@access Private
const getUserById = asyncHandler(async (req, res) => {
    const id = req.params.id; // Extracting email from URL parameters
    const user = await User.findOne({ _id: id });
    res.status(200).json(user);
});


//@desc Create a new user
//@route POST /api/admin/createUser
//@access Private
const createUser = asyncHandler(async (req, res) => {
    const { username, email, password, watIAM, faculty, term, heardFromWhere, memberIdeas, userStatus } = req.body;

    if (!username || !email || !password || !watIAM || !faculty || !term || !heardFromWhere) {
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
            userStatus: userStatus || 'member'
        });
        console.log(`User created ${user}`);
      } catch (err) {
        console.log(err);
        res.status(500);
        throw new Error("Failed to create user");
      }
  
    console.log(`User created ${user}`);
    if (user) {
      res.status(201).json({ _id: user.id, email: user.uwEmail });
    } else {
      res.status(400);
      throw new Error("User data is not valid");
    }
    res.json({ message: "Register the user" });
  });


//@desc Update an existing user
//@route PUT /api/admin/updateUserById:id
//@access Private
const updateUserById = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        res.status(404);
        throw new Error("User not found");
    }

    const { username, email, password, hasPaid, paymentMethod, paymentLocation, verifier, isEmailVerified, userStatus } = req.body;

    // update each field iff provided
    const updatedFields = {
        ...(username && { username }),
        ...(email && { uwEmail: email }),
        ...({ hasPaid }),
        ...(paymentMethod && { paymentMethod: (paymentMethod == "EMPTY_FIELD"? "" : paymentMethod) }),
        ...(verifier && { verifier: (verifier == "EMPTY_FIELD"? "" : verifier) }),
        ...(paymentLocation && { paymentLocation: (paymentLocation == "EMPTY_FIELD"? "" : paymentLocation) }),
        ...({ isEmailVerified }),
        ...(userStatus && { userStatus }),
    };

    // hash and update password
    if (password) {
        const salt = await bcrypt.genSalt(10);
        updatedFields.password = await bcrypt.hash(password, salt);
    }


    console.log(updatedFields);
    // Update user
    const updatedUser = await User.findByIdAndUpdate(req.params.id, updatedFields, { new: true });

    if (updatedUser) {
        res.status(200).json({
            _id: updatedUser._id,
            username: updatedUser.username,
            email: updatedUser.email,
            userStatus: updatedUser.userStatus
        });
    } else {
        res.status(400);
        throw new Error("Could not update user");
    }
});

//@desc Delete an existing user
//@route DELETE /api/admin/deleteUserById/:id
//@access Private
const deleteUserById = asyncHandler(async (req, res) => {
    try {
        await User.deleteOne({_id: req.params.id});
        res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        console.error("Error removing user:", error);
        res.status(500).json({ message: "Failed to delete user due to server error" });
    }
});

//@desc Check in a user
//@route PUT /api/admin/checkInById/:id
//@access Private
const checkInById = asyncHandler(async (req, res) => {
    const eventName = req.body.eventName;
    const id = req.params.id;

    let user;
    try {
        user = await User.findOne({ _id: id });
    } catch (err) {
        console.log(err);
    }
    if (!user) {
        res.status(404);
        throw new Error("Id is not found");
    }

    let event;
    try {
        event = await Event.findOne({ _id: "66e7be7a0efdeac0ca2b6644" });
    } catch (err) {
        console.err(err);
    }
    if (!event.eventName) {
        res.status(404);
        throw new Error("Event Document not found");
    }

    if (await bcrypt.compare(event.eventName, eventName)) {
        await User.findOneAndUpdate(
            { _id: id }, 
            { isCheckedIn: true });
        res.status(200).json({ message: "User checked in!"});
    } else {
        res.status(401).json({ message: "Event hash does not match"});
    }


});

module.exports = { getAllUsers, getUserByEmail, getUserById, createUser, updateUserById, deleteUserById, checkInById };