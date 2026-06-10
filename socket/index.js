const { Server } = require('socket.io');

let io;

function initializeSocket(server) {
    io = new Server(server, {
        cors: {
            origin: /^http:\/\/([a-zA-Z0-9-]+)\.192\.168\.100\.166\.nip\.io:5173$/,
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