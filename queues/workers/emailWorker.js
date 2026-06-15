const { Worker } = require('bullmq');
const redisConnection = require('../../services/cache');
const emailProcessor = require('../processors/emailProcessor');
const logger = require('../../config/logger');

const emailWorker = new Worker(
    'email-queue',
    emailProcessor,
    {
        connection: redisConnection
    }
);

// Successful job
emailWorker.on('completed', (job) => {
    logger.info({
        queue: 'email-queue',
        jobId: job.id,
        name: job.name,
        attemptsMade: job.attemptsMade,
        message: 'Email processed successfully',
    });
});

// Failed job
emailWorker.on('failed', (job, error) => {
    logger.error({
        queue: 'email-queue',
        jobId: job?.id,
        name: job?.name,
        attemptsMade: job?.attemptsMade,
        data: job?.data,
        error: error.message,
        stack: error.stack,
        message: 'Email worker failed',
    });
});

// Worker-level errors
emailWorker.on('error', (error) => {
    logger.error({
        queue: 'email-queue',
        error: error.message,
        stack: error.stack,
        message: 'Worker connection error',
    });
});

// Worker ready
// emailWorker.on('ready', () => {
//     logger.info({
//         queue: 'email-queue',
//         message: 'Email worker is ready',
//     });
// });

module.exports = emailWorker;