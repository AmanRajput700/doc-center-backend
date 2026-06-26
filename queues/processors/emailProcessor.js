const createHttpError = require('http-errors');
const { STATUS_CODE, ERROR_MESSAGE } = require('../../utils/constant');
const securityAlertEmail = require('../../utils/emails/securityAlertsEmail');
const sendSecurityAlertEmail = require('../../utils/emails/securityAlertsEmail');
const docUploadEmail = require('../../utils/emails/docsUploadedEmail');
const weeklyReportEmail = require('../../utils/emails/weeklyReportEmail');

module.exports = async function emailProcessor(job) {
    switch (job.name) {
        case 'welcome-email':
            await sendWelcomeEmail(job.data);
            break;

        case 'security-alert':
            await sendSecurityAlertEmail(job.data);
            break;

        case 'doc-upload':
            await docUploadEmail(job.data);
            break;

        case 'weekly-report':
            await weeklyReportEmail(job.data);

        default:
            throw new Error(`Unknown job type: ${job.name}`);
    }
};