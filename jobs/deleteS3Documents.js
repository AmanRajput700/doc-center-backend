const cron = require('node-cron');
const getTenantModel = require('../utils/getTenantModel');
const documentSchema = require('../models/tenant/documentSchema');
const storageSchema = require('../models/tenant/storageSchema');
const Tenant = require('../models/root/Tenant');
const { deleteObject } = require('../services/s3.service');
const createHttpError = require('http-errors');
const { STATUS_CODE, ERROR_MESSAGE } = require('../utils/constant');
const folderSchema = require('../models/tenant/folderSchema');

cron.schedule('0 0 16 * * *', async function () {
    try {
        console.log(`CRON run at ${new Date()}`)
        const tenants = await Tenant.find({}, { _id: 1, dbName: 1, slug: 1 }).lean();

        const sevenDaysAgo = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000));

        for (let tenant of tenants) {
            try {
                console.log(`Processing tenant: ${tenant.slug}`);
                const Document = getTenantModel(tenant.dbName, 'Document', documentSchema);
                const Storage = getTenantModel(tenant.dbName, 'Storage', storageSchema);
                const Folder = getTenantModel(tenant.dbName, 'Folder', folderSchema);
                const documents = await Document.find({ isDeleted: true, deletedAt: { $lte: sevenDaysAgo } }).lean();
                const folders = await Folder.find({ isDeleted: true, deletedAt: { $lte: sevenDaysAgo } }).lean();
                console.log(`Found Docs ${documents.length}`);
                if (!documents.length && !folders.length) {
                    continue;
                }


                for (let document of documents) {
                    try {
                        await deleteObject(document.s3Key);
                        console.log(`Deleted from S3 ${document.s3Key}`)
                        await Storage.findOneAndUpdate(
                            {
                                tenantId: tenant._id
                            },
                            {
                                $inc: {
                                    trashedFiles: -1,
                                    storageUsed: -document.size
                                },
                                $set: {
                                    lastStorageUpdatedAt: new Date()
                                }
                            }
                        );
                        console.log(`Tenant Storage updated ${tenant.slug}`);
                        await Document.findByIdAndDelete(document._id);
                        console.log(` Removed document from DB: ${document._id}`);

                    } catch (error) {
                        console.error(`Failed deleting object: ${document.s3Key}`, error.message);
                    }
                }

                for (let folder of folders) {
                    try {
                        await Folder.findByIdAndDelete(folder._id);
                    } catch (error) {
                        console.error(`Failed deleting folder: ${document.s3Key}`, error.message);
                    }
                }
                console.log(`Cleanup completed for tenant: ${tenant.slug}`);
            } catch (err) {
                console.error(`Tenant cleanup failed: ${tenant.dbName}`, err.message);
            }
        }

    } catch (error) {
        console.error('S3 cleanup cron failed', error.message);
    }
});