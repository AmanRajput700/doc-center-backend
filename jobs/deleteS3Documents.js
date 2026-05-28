const cron = require('node-cron');
const getTenantModel = require('../utils/getTenantModel');
const documentSchema = require('../models/tenant/documentSchema');
const Tenant = require('../models/root/Tenant');
const { deleteObject } = require('../services/s3.service');
const createHttpError = require('http-errors');
const { STATUS_CODE, ERROR_MESSAGE } = require('../utils/constant');

cron.schedule('0 0 2 * * *', async function () {
    try {
        const tenants = await Tenant.find({}, { _id: 1, dbName: 1 }).lean();

        const sevenDaysAgo = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000));


        for (let tenant of tenants) {
            try {
                const Document = getTenantModel(tenant.dbName, 'Document', documentSchema);

                const documents = await Document.find({ isDeleted: true, deletedAt: { $lte: sevenDaysAgo } }).lean();

                if (!documents.length) continue;

                for (let document of documents) {
                    try {
                        await deleteObject(document.s3Key);
                        await Document.findByIdAndDelete(document._id);
                    } catch (error) {
                        console.error(`Failed deleting object: ${document.s3Key}`, error.message);
                    }
                }
            } catch (err) {
                console.error(`Tenant cleanup failed: ${tenant.dbName}`, err.message);
            }
        }

    } catch (error) {
        console.error('S3 cleanup cron failed', error.message);
    }
});