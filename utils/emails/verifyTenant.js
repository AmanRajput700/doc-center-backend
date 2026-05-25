const ejs = require('ejs');
const transporter = require('../../services/emailService');
const path = require('path');
const createHttpError = require('http-errors');

module.exports = async (orgName, applicantFirstName, applicantLastName, email, verificationLink) => {
    try {
        const currentYear = new Date().getFullYear();
        const data = { orgName, applicantFirstName, applicantLastName, currentYear, verificationLink };
        const templatePath = path.join(__dirname, '../../views/tenantVerifyEmail.ejs');
        console.log(email);
        const htmlContent = await ejs.renderFile(templatePath, data);
        try {
            const info = await transporter.sendMail({
                from: process.env.MAIL_ID,
                to: email,
                subject: "Email verification token",
                text: "",
                html: htmlContent,
            });
        } catch (err) {
            throw new createHttpError(422, "Invalid Email");
        }
    } catch (err) {
        console.log(err);
        throw new createHttpError(err);
    }
}
