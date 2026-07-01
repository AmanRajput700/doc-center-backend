const winston = require('winston');
require('winston-daily-rotate-file');

module.exports = winston.createLogger({
    transports: [
        new winston.transports.DailyRotateFile({
            filename: 'logs/audit/%DATE%.log',
            datePattern: 'YYYY-MM-DD'
        })
    ],
    format: winston.format.json()
});