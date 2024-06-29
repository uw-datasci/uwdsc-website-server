const express = require("express");
const {
    getAllUsers,
    getUserByEmail,
    createUser,
    updateUserById,
    deleteUserById,
} = require("../controllers/adminController");
const { validateAdmin } = require("../middleware /validateTokenHandler");

const router = express.Router();

router.get("/getAllUsers", validateAdmin, getAllUsers);

router.get("/getUserByEmail/:email", validateAdmin, getUserByEmail);

router.post("/createUser", validateAdmin, createUser);

router.put("/updateUserById/:id", validateAdmin, updateUserById);

router.delete("/deleteUserById/:id", validateAdmin, deleteUserById);

module.exports = router;