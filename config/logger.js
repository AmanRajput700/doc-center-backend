const winston = require('winston');require('winston-daily-rotate-file');

const errorFilter = winston.format((info) => {
    return info.level === 'error' ? info : false;
});

const appFilter = winston.format((info) => {
    return info.level !== 'error' ? info : false;
});

const logger = winston.createLogger({
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [

        // Info & Warn Logs
        new winston.transports.DailyRotateFile({
            filename: 'logs/application/%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            format: winston.format.combine(
                appFilter(),
                winston.format.timestamp(),
                winston.format.json()
            )
        }),

        // Error Logs
        new winston.transports.DailyRotateFile({
            filename: 'logs/error/%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            format: winston.format.combine(
                errorFilter(),
                winston.format.timestamp(),
                winston.format.json()
            )
        })
    ]
});

module.exports = logger;