import express from 'express';
import AdminAction from '../models/adminActionModel.js';
import { isAuth } from '../utils.js'; // assuming isAuth middleware is used for authentication

const adminActionRouter = express.Router();

// Route to get all admin actions
adminActionRouter.get('/allactions',  async (req, res) => {
    try {
        const adminActions = await AdminAction.find().populate('admin', 'name').populate('tenant', 'name');
        res.status(200).json(adminActions);
    } catch (error) {
        console.error('Error fetching admin actions:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Route to get admin actions by admin ID
adminActionRouter.get('/admin/:adminId', isAuth, async (req, res) => {
    try {
        const { adminId } = req.params;
        const adminActions = await AdminAction.find({ admin: adminId }).populate('admin', 'name').populate('tenant', 'name');
        res.status(200).json(adminActions);
    } catch (error) {
        console.error('Error fetching admin actions by admin ID:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Route to get admin actions by tenant ID
adminActionRouter.get('/tenant/:tenantId', isAuth, async (req, res) => {
    try {
        const { tenantId } = req.params;
        const adminActions = await AdminAction.find({ tenant: tenantId }).populate('admin', 'name').populate('tenant', 'name');
        res.status(200).json(adminActions);
    } catch (error) {
        console.error('Error fetching admin actions by tenant ID:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

export default adminActionRouter;