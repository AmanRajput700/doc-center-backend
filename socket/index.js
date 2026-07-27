const { Server } = require('socket.io');

let io;

function initializeSocket(server) {
    io = new Server(server, {
        cors: {
            origin: (origin, callback) => {
                if (!origin || origin === "http://localhost:5173") {
                    return callback(null, true);
                }
                const originRegex = /^http:\/\/[a-zA-Z0-9-]+\.192\.168\.100\.99\.nip\.io:5173$/;

                if (!origin || originRegex.test(origin)) {
                    return callback(null, true);
                }
                const allowedRegex = /^https:\/\/(?:[a-zA-Z0-9-]+\.)?doccenter\.in$/;
                if (allowedRegex.test(origin)) {
                    return callback(null, true);
                }
                return callback(null, false);
            },
            credentials: true
        }
    });

    return io;
}

function getIO() {
    if (!io) {
        throw new Error('Socket.IO not initialized');
    }

    return io;
}

module.exports = {
    initializeSocket,
    getIO
};