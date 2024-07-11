import express from 'express';
import Tenant from '../models/tenantModel.js';
import Unit from '../models/unitModel.js'; 
import nodemailer from 'nodemailer';
import { isAuth, isSuperAdmin, isAdmin } from '../utils.js';
import cron from 'node-cron'; // Import node-cron library
import logAdminAction from '../middlewares/logAdminAction.js';
import { logTenantAction } from '../middlewares/tenantActionMiddleware.js';
const tenantRouter = express.Router();

// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'omerlantana@gmail.com', 
        pass: 'fkxn hlir jukw mpkn'    
    }
});




// Function to send renewal reminder emails
const sendRenewalReminderEmails = async (tenants) => {
    try {
        // Array to store emails of successfully sent reminders
        const sentEmails = [];

        // Send reminder emails to tenants whose contract ends today
        for (const tenant of tenants) {
            const mailOptions = {
                from: 'omerlantana@gmail.com', // Replace with your email
                to: tenant.email,
                subject: 'Reminder: Contract Renewal',
                html: `
                    <html>
                        <head>
                            <!-- Add your HTML content here -->
                        </head>
                        <body>
                            <p>Dear ${tenant.name},</p>
                            <p>This is a reminder that your contract (${tenant.contractNo}) is nearing expiration.</p>
                            <p>Please contact us to discuss contract renewal.</p>
                            <p>Regards,<br>Jovera</p>
                        </body>
                    </html>
                `
            };

            // Send email
            await transporter.sendMail(mailOptions);

            // Log success message for each tenant whose contract ends today
            console.log(`Renewal reminder email sent successfully to ${tenant.email}`);

            // Add the email to the array of sent emails
            sentEmails.push(tenant.email);
        }

        // Return the array of sent emails
        return sentEmails;
    } catch (error) {
        // Log the error for debugging
        console.error('Error sending renewal reminder emails:', error);
        throw new Error('Error sending renewal reminder emails:', error);
    }
};

// Cron job to send renewal reminder emails
cron.schedule('54 15 * * *', async () => {
    try {
        // Get today's date
        const today = new Date();
        // Set the time to 00:00:00 for accurate comparison with contract end dates
        today.setHours(0, 0, 0, 0);

        // Get tenants whose contract ends in 30 days, 15 days, and today
        const tenants30Days = await Tenant.find({
            'contractInfo.endDate': {
                $gte: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days from today
                $lt: new Date(today.getTime() + 31 * 24 * 60 * 60 * 1000) // 31 days from today
            }
        });

        const tenants15Days = await Tenant.find({
            'contractInfo.endDate': {
                $gte: new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000), // 15 days from today
                $lt: new Date(today.getTime() + 16 * 24 * 60 * 60 * 1000) // 16 days from today
            }
        });

        const tenantsToday = await Tenant.find({
            'contractInfo.endDate': {
                $gte: today,
                $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) // End date is today
            }
        });

        // Combine all tenants to whom reminders need to be sent
        const tenants = [...tenants30Days, ...tenants15Days, ...tenantsToday];

        // Send renewal reminder emails to tenants
        await sendRenewalReminderEmails(tenants);

        console.log('Renewal reminder emails sent successfully.');
    } catch (error) {
        console.error('Error sending renewal reminder emails:', error);
    }
});


