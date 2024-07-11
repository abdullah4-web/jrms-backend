// propertyActionMiddleware.js
import PropertyAction from '../models/PropertyActionModel.js';

export const logPropertyAction = (action) => {
    return async (req, res, next) => {
        try {
            const propertyId = req.params.propertyId || req.body.propertyId || null;

            // Create the property action object
            const propertyAction = new PropertyAction({
                admin: req.user._id,
                action: action,
                description: JSON.stringify(req.body),
                property: propertyId,
            });

            // Save the property action
            await propertyAction.save();

            // Pass the property ID to the next middleware
            req.propertyId = propertyId;

            next();
        } catch (error) {
            console.error('Error logging property action:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    };
};
