const nodemailer = require("nodemailer");

const sendVerificationEmail = async (user) => {
  const verificationLink = `https://yourdomain.com/verify-email?token=${user.verificationToken}`;

  // Configure the email transport
  const transporter = nodemailer.createTransport({
    service: "gmail", // or any other email service
    auth: {
      user: 'membership-no-reply-f24@uwdatascience.ca',
      pass: 'tkkg sqqd glva gpmp'
    },
  });

  // Set up email options
  const mailOptions = {
      from: process.env.EMAIL_USER, // Sender address
      to: user.email, // List of receivers (you can replace this with a dynamic email address)
      subject: "Test Email", // Subject line
      text: "This is a test email!", // Plain text body
      html: "<p>This is a test email!</p>", // HTML body
    };
  
  // Send the email
  try {
      const info = await transporter.sendMail(mailOptions);
      return { success: true, message: `Email sent: ${info.response}` };
  } catch (error) {
      console.error("Error sending email:", error);
      return { success: false, message: `Error: ${error.message}` };
  }
};

module.exports = sendVerificationEmail;