//// tenants of today expiry contract 
tenantRouter.get('/tenantsWithContractEndToday',  async (req, res) => {
    try {
        // Get today's date
        const today = new Date();
        // Set the time to 00:00:00 for accurate comparison with contract end dates
        today.setHours(0, 0, 0, 0);

        // Query database for tenants with contract end date today
        const tenants = await Tenant.find({
            'contractInfo.endDate': {
                $gte: today,
                $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) // End date is today
            }
        });

        // Send the list of tenants with contract end date today in the response
        res.status(200).json({ tenants });
    } catch (error) {
        console.error('Error fetching tenants with contract end date today:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


tenantRouter.get('/tenantsWithContractexpiry', isAuth, async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const twoMonthsFromNow = new Date(today.getFullYear(), today.getMonth() + 2, today.getDate());

        const tenants = await Tenant.find({
            'contractInfo.endDate': {
                $gte: today,
                $lt: twoMonthsFromNow
            }
        });

        res.status(200).json({ tenants });
    } catch (error) {
        console.error('Error fetching tenants with contract end date within 2 months:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


tenantRouter.post('/renewtenant', isAuth,isSuperAdmin, logTenantAction('Renewal Contract'),async (req, res) => {
    const { tenantId, contractInfo } = req.body;

    try {
        const existingTenant = await Tenant.findById(tenantId);

        if (!existingTenant) {
            return res.status(404).json({ error: 'Tenant not found' });
        }

        if (!contractInfo.paidAmount) {
            contractInfo.paidAmount = 0;
        }

        const lastTenant = await Tenant.findOne({}, {}, { sort: { 'createdAt': -1 } });

        let lastContractNo = 0;
        if (lastTenant && lastTenant.contractNo) {
            lastContractNo = parseInt(lastTenant.contractNo.split('-')[1], 10);
        }
        const newContractNo = `JG-${lastContractNo + 1}`;        
        const newTenant = new Tenant({
            name: existingTenant.name,
            email: existingTenant.email,
            contact: existingTenant.contact,
            nid: existingTenant.nid,
            licenseno: existingTenant.licenseno,
            companyname: existingTenant.companyname,
            passport: existingTenant.passport,
            address: existingTenant.address,
            ownerId: existingTenant.ownerId,
            property: existingTenant.property,
            floorId: existingTenant.floorId,
            unitId: existingTenant.unitId,
            propertyType: existingTenant.propertyType,
            contractInfo,
            status: existingTenant.status,
            contractNo: newContractNo,
        });
        const savedTenant = await newTenant.save();
        res.status(201).json(savedTenant);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
 
///////Super Admin Routes /////
tenantRouter.post('/addtenant', isAuth, isSuperAdmin, logTenantAction('Add Tenant', (body) => {
    return `Added a new tenant with name: ${body.name || 'N/A'}, contact: ${body.contact || 'N/A'}, email: ${body.email || 'N/A'}, NID: ${body.nid || 'N/A'}, contract amount: ${body.contractInfo.totalContractAmount || 'N/A'} AED, PDC info: ${JSON.stringify(body.contractInfo.pdc)}, and contract info: ${JSON.stringify(body.contractInfo)}`;}), async (req, res) => {
    try {
        const {
            name,
            email,
            contact,
            nid,
            licenseno,
            companyname,
            passport,
            address,
            ownerId,
            property,
            floorId,
            unitId,
            propertyType,
            contractInfo,
            status,
        } = req.body;

        const requiredFields = ['contact', 'ownerId', 'property', 'floorId', 'unitId', 'propertyType', 'contractInfo'];
        for (const field of requiredFields) {
            if (!req.body[field]) {
                return res.status(400).json({ error: `Field '${field}' is required` });
            }
        }

        if (!contractInfo.paidAmount) {
            contractInfo.paidAmount = 0;
        }

        const lastTenant = await Tenant.findOne({}, {}, { sort: { 'createdAt': -1 } });

        let lastContractNo = 0;
        if (lastTenant && lastTenant.contractNo) {
            lastContractNo = parseInt(lastTenant.contractNo.split('-')[1], 10);
        }

        const newContractNo = `JG-${lastContractNo + 1}`;

        const newTenant = new Tenant({
            name,
            email,
            contact,
            nid,
            licenseno,
            companyname,
            passport,
            address,
            ownerId,
            property,
            floorId,
            unitId,
            propertyType,
            contractInfo,
            status,
            contractNo: newContractNo,
        });

        const savedTenant = await newTenant.save();

        for (const id of unitId) {
            await Unit.findByIdAndUpdate(id, { occupied: true }, { new: true });
        }

        res.status(201).json(savedTenant);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
// Route to edit an existing tenant
tenantRouter.put('/edittenant/:id', isAuth, isSuperAdmin, logTenantAction('Edit Tenant'), async (req, res) => {
    try {
        const tenantId = req.params.id; // Extract tenant ID from request parameters

        // Find the tenant by ID and update with the new data
        const updatedTenant = await Tenant.findByIdAndUpdate(tenantId, req.body, { new: true });

        if (!updatedTenant) {
            return res.status(404).json({ error: 'Tenant not found' });
        }

        res.status(200).json(updatedTenant);
    } catch (error) {
        // Handle errors
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
// Route to get all tenants and populate by owner, apartments, floor, and units
tenantRouter.get('/alltenants', isAuth , isSuperAdmin , async (req, res) => {
    try {
        const tenants = await Tenant.find({ status: 'Active' }) // Filter by status: 'Active'
            .populate('ownerId', 'name email nationality emid contact') // Populate owner with only name
            .populate('property') // Populate property with only name
            .populate('floorId', 'name') // Populate floor with only number
            .populate('unitId'); // Populate unit with only number

        res.status(200).json(tenants);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

//// Route for Case tenants
tenantRouter.get('/allcasetenants', isAuth , isSuperAdmin , async (req, res) => {
    try {
        const tenants = await Tenant.find({ status: 'Case' }) // Filter by status: 'Active'
            .populate('ownerId', 'name email nationality emid contact') // Populate owner with only name
            .populate('property') // Populate property with only name
            .populate('floorId', 'name') // Populate floor with only number
            .populate('unitId'); // Populate unit with only number

        res.status(200).json(tenants);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

 
// Route to get details of a single tenant by ID and populate by owner, apartments, floor, and units
tenantRouter.get('/tenant/:id', isAuth , isSuperAdmin , async (req, res) => {
    const tenantId = req.params.id; // Get tenant ID from URL parameter

    try {
        const tenant = await Tenant.findById(tenantId)
            .populate('ownerId', 'name email nationality emid contact') // Populate owner with only name
            .populate('property') // Populate property with only name
            .populate('floorId', 'name') // Populate floor with only number
            .populate('unitId'); // Populate unit with only number

        if (!tenant) {
            return res.status(404).json({ error: 'Tenant not found' });
        }

        res.status(200).json(tenant);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
 
 
// Route to get all tenants of an owner by ownerId
tenantRouter.get('/tenants-by-owner/:ownerId', isAuth , isSuperAdmin ,async (req, res) => {
    const ownerId = req.params.ownerId; 

    try {
        const tenants = await Tenant.find({ ownerId })
            .populate('ownerId', 'name email nationality emid contact') // Populate owner with specified fields
            .populate('property') // Populate property with only name
            .populate('floorId', 'name') // Populate floor with only number
            .populate('unitId'); // Populate unit with only number

        res.status(200).json(tenants);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    } 
});

// Route to update payment information for a specific tenant and PDC 
tenantRouter.put('/:tenantId/pdc/:pdcId/payments', isAuth, isSuperAdmin, logTenantAction('Payment'),async (req, res) => {
    try {
        const { tenantId, pdcId } = req.params;
        const { paymentmethod, paymentstatus, amount, date, bank, checkorinvoice, submissiondate, remarks, collectiondate ,type} = req.body;
        // Find the tenant by ID
        const tenant = await Tenant.findById(tenantId);
        // Find the PDC by ID
        const pdcIndex = tenant.contractInfo.pdc.findIndex(pdc => pdc._id.toString() === pdcId);
        if (pdcIndex === -1) {
            return res.status(404).json({ error: 'PDC not found' });
        }
        const originalPDC = tenant.contractInfo.pdc[pdcIndex];
        // Calculate new paidAmount if payment method is 'cash'
        let newPaidAmount = Number(tenant.contractInfo.paidAmount) || 0; // Initialize with current paidAmount
        if (paymentmethod === 'cash') {
            newPaidAmount += Number(amount); // Add the payment amount
        }
        // Update payment details 
        tenant.contractInfo.payment.push({ paymentmethod, paymentstatus, amount, date, bank, checkorinvoice, submissiondate, remarks, collectiondate ,type }); 
        // Update paidAmount only if payment method is 'cash'
        if (paymentmethod === 'cash') {
            tenant.contractInfo.paidAmount = newPaidAmount;
        }
        // Set isTransfter to true for the original PDC
        originalPDC.isTransfter = true;
        // Create a new PDC entry for the remaining amount if any
        if (amount < originalPDC.amount) {
            const remainingAmount = originalPDC.amount - amount;
            tenant.contractInfo.pdc.push({
                checkNumber: originalPDC.checkNumber,
                isTransfter: false, // Mark as transferred even for partial payment
                bank: originalPDC.bank,
                date: originalPDC.date,
                amount: remainingAmount,
                pdcstatus: 'delay',
                submissiondate: submissiondate,
                type: 'partial' // Set type to partial
            });
        }
        // Save the updated tenant
        await tenant.save();
        res.status(200).json({ message: 'Payment information updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// 
tenantRouter.put('/tenant/:id/paymentstatus', isAuth, isSuperAdmin, logTenantAction('Payment Status Change'),async (req, res) => {
    const tenantId = req.params.id; // Get tenant ID from URL parameter
    const { paymentId, paymentstatus } = req.body;
    try {
        const tenant = await Tenant.findById(tenantId);
        const paymentIndex = tenant.contractInfo.payment.findIndex(payment => payment._id.toString() === paymentId);
        if (paymentIndex === -1) {
            return res.status(404).json({ error: 'Payment not found' });
        }
        const payment = tenant.contractInfo.payment[paymentIndex];
        payment.paymentstatus = paymentstatus;
        if (paymentstatus === 'return') {
            tenant.contractInfo.pdc.push({
                amount: payment.amount,
                bank: payment.bank,
                checkNumber: payment.checkorinvoice,
                date: payment.date,
                pdcstatus: 'return'
            });
            tenant.contractInfo.payment.splice(paymentIndex, 1);
        } else if (paymentstatus === 'paid') {
            // If payment status is 'paid', calculate paidAmount and set collectiondate
            const newPaidAmount = (Number(tenant.contractInfo.paidAmount) || 0) + Number(payment.amount);
            tenant.contractInfo.paidAmount = newPaidAmount;
            payment.collectiondate = new Date().toISOString().split('T')[0];
        }
        await tenant.save();
        res.status(200).json({ message: 'Payment status updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

tenantRouter.post('/tenants-by-property', isAuth, isSuperAdmin, async (req, res) => {
    const { propertyId } = req.body; // Get property ID from request body

    try {
        // Find tenants associated with the property
        const tenants = await Tenant.find({ property: propertyId })
            .populate('ownerId', 'name email nationality emid contact') // Populate owner with specified fields
            .populate('property') // Populate property with all fields
            .populate('floorId', 'name') // Populate floor with only number
            .populate('unitId'); // Populate unit with only number

        res.status(200).json(tenants);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
tenantRouter.put('/updatestatus/:id', isAuth, isSuperAdmin, logTenantAction('Update Tenant Status'), async (req, res) => {
    try {
        const { status } = req.body;
        const tenantId = req.params.id;

        // Validate the status
        const validStatuses = ['Active', 'Case', 'Cancel'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        // Find the tenant by ID and update the status
        const updatedTenant = await Tenant.findByIdAndUpdate(
            tenantId,
            { status },
            { new: true }
        );

        if (!updatedTenant) {
            return res.status(404).json({ error: 'Tenant not found' });
        }

        // Send a success response
        res.status(200).json(updatedTenant);
    } catch (error) {
        // Handle errors
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


  ////For Report Genaration 
tenantRouter.post('/tenants-by-owner', isAuth, isSuperAdmin, async (req, res) => {
    const { ownerId } = req.body; // Get ownerId from request body
    try {
        const tenants = await Tenant.find({ ownerId })
            .populate('ownerId', 'name email nationality emid contact') // Populate owner with specified fields
            .populate('property') // Populate property with only name
            .populate('floorId', 'name') // Populate floor with only number
            .populate('unitId'); // Populate unit with only number

        res.status(200).json(tenants);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
////For Exsisting Tenant 
tenantRouter.get('/getByNID/:nid', isAuth, async (req, res) => {
    const nid = req.params.nid; // Get NID from URL parameter

    try {
        const tenant = await Tenant.findOne({ nid });
        if (!tenant) {
            return res.status(404).json({ error: 'Tenant not found' });
        }

        res.status(200).json(tenant);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


////////  Admin Routes //////
////////  Admin Routes //////
////////  Admin Routes //////


tenantRouter.post('/renewtenant-for-admin', isAuth,isAdmin, logTenantAction('Renewal Contract'),async (req, res) => {
    const { tenantId, contractInfo } = req.body;

    try {
        const existingTenant = await Tenant.findById(tenantId);

        if (!existingTenant) {
            return res.status(404).json({ error: 'Tenant not found' });
        }

        if (!contractInfo.paidAmount) {
            contractInfo.paidAmount = 0;
        }

        const lastTenant = await Tenant.findOne({}, {}, { sort: { 'createdAt': -1 } });

        let lastContractNo = 0;
        if (lastTenant && lastTenant.contractNo) {
            lastContractNo = parseInt(lastTenant.contractNo.split('-')[1], 10);
        }
        const newContractNo = `JG-${lastContractNo + 1}`;        
        const newTenant = new Tenant({
            name: existingTenant.name,
            email: existingTenant.email,
            contact: existingTenant.contact,
            nid: existingTenant.nid,
            licenseno: existingTenant.licenseno,
            companyname: existingTenant.companyname,
            passport: existingTenant.passport,
            address: existingTenant.address,
            ownerId: existingTenant.ownerId,
            property: existingTenant.property,
            floorId: existingTenant.floorId,
            unitId: existingTenant.unitId,
            propertyType: existingTenant.propertyType,
            contractInfo,
            status: existingTenant.status,
            contractNo: newContractNo,
        });
        const savedTenant = await newTenant.save();
        res.status(201).json(savedTenant);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

///////Super Admin Routes /////
tenantRouter.post('/addtenant-for-admin', isAuth, isAdmin, logTenantAction('Add Tenant', (body) => {
    return `Added a new tenant with name: ${body.name || 'N/A'}, contact: ${body.contact || 'N/A'}, email: ${body.email || 'N/A'}, NID: ${body.nid || 'N/A'}, property: ${body.property || 'N/A'}, floor: ${body.floorId || 'N/A'}, units: ${body.unitId.join(', ') || 'N/A'}, contract amount: ${body.contractInfo.totalContractAmount || 'N/A'} AED, and status: ${body.status || 'N/A'}`;
}), async (req, res) => {
    try {
        const {
            name,
            email,
            contact,
            nid,
            licenseno,
            companyname,
            passport,
            address,
            ownerId,
            property,
            floorId,
            unitId,
            propertyType,
            contractInfo,
            status,
        } = req.body;

        const requiredFields = ['contact', 'ownerId', 'property', 'floorId', 'unitId', 'propertyType', 'contractInfo'];
        for (const field of requiredFields) {
            if (!req.body[field]) {
                return res.status(400).json({ error: `Field '${field}' is required` });
            }
        }

        if (!contractInfo.paidAmount) {
            contractInfo.paidAmount = 0;
        }

        const lastTenant = await Tenant.findOne({}, {}, { sort: { 'createdAt': -1 } });

        let lastContractNo = 0;
        if (lastTenant && lastTenant.contractNo) {
            lastContractNo = parseInt(lastTenant.contractNo.split('-')[1], 10);
        }

        const newContractNo = `JG-${lastContractNo + 1}`;

        const newTenant = new Tenant({
            name,
            email,
            contact,
            nid,
            licenseno,
            companyname,
            passport,
            address,
            ownerId,
            property,
            floorId,
            unitId,
            propertyType,
            contractInfo,
            status,
            contractNo: newContractNo,
        });

        const savedTenant = await newTenant.save();

        for (const id of unitId) {
            await Unit.findByIdAndUpdate(id, { occupied: true }, { new: true });
        }

        res.status(201).json(savedTenant);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
// Route to edit an existing tenant
tenantRouter.put('/edittenant-for-admin/:id', isAuth, isSuperAdmin, logTenantAction('Edit Tenant'), async (req, res) => {
    try {
        const tenantId = req.params.id; // Extract tenant ID from request parameters

        // Find the tenant by ID and update with the new data
        const updatedTenant = await Tenant.findByIdAndUpdate(tenantId, req.body, { new: true });

        if (!updatedTenant) {
            return res.status(404).json({ error: 'Tenant not found' });
        }

        res.status(200).json(updatedTenant);
    } catch (error) {
        // Handle errors
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
// Route to get all tenants and populate by owner, apartments, floor, and units
tenantRouter.get('/alltenants-for-admin', isAuth , isAdmin , async (req, res) => {
    try {
        const tenants = await Tenant.find({ status: 'Active' }) // Filter by status: 'Active'
            .populate('ownerId', 'name email nationality emid contact') // Populate owner with only name
            .populate('property') // Populate property with only name
            .populate('floorId', 'name') // Populate floor with only number
            .populate('unitId'); // Populate unit with only number

        res.status(200).json(tenants);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

//// Route for Case tenants
tenantRouter.get('/allcasetenants-for-admin', isAuth , isAdmin , async (req, res) => {
    try {
        const tenants = await Tenant.find({ status: 'Case' }) // Filter by status: 'Active'
            .populate('ownerId', 'name email nationality emid contact') // Populate owner with only name
            .populate('property') // Populate property with only name
            .populate('floorId', 'name') // Populate floor with only number
            .populate('unitId'); // Populate unit with only number

        res.status(200).json(tenants);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

 
// Route to get details of a single tenant by ID and populate by owner, apartments, floor, and units
tenantRouter.get('/tenant-for-admin/:id', isAuth , isAdmin , async (req, res) => {
    const tenantId = req.params.id; // Get tenant ID from URL parameter

    try {
        const tenant = await Tenant.findById(tenantId)
            .populate('ownerId', 'name email nationality emid contact') // Populate owner with only name
            .populate('property') // Populate property with only name
            .populate('floorId', 'name') // Populate floor with only number
            .populate('unitId'); // Populate unit with only number

        if (!tenant) {
            return res.status(404).json({ error: 'Tenant not found' });
        }

        res.status(200).json(tenant);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
 
 
// Route to get all tenants of an owner by ownerId
tenantRouter.get('/tenants-by-owner-for-admin/:ownerId', isAuth , isAdmin ,async (req, res) => {
    const ownerId = req.params.ownerId; 

    try {
        const tenants = await Tenant.find({ ownerId })
            .populate('ownerId', 'name email nationality emid contact') // Populate owner with specified fields
            .populate('property') // Populate property with only name
            .populate('floorId', 'name') // Populate floor with only number
            .populate('unitId'); // Populate unit with only number

        res.status(200).json(tenants);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    } 
});

// Route to update payment information for a specific tenant and PDC 
tenantRouter.put('/for-admin/:tenantId/pdc/:pdcId/payments', isAuth, isAdmin, logTenantAction('Payment'),async (req, res) => {
    try {
        const { tenantId, pdcId } = req.params;
        const { paymentmethod, paymentstatus, amount, date, bank, checkorinvoice, submissiondate, remarks, collectiondate ,type} = req.body;
        // Find the tenant by ID
        const tenant = await Tenant.findById(tenantId);
        // Find the PDC by ID
        const pdcIndex = tenant.contractInfo.pdc.findIndex(pdc => pdc._id.toString() === pdcId);
        if (pdcIndex === -1) {
            return res.status(404).json({ error: 'PDC not found' });
        }
        const originalPDC = tenant.contractInfo.pdc[pdcIndex];
        // Calculate new paidAmount if payment method is 'cash'
        let newPaidAmount = Number(tenant.contractInfo.paidAmount) || 0; // Initialize with current paidAmount
        if (paymentmethod === 'cash') {
            newPaidAmount += Number(amount); // Add the payment amount
        }
        // Update payment details 
        tenant.contractInfo.payment.push({ paymentmethod, paymentstatus, amount, date, bank, checkorinvoice, submissiondate, remarks, collectiondate ,type }); 
        // Update paidAmount only if payment method is 'cash'
        if (paymentmethod === 'cash') {
            tenant.contractInfo.paidAmount = newPaidAmount;
        }
        // Set isTransfter to true for the original PDC
        originalPDC.isTransfter = true;
        // Create a new PDC entry for the remaining amount if any
        if (amount < originalPDC.amount) {
            const remainingAmount = originalPDC.amount - amount;
            tenant.contractInfo.pdc.push({
                checkNumber: originalPDC.checkNumber,
                isTransfter: false, // Mark as transferred even for partial payment
                bank: originalPDC.bank,
                date: originalPDC.date,
                amount: remainingAmount,
                pdcstatus: 'delay',
                submissiondate: submissiondate,
                type: 'partial' // Set type to partial
            });
        }
        // Save the updated tenant
        await tenant.save();
        res.status(200).json({ message: 'Payment information updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// 
tenantRouter.put('/tenant-for-admin/:id/paymentstatus', isAuth, isAdmin, logTenantAction('Payment Status Change'),async (req, res) => {
    const tenantId = req.params.id; // Get tenant ID from URL parameter
    const { paymentId, paymentstatus } = req.body;
    try {
        const tenant = await Tenant.findById(tenantId);
        const paymentIndex = tenant.contractInfo.payment.findIndex(payment => payment._id.toString() === paymentId);
        if (paymentIndex === -1) {
            return res.status(404).json({ error: 'Payment not found' });
        }
        const payment = tenant.contractInfo.payment[paymentIndex];
        payment.paymentstatus = paymentstatus;
        if (paymentstatus === 'return') {
            tenant.contractInfo.pdc.push({
                amount: payment.amount,
                bank: payment.bank,
                checkNumber: payment.checkorinvoice,
                date: payment.date,
                pdcstatus: 'return'
            });
            tenant.contractInfo.payment.splice(paymentIndex, 1);
        } else if (paymentstatus === 'paid') {
            // If payment status is 'paid', calculate paidAmount and set collectiondate
            const newPaidAmount = (Number(tenant.contractInfo.paidAmount) || 0) + Number(payment.amount);
            tenant.contractInfo.paidAmount = newPaidAmount;
            payment.collectiondate = new Date().toISOString().split('T')[0];
        }
        await tenant.save();
        res.status(200).json({ message: 'Payment status updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

tenantRouter.post('/tenants-by-property-for-admin', isAuth, isAdmin, async (req, res) => {
    const { propertyId } = req.body; // Get property ID from request body

    try {
        // Find tenants associated with the property
        const tenants = await Tenant.find({ property: propertyId })
            .populate('ownerId', 'name email nationality emid contact') // Populate owner with specified fields
            .populate('property') // Populate property with all fields
            .populate('floorId', 'name') // Populate floor with only number
            .populate('unitId'); // Populate unit with only number

        res.status(200).json(tenants);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
tenantRouter.put('/updatestatus-for-admin/:id', isAuth, isAdmin, logTenantAction('Update Tenant Status'), async (req, res) => {
    try {
        const { status } = req.body;
        const tenantId = req.params.id;

        // Validate the status
        const validStatuses = ['Active', 'Case', 'Cancel'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        // Find the tenant by ID and update the status
        const updatedTenant = await Tenant.findByIdAndUpdate(
            tenantId,
            { status },
            { new: true }
        );

        if (!updatedTenant) {
            return res.status(404).json({ error: 'Tenant not found' });
        }

        // Send a success response
        res.status(200).json(updatedTenant);
    } catch (error) {
        // Handle errors
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


  ////For Report Genaration 
tenantRouter.post('/tenants-by-owner-for-admin', isAuth, isAdmin, async (req, res) => {
    const { ownerId } = req.body; // Get ownerId from request body
    try {
        const tenants = await Tenant.find({ ownerId })
            .populate('ownerId', 'name email nationality emid contact') // Populate owner with specified fields
            .populate('property') // Populate property with only name
            .populate('floorId', 'name') // Populate floor with only number
            .populate('unitId'); // Populate unit with only number

        res.status(200).json(tenants);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});



/////////owner Routes /////
tenantRouter.get('/tenants-by-ownerforowner/:ownerId', isAuth,  async (req, res) => {
    const ownerId = req.params.ownerId; // Get ownerId from URL parameter

    try {
        const tenants = await Tenant.find({ ownerId })
            .populate('ownerId', 'name email nationality emid contact') // Populate owner with specified fields
            .populate('property') // Populate property with only name
            .populate('floorId', 'name') // Populate floor with only number
            .populate('unitId'); // Populate unit with only number

        res.status(200).json(tenants);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
// Route to get all tenants of an owner by ownerId
tenantRouter.get('/tenants-by-ownerforowner/:ownerId', isAuth ,async (req, res) => {
    const ownerId = req.params.ownerId; // Get ownerId from URL parameter

    try {
        const tenants = await Tenant.find({ ownerId })
            .populate('ownerId', 'name email nationality emid contact') // Populate owner with specified fields
            .populate('property') // Populate property with only name
            .populate('floorId', 'name') // Populate floor with only number
            .populate('unitId'); // Populate unit with only number

        res.status(200).json(tenants);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
////// Route to get details of a single tenant by ID and populate by owner, apartments, floor, and units
tenantRouter.get('/tenantforowner/:id', isAuth , async (req, res) => {
    const tenantId = req.params.id; // Get tenant ID from URL parameter

    try {
        const tenant = await Tenant.findById(tenantId)
            .populate('ownerId', 'name email nationality emid contact') // Populate owner with only name
            .populate('property') // Populate property with only name
            .populate('floorId', 'name') // Populate floor with only number
            .populate('unitId'); // Populate unit with only number

        if (!tenant) {
            return res.status(404).json({ error: 'Tenant not found' });
        }

        res.status(200).json(tenant);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Export the router
export default tenantRouter;
