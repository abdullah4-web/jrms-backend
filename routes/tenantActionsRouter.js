import express from 'express';
import TenantAction from '../models/TenantActionModel.js';
import { isAuth, isSuperAdmin } from '../utils.js';

const router = express.Router();

// Endpoint to get all tenant action logs
router.get('/logs', isAuth, isSuperAdmin, async (req, res) => {
    try {
        const logs = await TenantAction.find()
            .populate('admin', 'name email')
            .populate('tenant', 'name companyname')
            .populate('property', 'name buildingname')
            .populate('floor', 'name')
            .populate('unit', 'unitNo')
            .lean();

        res.json(logs);
    } catch (error) {
        console.error('Error fetching logs:', error);
        res.status(500).json({ message: 'Error fetching logs' });
    }
});

export default router;
