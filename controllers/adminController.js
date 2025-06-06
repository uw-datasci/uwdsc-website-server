const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");
const { default: mongoose } = require("mongoose");
const User = mongoose.model("users");
const Event = mongoose.model("events");
const dotenv = require("dotenv").config();

function getSchemaKeysExcept(model, excludeKeys = []) {
    // Get the keys of the schema from the model
    const keys = Object.keys(model.schema.obj);

    // Filter out the keys that should be excluded
    return keys.filter(key => !excludeKeys.includes(key));
}

//@desc Get all users
//@route GET /api/admin/getAllUsers
//@access Private
const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find({}, {password: 0}); // Retrieves all users from the database
    res.status(200).json(users);
});

//@desc Get user by ID
//@route GET /api/admin/getUserById/:id
//@access Private
const getUserById = asyncHandler(async (req, res) => {
    const id = req.params.id; // Extracting email from URL parameters
    const user = await User.findOne({ _id: id });
    if (!user) {
        res.status(404)
        throw Error("Unable to find user.")
    }
    
    res.status(200).json(user);
});


//@desc Create a new user
//@route POST /api/admin/createUser
//@access Private
const createUser = asyncHandler(async (req, res) => {
    const { username, email, password, watIAM, faculty, term, heardFromWhere, memberIdeas, userStatus } = req.body;

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
            email: email,
            password: hashedPassword,
            watIAM: watIAM,
            faculty: faculty,
            term: term,
            heardFromWhere: heardFromWhere,
            memberIdeas: memberIdeas,
            userStatus: userStatus || 'member',
            isMathSocMember: faculty === "Math",
            eventList: [],
        });
        console.log(`User created ${user}`);
        res.status(201).json({ _id: user.id, email: user.email });
      } catch (err) {
        console.log(err);
        res.status(500);
        throw new Error("Failed to create user.");
      }
  });


//@desc Update an existing user
//@route PATCH /api/admin/patchUserById:id
//@access Private
const patchUserById = asyncHandler(async (req, res) => {
    let user = await User.findById(req.params.id);
    if (!user) {
        res.status(404)
        throw Error("Unable to find user.")
    }

    const allowedFields = getSchemaKeysExcept(User, ["isIncomplete", "token"])
    const updatedFields = Object.fromEntries(
        Object.entries(req.body).filter(([key]) => allowedFields.includes(key))
    );

    // hash and update password
    console.log(updatedFields);
    if (updatedFields.hasOwnProperty("password") && updatedFields.password != "") {
        const salt = await bcrypt.genSalt(10);
        updatedFields.password = await bcrypt.hash(updatedFields.password, salt);
    } else {
        updatedFields.password = user.password;
    }

    console.log(updatedFields);
    // Update user
    await User.findByIdAndUpdate(req.params.id, updatedFields, { new: true });
    res.status(200).json({ message : "Updated user", updatedFields : updatedFields});
});

//@desc Delete an existing user
//@route DELETE /api/admin/deleteUserById/:id
//@access Private
const deleteUserById = asyncHandler(async (req, res) => {
    await User.deleteOne({_id: req.params.id});
    res.status(200).json({ message: "User deleted successfully." });
});

//@desc Check in a user
//@route PATCH /api/admin/checkInById/:id
//@access Private
const checkInById = asyncHandler(async (req, res) => {
    const eventName = req.body.eventName;
    const id = req.params.id;

    let user = await User.findOne({ _id: id });
    if (!user) {
        res.status(404);
        throw new Error("Id is not found.");
    }

    let event = await Event.findOne({ _id: "66e7be7a0efdeac0ca2b6644" });
    if (!event) {
        res.status(404);
        throw new Error("Event Document not found.");
    }

    if (await bcrypt.compare(event.eventName, eventName)) {
        await User.findOneAndUpdate(
            { _id: id }, 
            { isCheckedIn: true, $addToSet: { eventList: event._id } });
            
        res.status(200).json({ message: "User checked in!"});
    } else {
        res.status(401).json({ message: "Event hash does not match"});
    }
});

module.exports = { getAllUsers, getUserById, createUser, patchUserById, deleteUserById, checkInById };