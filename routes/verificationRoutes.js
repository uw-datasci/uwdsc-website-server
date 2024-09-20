const express = require("express");
const { resendVerificationEmail } = require("../controllers/verificationController");

const router = express.Router();

// Route to resend verification email
router.post("/resendVerification", resendVerificationEmail);

module.exports = router;
