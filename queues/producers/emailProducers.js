const { Queue } = require('bullmq');
const redisConnection = require('../../services/cache');

const emailQueue = new Queue('email-queue', {
    connection: redisConnection
});

async function addEmailJob(jobName, data) {
    return emailQueue.add(jobName, data, {
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 2000
        },
        removeOnComplete: 100,
        removeOnFail: 50
    });
};

module.exports = { emailQueue, addEmailJob }