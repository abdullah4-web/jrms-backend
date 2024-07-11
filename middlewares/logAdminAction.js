import AdminAction from '../models/adminActionModel.js';

const logAdminAction = (action) => {
    return async (req, res, next) => { 
        try {
            const propertyDetails = { ...req.params, ...req.body }; // Combine req.params and req.body
            const adminAction = new AdminAction({
                admin: req.user._id,
                action,
                description: JSON.stringify(propertyDetails), // Convert propertyDetails to string
                tenant: req.params.id || req.body.tenantId || null
            });
            await adminAction.save();
            next();
        } catch (error) {
            console.error('Error logging admin action:', error);
            next(error);
        }
    };
};

export default logAdminAction;
