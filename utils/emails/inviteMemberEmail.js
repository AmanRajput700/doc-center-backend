const ejs = require('ejs');
const transporter = require('../../services/emailService');
const path = require('path');
const createHttpError = require('http-errors');

module.exports = async (orgName, email, message, inviteLink) => {
    try {
        const currentYear = new Date().getFullYear();
        const data = { orgName, message, inviteLink, currentYear, email };
        const templatePath = path.join(__dirname, '../../views/inviteMemberEmail.ejs');

        const htmlContent = await ejs.renderFile(templatePath, data);
        try {
            const info = await transporter.sendMail({
                from: process.env.MAIL_ID,
                to: email,
                subject: "Invite Link",
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
