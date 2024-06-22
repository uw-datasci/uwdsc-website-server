const express = require("express");
const {
    getAllUsers,
    getUserByEmail,
    createUser,
    updateUserById,
    deleteUserById,
} = require("../controllers/adminController");
const { validateToken, validateAdmin } = require("../middleware /validateTokenHandler");

const router = express.Router();
router.use(validateToken);
router.use(validateAdmin);

router.get("/getAllUsers", validateToken, validateAdmin, getAllUsers);

router.get("/getUserByEmail/:email", validateToken, validateAdmin, getUserByEmail);

router.post("/createUser", validateToken, validateAdmin, createUser);

router.put("/updateUserById/:id", validateToken, validateAdmin, updateUserById);

router.delete("/deleteUserById/:id", validateToken, validateAdmin, deleteUserById);

module.exports = router;