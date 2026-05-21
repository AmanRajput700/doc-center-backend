jest.mock('../../../utils/emails/verifyTenant.js', () => jest.fn());

const Tenant = require('../../../models/root/Tenant');

const registerTenant = require('../../../controllers/tenant/registerTenantController');

const validTenantData = require('../../helpers/mockTenantData');

describe('Register Tenant Controller', () => {
    test('should create tenant successfully', async () => {
        const tenant = await registerTenant(validTenantData);
        expect(tenant)
            .toBeDefined();
        expect(tenant.orgName)
            .toBe('Acme');

        const tenantInDB = await Tenant.findOne({ slug: 'acme' });
        expect(tenantInDB)
            .not.toBeNull();
    }
    );
});