const { Server } = require('socket.io');

let io;

function initializeSocket(server) {
    io = new Server(server, {
        cors: {
            origin: /^https:\/\/([a-zA-Z0-9-]+)\.doccenter\.in$/,
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