const { getIO } = require('../index');

const { getUserRoom, getTenantRoom } = require('./roomService');

function emitToUser(userId, event, payload) {
    const io = getIO();
    io.to(getUserRoom(userId))
        .emit(event, payload);
}

function emitToTenant(tenantId, event, payload) {
    const io = getIO();
    io.to(getTenantRoom(tenantId))
        .emit(event, payload);
}

module.exports = {
    emitToUser,
    emitToTenant
};