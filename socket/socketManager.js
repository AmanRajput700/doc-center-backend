const socketAuth = require('./middleware/socketAuth');
const { joinUserRoom, joinTenantRoom } = require('./services/roomService');

module.exports = function socketManager(io) {

    io.use(socketAuth);

    io.on('connection', (socket) => {

        const userRoom = joinUserRoom(socket);
        const tenantRoom = joinTenantRoom(socket);

        socket.on('disconnect', () => {
            // console.log('User Disconnected');
        });

    });

};