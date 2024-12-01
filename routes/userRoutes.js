const express = require("express");
const {
  registerUser,
  sendVerificationEmail,
  currentUser,
  loginUser,
  verifyUser,
  sendForgotPasswordEmail,
  resetPassword,
  getQr,
} = require("../controllers/userController");
const { requiresAll } = require("../middleware/errorHandler")
const { validateToken } = require("../middleware/validateTokenHandler");

const router = express.Router();

router.get("/qr", validateToken, getQr);

router.get("/user", validateToken, currentUser);

router.post("/user", 
  requiresAll([
    "username",
    "email",
    "password",
    "watIAM",
    "faculty",
    "term",
    "heardFromWhere",
    "memberIdeas"
  ]), registerUser);

router.post("/login", 
  requiresAll([
    "email",
    "password"
  ]), loginUser);

router.post("/sendVerification",requiresAll(["email"]), sendVerificationEmail);

router.post("/sendForgotPassword",requiresAll(["email"]), sendForgotPasswordEmail);

router.patch("/resetPass",
  requiresAll([
    "id",
    "token", // delete
    // "passwordToken",
    "newPass"
  ]), resetPassword);


router.patch("/verifyUser", 
  requiresAll([
    "id",
    "token" 
  ]), verifyUser);

module.exports = router;