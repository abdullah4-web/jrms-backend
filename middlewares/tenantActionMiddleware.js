import TenantAction from '../models/TenantActionModel.js';
import Tenant from '../models/tenantModel.js';

export const logTenantAction = (action, getDescription) => {
    return async (req, res, next) => {
        try {
            const tenantId = req.body.tenantId || req.params.tenantId || null;
            const property = req.body.property || null;
            const floorId = req.body.floorId || null;
            const unitId = req.body.unitId || null;

            let tenant = null;
            if (tenantId) {
                tenant = await Tenant.findById(tenantId).select('contractInfo').lean();
            }

            const pdcInfo = tenant?.contractInfo?.pdc || req.body.contractInfo?.pdc || req.body || [];
            const paymentInfo = tenant?.contractInfo?.payment || req.body.contractInfo?.payment || req.body || [];

            const description = typeof getDescription === 'function' ? getDescription(req.body) : JSON.stringify(req.body);

            const tenantAction = new TenantAction({
                admin: req.user._id,
                action: action,
                description: description, 
                tenant: tenantId,
                property: property,
                floor: floorId,
                unit: unitId,
                pdc: pdcInfo,
                payment: paymentInfo
            });

            await tenantAction.save();
            req.tenantId = tenantId;
            next();
        } catch (error) {
            console.error('Error logging tenant action:', error);
            next(error);
        }
    };
};
