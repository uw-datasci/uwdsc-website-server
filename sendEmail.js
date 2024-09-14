const nodemailer = require('nodemailer');

async function sendEmail() {
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'membership-no-reply-f24@uwdatascience.ca',
            pass: 'tkkg sqqd glva gpmp'
        }
    });

    let mailOptions = {
        from: 'membership-no-reply-f24@uwdatascience.ca',
        to: 'aidenramgoolam@gmail.com',
        subject: 'Test Email',
        text: 'Hello, this is a test email!'
    };

    try {
        let info = await transporter.sendMail(mailOptions);
        console.log('Email sent: ' + info.response);
        return { success: true, response: info.response };
    } catch (error) {
        console.error('Error sending email: ' + error);
        return { success: false, error: error.message };
    }
}

module.exports = sendEmail;