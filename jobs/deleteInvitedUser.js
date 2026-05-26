const cron = require('node-cron');
const Tenant = require('../models/root/Tenant');
const inviteMemberSchema = require('../models/tenant/inviteMemberSchema');
const getTenantModel = require('../utils/getTenantModel');

cron.schedule('0 0 2 * * *', async function () {
    try {
        const tenants = await Tenant.find({}, { _id: 1, dbName: 1 }).lean();

        const sevenDaysAgo = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000));

        for (let tenant of tenants) {
            try {
                const InviteMember = getTenantModel(tenant.dbName, 'InviteMember', inviteMemberSchema);

                const members = await InviteMember.find({ status: "pending", createdAt: { $lte: sevenDaysAgo } })
                    .limit(100)
                    .lean();

                for (let member of members) {
                    try {
                        await InviteMember.deleteMany({
                            status: 'pending',
                            createdAt: {
                                $lte: sevenDaysAgo
                            }
                        });
                    } catch (error) {
                        console.error(`Failed to cleanup for ${member._id}`)
                    }
                }
            } catch (err) {
                console.error(`Invite Schema cleanup failed: ${tenant.dbName}`, err.message);
            }
        }
    } catch (err) {
        console.error('Invited User Deletion Cron failed' + err.message);
    }
});