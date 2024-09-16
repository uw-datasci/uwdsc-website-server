const express = require("express");
const {
  registerUser,
  currentUser,
  loginUser,
  verifyUser,
  forgotPassword,
  resetPassword,
  getQr,
} = require("../controllers/userController");
const { validateToken } = require("../middleware /validateTokenHandler");

const router = express.Router();

router.post("/register", registerUser);

router.get("/login", loginUser);

router.get("/getQr", validateToken, getQr);

router.get("/current", validateToken, currentUser);

router.put("/forgotPass", forgotPassword);

router.put("/resetPass", resetPassword);

router.put("/verifyUser", verifyUser);

module.exports = router;