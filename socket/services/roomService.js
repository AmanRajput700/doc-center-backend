const USER_ROOM_PREFIX = 'user';
const TENANT_ROOM_PREFIX = 'tenant';

function getUserRoom(userId) {
    return `${USER_ROOM_PREFIX}:${userId}`;
}

function getTenantRoom(tenantId) {
    return `${TENANT_ROOM_PREFIX}:${tenantId}`;
}

function joinUserRoom(socket) {
    const room = getUserRoom(socket.user._id);

    socket.join(room);

    return room;
}

function joinTenantRoom(socket) {
    const room = getTenantRoom(socket.tenant._id);

    socket.join(room);

    return room;
}

module.exports = {
    getUserRoom,
    getTenantRoom,
    joinUserRoom,
    joinTenantRoom
};