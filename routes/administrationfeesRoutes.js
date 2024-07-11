import express from 'express';
import AdministrationFee from '../models/administrationfeesModel.js';
 import Tenant from '../models/tenantModel.js';
const administrationfeeRouter = express.Router();

// Route to add administration fee data
administrationfeeRouter.post('/add-administration-fees', async (req, res) => {
    try {
        // Extract data from request body
        const {
            tenantId,
            contractIssuingFees,
            ejariFee,
            transferFees,
            terminationFees,
            contractExpiryFees,
            maintenanceSecurityDeposit,
            refundableGuarantee,
            lateRenewalFees,
            postponeChequeFees
        } = req.body;

        // Function to parse input value to number or return NaN if parsing fails
        const parseToNumber = value => {
            const parsedValue = parseFloat(value);
            return isNaN(parsedValue) ? undefined : parsedValue;
        };

        // Create a new AdministrationFee instance
        const administrationFee = new AdministrationFee({
            tenantId,
            contractIssuingFees: parseToNumber(contractIssuingFees),
            ejariFee: parseToNumber(ejariFee),
            transferFees: parseToNumber(transferFees),
            terminationFees: parseToNumber(terminationFees),
            contractExpiryFees: parseToNumber(contractExpiryFees),
            maintenanceSecurityDeposit: parseToNumber(maintenanceSecurityDeposit),
            refundableGuarantee: parseToNumber(refundableGuarantee),
            lateRenewalFees: parseToNumber(lateRenewalFees),
            postponeChequeFees: parseToNumber(postponeChequeFees)
        });

        // Save the administration fee data to the database
        const savedAdministrationFee = await administrationFee.save();

        res.status(201).json(savedAdministrationFee);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});


// Get all the adminstration Fees Record 
// Route to get all administration fee records and populate by tenantId
administrationfeeRouter.get('/all-administration-fees', async (req, res) => {
    try {
        const administrationFees = await AdministrationFee.find()
            .populate({
                path: 'tenantId',
                populate: [
                    { path: 'property', model: 'Property', select: 'name' }, // Populate only the name field of the property
                    { path: 'floorId', model: 'Floor', select: 'name' }, // Populate only the name field of the floor
                    { path: 'unitId', model: 'Unit', select: 'unitNo' } // Populate only the name field of the unit
                ]
            });

        res.status(200).json(administrationFees);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// Route to get administration fee record by ID
administrationfeeRouter.get('/administration-fee/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const administrationFee = await AdministrationFee.findById(id)
            .populate({
                path: 'tenantId',
                populate: [
                    { path: 'property', model: 'Property', select: 'name' },
                    { path: 'floorId', model: 'Floor', select: 'name' },
                    { path: 'unitId', model: 'Unit', select: 'unitNo' }
                ]
            });

        if (!administrationFee) {
            return res.status(404).json({ message: 'Administration fee record not found' });
        }

        res.status(200).json(administrationFee);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Route to get administration fee records by owner ID
administrationfeeRouter.post('/administration-fees-by-owner', async (req, res) => {
    try {
        const { ownerId } = req.body;

        // Find all tenants belonging to the specified owner
        const tenants = await Tenant.find({ ownerId });

        // Extract the IDs of the found tenants
        const tenantIds = tenants.map(tenant => tenant._id);

        // Find administration fees for the extracted tenant IDs
        const administrationFees = await AdministrationFee.find({ tenantId: { $in: tenantIds } })
            .populate({
                path: 'tenantId',
                populate: [
                    { path: 'property', model: 'Property', select: 'name' },
                    { path: 'floorId', model: 'Floor', select: 'name' },
                    { path: 'unitId', model: 'Unit', select: 'unitNo' },
                    { path: 'ownerId', model: 'User', select: 'name' }
                ]
            });

        res.status(200).json(administrationFees);
    } catch (error) {
        res.status(500).json({ message: error.message }); 
    }
});


// Route to get administration fee records by Property Id 
administrationfeeRouter.post('/administration-fees-by-property', async (req, res) => {
    try {
        const { propertyId } = req.body;

        // Find all tenants belonging to the specified property
        const tenants = await Tenant.find({ property: propertyId });

        // Extract the IDs of the found tenants
        const tenantIds = tenants.map(tenant => tenant._id);

        // Find administration fees for the extracted tenant IDs
        const administrationFees = await AdministrationFee.find({ tenantId: { $in: tenantIds } })
            .populate({
                path: 'tenantId',
                populate: [
                    { path: 'property', model: 'Property', select: 'name' },
                    { path: 'floorId', model: 'Floor', select: 'name' },
                    { path: 'unitId', model: 'Unit', select: 'unitNo' },
                    { path: 'ownerId', model: 'User', select: 'name' }
                ]
            });

        res.status(200).json(administrationFees);
    } catch (error) {
        res.status(500).json({ message: error.message }); 
    }
});



export default administrationfeeRouter;
