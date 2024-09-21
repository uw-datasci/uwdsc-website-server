const express = require("express");
const {
    getAllUsers,
    getUserByEmail,
    getUserById,
    createUser,
    updateUserById,
    deleteUserById,
    checkInById,
} = require("../controllers/adminController");
const { validateAdmin } = require("../middleware/validateTokenHandler");

const router = express.Router();

router.get("/getAllUsers", validateAdmin, getAllUsers);

router.get("/getUserByEmail/:email", validateAdmin, getUserByEmail);

router.get("/getUserById/:id", validateAdmin, getUserById);

router.post("/createUser", validateAdmin, createUser);

router.put("/updateUserById/:id", validateAdmin, updateUserById);

router.put("/checkInById/:id", validateAdmin, checkInById);

router.delete("/deleteUserById/:id", validateAdmin, deleteUserById);

module.exports = router;