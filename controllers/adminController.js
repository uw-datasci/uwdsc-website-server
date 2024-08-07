const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");


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
    const user = await User.findOne({ email: email });
    res.status(200).json(user);
});


//@desc Create a new user
//@route POST /api/admin/createUser
//@access Private
const createUser = asyncHandler(async (req, res) => {
    const { username, email, password, userStatus } = req.body;

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
      password: hashedPassword,
      userStatus: userStatus || 'member'
    });
  
    console.log(`User created ${user}`);
    if (user) {
      res.status(201).json({ _id: user.id, email: user.email });
    } else {
      res.status(400);
      throw new Error("User data is not valid");
    }
    res.json({ message: "Register the user" });
  });


//@desc Update an existing user
//@route PUT /api/users/:id
//@access Private
const updateUserById = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        res.status(404);
        throw new Error("User not found");
    }

    const { username, email, password, userStatus } = req.body;

    // update each field iff provided
    const updatedFields = {
        ...(username && { username }),
        ...(email && { email }),
        ...(userStatus && { userStatus })
    };

    // hash and update password
    if (password) {
        const salt = await bcrypt.genSalt(10);
        updatedFields.password = await bcrypt.hash(password, salt);
    }

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
//@route DELETE /api/users/:id
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

module.exports = { getAllUsers, getUserByEmail, createUser, updateUserById, deleteUserById };