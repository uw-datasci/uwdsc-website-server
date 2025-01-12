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
const { validateUser } = require("../middleware/validateTokenHandler");
const { getRegistrantById, attachRegistrantById, patchRegistrantById } = require("../controllers/registrantController");

const router = express.Router();

router.get("/qr", validateUser, getQr);

router.get("/user", validateUser, currentUser);

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
    "token",
    "newPass"
  ]), resetPassword);

router.patch("/verifyUser", 
  requiresAll([
    "id",
    "token" 
  ]), verifyUser);

router.get("/events/:event_id/registrants", validateUser, getRegistrantById);

router.post("/events/:event_id/registrants", validateUser, attachRegistrantById);

router.patch("/events/:event_id/registrants", validateUser, patchRegistrantById);

module.exports = router;