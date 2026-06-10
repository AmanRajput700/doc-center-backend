const socketAuth = require('./middleware/socketAuth');
const { joinUserRoom, joinTenantRoom } = require('./services/roomService');

module.exports = function socketManager(io) {

    io.use(socketAuth);

    io.on('connection', (socket) => {

        const userRoom = joinUserRoom(socket);
        const tenantRoom = joinTenantRoom(socket);

        console.log('Connected User');

        console.log('User Room:', userRoom);

        console.log('Tenant Room:', tenantRoom);

        console.log(socket.rooms);

        socket.on('disconnect', () => {
            console.log('User Disconnected');
        });

    });

};