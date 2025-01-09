const express = require("express");
const {
    getAllUsers,
    getUserById,
    createUser,
    patchUserById,
    deleteUserById,
    checkInById,
} = require("../controllers/adminController");
const { requiresAll } = require("../middleware/errorHandler")
const { validateAdmin } = require("../middleware/validateTokenHandler");

const router = express.Router();

router.use(validateAdmin);

router.get("/users", getAllUsers);

router.get("/users/:id", getUserById);

router.post("/users", createUser);

router.patch("/users/:id", patchUserById);

router.patch("/users/checkIn/:event_id/:user_id", requiresAll(["secretName"]), checkInById);

router.delete("/users/:id", deleteUserById);

module.exports = router;