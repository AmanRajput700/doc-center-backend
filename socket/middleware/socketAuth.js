const { authenticateUser } = require('../../services/authService');

module.exports = async function socketAuth(socket, next) {
    try {
        const token = socket.handshake.auth?.token;
        const { user, tenant } = await authenticateUser(token);
        socket.user = user;
        socket.tenant = tenant;
        next();
    } catch (error) {
        next(error);
    }
};