const express = require("express");
const { resendVerificationEmail } = require("../controllers/verificationController");

const router = express.Router();

// Route to resend verification email
router.post("/", resendVerificationEmail);

module.exports = router;
