const createHttpError = require('http-errors');
const { STATUS_CODE, ERROR_MESSAGE } = require('../../utils/constant');
const { deleteSession } = require('../../services/auth/sessionService');

module.exports = async function (dbName, refreshToken) {

    const session = await deleteSession({ dbName, refreshToken });
    if (!session) throw new createHttpError(STATUS_CODE.UNAUTHORIZED, ERROR_MESSAGE.INVALID_USER);
    return;
};