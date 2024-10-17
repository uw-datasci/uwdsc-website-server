const nodemailer = require("nodemailer");
const fs = require("fs");
const dotenv = require("dotenv").config();

const sendVerificationEmail = async (user) => {
  const verificationLink = `https://yourdomain.com/verify-email?token=${user.verificationToken}`;

  // Configure the email transport
  const transporter = nodemailer.createTransport({
    service: "gmail", // or any other email service
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.APPLICATION_PASSWORD
    },
  });

  let emailHtml;
  try {
    emailHtml = fs.readFileSync("./emailHtml/verification.html", 'utf8');
    emailHtml = emailHtml.replace("<custom-link>", `${process.env.WEBSITE_URL}account/verification?id=${user.id}&token=${user.token.hash}`)
    emailHtml = emailHtml.replace("<custom-email>", user.email)
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, message: `Error: ${error.message}` };
  }

  // Set up email options
  const mailOptions = {
    from: {
      name: "DSC Automated Mail",
      address: "membership-no-reply-f24@uwdatascience.ca"
    },
    to: user.email,
    subject: "DSC Account Verification",
    html: emailHtml,
    attachments: [{
      filename: "dsc.svg",
      path: __dirname + "/../emailHtml/dsc.svg",
      cid: "logo" //same cid value as in the html img src
    }]
  }
  
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
