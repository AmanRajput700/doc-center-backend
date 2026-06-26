const cron = require('node-cron');
const getTenantModel = require('../utils/getTenantModel');
const documentSchema = require('../models/tenant/documentSchema');
const Tenant = require('../models/root/Tenant');
const logger = require('../config/logger');

const UPLOAD_TIMEOUT_MINUTES = 15;

cron.schedule('*/5 * * * *', async function () {
    try {
        const tenants = await Tenant.find(
            {},
            { _id: 1, dbName: 1, slug: 1 }
        ).lean();

        const timeoutDate = new Date(Date.now() - UPLOAD_TIMEOUT_MINUTES * 60 * 1000);

        for (const tenant of tenants) {
            try {
                const Document = getTenantModel(tenant.dbName, 'Document', documentSchema);

                const result = await Document.updateMany(
                    {
                        uploadStatus: 'pending',
                        createdAt: {
                            $lte: timeoutDate
                        }
                    },
                    {
                        $set: {
                            uploadStatus: 'failed',
                        }
                    }
                );

                if (result.modifiedCount > 0) {
                    console.log(`[UPLOAD CLEANUP] Tenant: ${tenant.slug} | Marked ${result.modifiedCount} documents as failed`);
                }
            } catch (err) {
                console.error(`[UPLOAD CLEANUP] Tenant: ${tenant.slug}`, err);
                logger.warn({
                    action: 'HANDLED_ERROR',
                    stack: err.stack
                })
            }
        }
    } catch (err) {
        console.error('[UPLOAD CLEANUP] Job failed', err);
        logger.warn({
            action: 'HANDLED_ERROR',
            stack: err.stack
        })
    }
});