const { getIO } = require('../index');

const { getUserRoom, getTenantRoom } = require('./roomService');

function emitToUser(userId, event, payload) {
    const io = getIO();
    io.to(getUserRoom(userId))
        .emit(event, payload);
}

async function emitToTenant(tenantId, event, payload) {
    const io = getIO();

    const room = getTenantRoom(tenantId);

    const sockets = await io.in(room).fetchSockets();

    console.log(`Room: ${room}`);
    console.log(`Connected clients: ${sockets.length}`);

    io.to(room).emit(event, payload);

    console.log(`Emitted ${event}`);
}

module.exports = {
    emitToUser,
    emitToTenant
};