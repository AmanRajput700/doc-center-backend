const mongoose = require('mongoose');

const dbCache = {};

module.exports = function (dbName, modelName, schema) {

    if (!dbCache[dbName]) {
        dbCache[dbName] = mongoose.connection.useDb(
            dbName,
            { useCache: true }
        );
    }

    const db = dbCache[dbName];

    return (db.models[modelName] || db.model(modelName, schema));
};