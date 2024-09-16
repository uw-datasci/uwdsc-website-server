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

router.post("/forgotPass", forgotPassword);

router.post("/resetPass", resetPassword);

router.post("/login", loginUser);

router.post("/verifyUser", verifyUser);

router.get("/getQr", validateToken, getQr);

router.get("/current", validateToken, currentUser);

module.exports = router;