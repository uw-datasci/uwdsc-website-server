const User = require("../models/userModel"); 
const sendVerificationEmail = require("../util/sendEmail"); // Utility to send emails

// Controller to handle resend verification email
const resendVerificationEmail = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    // Find the user by email
    const user = await User.findOne({ uwEmail: email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: "User is already verified" });
    } else {
      console.log("Resent Email Verification")
    }

    // Resend verification email (assuming a utility function)
    const emailSent = await sendVerificationEmail(user);

    if (!emailSent.success) {
      throw new Error(emailSent.message);
    }

    res.status(200).json({ message: "Verification email sent successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { resendVerificationEmail };
