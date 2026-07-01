const createHttpError = require('http-errors');

module.exports = async function (User, userId, mapping) {
    try {
        const user = await User.findById(userId);
        if (!user) throw new createHttpError(404, 'User not found');

        const refreshToken = user.generateRefreshToken();
        const accessToken = user.generateAccessToken(mapping);

        return { accessToken, refreshToken };
    } catch (error) {
        throw new createHttpError(error);
    }
};