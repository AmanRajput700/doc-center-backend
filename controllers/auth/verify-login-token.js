const createHttpError = require('http-errors');
const jwt = require('jsonwebtoken');
const { STATUS_CODE, ERROR_MESSAGE } = require('../../utils/constant');

module.exports = async function (userData) {
    const { token, slug } = userData;
    const decoded = jwt.verify(token, process.env.JWT_EMAIL_VERIFY_SECRET);
    if (slug !== decoded.slug) throw new createHttpError(STATUS_CODE.BAD_REQUEST,ERROR_MESSAGE.BAD_REQUEST);
}