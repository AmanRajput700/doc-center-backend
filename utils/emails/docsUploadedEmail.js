const ejs = require('ejs');
const transporter = require('../../services/emailService');
const path = require('path');
const createHttpError = require('http-errors');

module.exports = async (Docdata) => {
    try {
        const { orgName, firstName, lastName, email, uploadDate, documents } = Docdata;
        const currentYear = new Date().getFullYear();
        const data = { orgName, firstName, lastName, email, uploadDate, documents, currentYear };
        const templatePath = path.join(__dirname, '../../views/docUploadedSuccessfully.ejs');

        const htmlContent = await ejs.renderFile(templatePath, data);
        try {
            const info = await transporter.sendMail({
                from: process.env.MAIL_ID,
                to: email,
                subject: "Document Uploaded Succesfully",
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