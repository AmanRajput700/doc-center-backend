const getTenantModel = require('../../utils/getTenantModel');
const userSessionSchema = require('../../models/tenant/userSessionSchema');
const ms = require('ms');

function getSessionExpiry() {
    return new Date(
        Date.now() + ms(process.env.REFRESH_TOKEN_EXPIRY || '7d')
    );
}

async function createSession({ dbName, userId, platform, refreshToken }) {

    const UserSession = getTenantModel(dbName, 'UserSession', userSessionSchema);

    const expiresAt = getSessionExpiry();

    return UserSession.create({
        userId,
        platform,
        refreshToken,
        expiresAt
    });
}

async function findSessionByRefreshToken({ dbName, refreshToken }) {

    const UserSession = getTenantModel(dbName, 'UserSession', userSessionSchema);

    return UserSession.findOne({
        refreshToken
    }).select('+refreshToken');
}

async function rotateSession({ dbName, oldRefreshToken, newRefreshToken }) {

    const UserSession = getTenantModel(dbName, 'UserSession', userSessionSchema);
    const expiresAt = getSessionExpiry();

    return UserSession.findOneAndUpdate(
        {
            refreshToken: oldRefreshToken
        },
        {
            $set: {
                refreshToken: newRefreshToken,
                lastUsedAt: new Date(),
                expiresAt
            }
        },
        {
            new: true
        }
    );
}

async function deleteSession({ dbName, refreshToken }) {

    const UserSession = getTenantModel(dbName, 'UserSession', userSessionSchema);

    return UserSession.findOneAndDelete({
        refreshToken
    });
}

module.exports = {
    createSession,
    findSessionByRefreshToken,
    rotateSession,
    deleteSession
};