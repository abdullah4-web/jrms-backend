import express from 'express';
import Property from '../models/propertyModel.js';
import User from '../models/userModel.js'; // Assuming the user model is imported
import { isAuth, isSuperAdmin, isAdmin, isOwner } from '../utils.js';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import expressAsyncHandler from 'express-async-handler';
import Floor from '../models/floorModel.js';
import Unit from '../models/unitModel.js';
import { logPropertyAction } from '../middlewares/propertyActionMiddleware.js';
const propertyRouter = express.Router();

cloudinary.config({
    cloud_name: 'dn1oz4vt9',
    api_key: '376365558848471',
    api_secret: 'USb46ns9p4V7fAWMppTP54xiv00'
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
});

const upload = multer({ storage }).single('image');

const uploadToCloudinary = (req, res, next) => {
    upload(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            return res.status(400).send({ message: 'Invalid file format' });
        } else if (err) {
            return res.status(500).send({ message: 'Internal server error' });
        }
        next();
    });
};
//// Add Property 
propertyRouter.post('/addproperty', uploadToCloudinary, isAuth, isSuperAdmin, logPropertyAction('Add Property'), async (req, res) => {
    try {
        const {
            name,
            userId,
            cname,
            ccontact,
            cemail,
            address,
            contactinfo,
            status,
            propertyType,
            municipality,
            zone,
            sector,
            roadName,
            plotNo,
            plotAddress,
            onwaniAddress,
            propertyNo,
            propertyRegistrationNo,
            city,
            area,
            bondtype,
            bondno,
            bonddate,
            govermentalno,
            pilotno,
            buildingname,
            nameandstreet,
            propertytype,
            description,
            propertyno,
            joveracommission
        } = req.body;

        // Use the uploaded property image if available, otherwise use the default property image URL
        const propertyImage = req.file ? req.file.path : 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRMT5-ORb-nBTDd9b-kppjXDoS3QxTZNts_8SImhAmnT98A_kTK&s';

        const property = new Property({
            name,
            user: userId,
            cname,
            ccontact,
            cemail,
            address,
            contactinfo,
            propertyImage,
            status,
            propertyType,
            municipality,
            zone,
            sector,
            roadName,
            plotNo,
            plotAddress,
            onwaniAddress,
            propertyNo,
            propertyRegistrationNo,
            city,
            area,
            bondtype,
            bondno,
            bonddate,
            govermentalno,
            pilotno,
            buildingname,
            nameandstreet,
            propertytype,
            description,
            propertyno,
            joveracommission
        });

        const savedProperty = await property.save();

        res.status(201).json({ message: 'Property added successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});



////Add Floor
propertyRouter.post('/floor/:propertyId/addFloor', isAuth, isSuperAdmin, logPropertyAction('Add Floor'), async (req, res) => {
    try {
        const { propertyId } = req.params;
        const { name, units } = req.body;

        // Check if the property exists
        const property = await Property.findById(propertyId);
        if (!property) {
            return res.status(404).json({ error: 'Property not found' });
        }

        // Create the floor
        const floor = new Floor({
            name,
            units
        });

        // Save the floor
        await floor.save();

        // Add the floor to the property
        property.floors.push(floor);
        await property.save();

        res.status(201).json({ message: 'Floor added to property successfully', floor });
    } catch (error) {
        console.error('Error adding floor to property:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// API to Delete floor from the property 
propertyRouter.put('/floor/:propertyId/deleteFloor/:floorId', isAuth, isSuperAdmin, logPropertyAction('Delete Floor'), async (req, res) => {
    try {
        const { propertyId, floorId } = req.params;
        const { propertyName, floorName } = req.body;

        // Check if the property exists
        const property = await Property.findById(propertyId);
        if (!property) {
            return res.status(404).json({ error: 'Property not found' });
        }

        // Check if the floor exists in the property
        const floorIndex = property.floors.findIndex(floor => floor._id.toString() === floorId);
        if (floorIndex === -1) {
            return res.status(404).json({ error: 'Floor not found in the property' });
        }

        // Update the DelStatus of the floor
        property.floors[floorIndex].DelStatus = true;
        await property.save();

        // Optionally, you can also update the units associated with the floor

        // Send the property and floor names in the response
        res.status(200).json({ message: 'Floor marked as deleted from property successfully', propertyName, floorName });
    } catch (error) {
        console.error('Error marking floor as deleted from property:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// API endpoint to edit floor 
propertyRouter.put('/floor/:floorId', isAuth, isSuperAdmin, logPropertyAction('Edit Floor'), async (req, res) => {
    try {
        const { floorId } = req.params;
        const { name, units , DelStatus} = req.body;

        // Check if the floor exists
        const floor = await Floor.findById(floorId);
        if (!floor) {
            return res.status(404).json({ error: 'Floor not found' });
        }

        // Update floor details
        if (name) floor.name = name;
        if (units) floor.units = units;
        if (DelStatus) floor.DelStatus = DelStatus;


        await floor.save();

        res.status(200).json({ message: 'Floor updated successfully' });
    } catch (error) {
        console.error('Error updating floor:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// API endpoint to add a unit to a floor
propertyRouter.post('/:floorId/addUnit', isAuth, isSuperAdmin, logPropertyAction('Add Unit'), async (req, res) => {
    try {
        const { floorId } = req.params;
        const { type, occupied, premiseNo, unitRegNo, unitNo } = req.body;

        // Check if the floor exists
        const floor = await Floor.findById(floorId);
        if (!floor) {
            return res.status(404).json({ error: 'Floor not found' });
        }

        // Create the unit
        const unit = new Unit({
            type,
            occupied,
            premiseNo,
            unitRegNo,
            unitNo
        });

        // Save the unit
        await unit.save();

        // Add the unit to the floor
        floor.units.push(unit);
        await floor.save();

        res.status(201).json({ message: 'Unit added to floor successfully', unit });
    } catch (error) {
        console.error('Error adding unit to floor:', error); 
        res.status(500).json({ error: 'Internal server error' });
    }
});


//API To Delete unit 
propertyRouter.put('/:floorId/deleteUnit/:unitId', isAuth, isSuperAdmin, logPropertyAction('Delete Unit'), async (req, res) => {
    try {
        const { floorId, unitId } = req.params;
        console.log('Floor ID:', floorId);
        console.log('Unit ID:', unitId);

        // Check if the floor exists
        const floor = await Floor.findById(floorId);
        if (!floor) {
            console.error('Floor not found');
            return res.status(404).json({ error: 'Floor not found' });
        }

        // Check if the unit exists on the floor
        const unitIndex = floor.units.findIndex(unit => unit._id.toString() === unitId);
        if (unitIndex === -1) {
            console.error('Unit not found on the floor');
            return res.status(404).json({ error: 'Unit not found on the floor' });
        }

        // Update the DelStatus of the unit to true
        floor.units[unitIndex].DelStatus = true;
        await floor.save();

        console.log('Unit DelStatus updated successfully');
        return res.status(200).json({ message: 'Unit DelStatus updated successfully' });
    } catch (error) {
        console.error('Error updating unit DelStatus:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});


// Edit unit route
// Update the route handler
propertyRouter.put('/:floorId/editUnit/:unitId', isAuth, isSuperAdmin, logPropertyAction('Edit Unit'), async (req, res) => {
    try {
        const { floorId, unitId } = req.params;
        const { type, occupied, premiseNo, unitRegNo, unitNo, DelStatus } = req.body;

        // Check if the floor exists
        const floor = await Floor.findById(floorId);
        if (!floor) {
            console.error('Floor not found');
            return res.status(404).json({ error: 'Floor not found' });
        }

        // Find the unit by ID
        const unit = await Unit.findById(unitId);
        if (!unit) {
            console.error('Unit not found');
            return res.status(404).json({ error: 'Unit not found' });
        }

        // Update the unit fields with the provided values in the request body
        if (type) unit.type = type;
        if (occupied !== undefined) unit.occupied = occupied;
        if (premiseNo) unit.premiseNo = premiseNo;
        if (unitRegNo) unit.unitRegNo = unitRegNo;
        if (unitNo) unit.unitNo = unitNo;
        if (DelStatus !== undefined) unit.DelStatus = DelStatus;

        // Save the updated unit
        await unit.save();

        console.log('Unit edited successfully');
        return res.status(200).json({ message: 'Unit edited successfully' });
    } catch (error) {
        console.error('Error editing unit:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});



// Endpoint to get all properties (for superadmin) with user and floor details populated
propertyRouter.get('/allproperties', isAuth, isSuperAdmin, async (req, res) => {
    try {
        const properties = await Property.find()
            .populate('user', 'name email contact') // Populate user details
            .populate({
                path: 'floors', // Populate floors field
                populate: {
                    path: 'units' // Populate units field within each floor
                }
            });
        res.status(200).json(properties);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Endpoint to get all properties (for superadmin) with user and floor details populated
propertyRouter.get('/singleproperty/:propertyId?', isAuth, isSuperAdmin, async (req, res) => {
    try {
        const { propertyId } = req.params;
        if (propertyId) {
            const property = await Property.findById(propertyId)
                .populate('user', 'name email contact') // Populate user details
                .populate({
                    path: 'floors', // Populate floors field
                    populate: {
                        path: 'units' // Populate units field within each floor
                    }
                });
            if (!property) {
                return res.status(404).json({ error: 'Property not found' });
            }
            return res.status(200).json(property);
        } else {
            const properties = await Property.find()
                .populate('user', 'name email') // Populate user details
                .populate({
                    path: 'floors', // Populate floors field
                    populate: {
                        path: 'units' // Populate units field within each floor
                    }
                });
            return res.status(200).json(properties);
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});


propertyRouter.put(
    '/:id',
    isAuth,
    isSuperAdmin, 
    logPropertyAction('Update Property DelStatus'),
    expressAsyncHandler(async (req, res) => {
        try {
            const property = await Property.findById(req.params.id);

            if (!property) {
                return res.status(404).send({ message: 'Property not found' });
            }

            // Get the DelStatus from the request body
            const { DelStatus } = req.body;

            if (DelStatus === undefined) {
                return res.status(400).send({ message: 'DelStatus is required' });
            }

            // Update the DelStatus of the property
            property.DelStatus = DelStatus;
            await property.save();

            res.send({ message: 'Property DelStatus updated successfully', property });
        } catch (error) {
            console.error('Error updating property DelStatus:', error);
            res.status(500).send({ message: 'Error updating property DelStatus' });
        }
    })
);



// Endpoint to edit property (for Superadmin)
propertyRouter.put(
    '/edit/:id',
    uploadToCloudinary,
    isAuth,
    isSuperAdmin, logPropertyAction('Edit Property'),
    expressAsyncHandler(async (req, res) => {
        try {
            const { name, user, address, status, propertyType, contactinfo, cname, ccontact, cemail, municipality, zone, sector, roadName, plotNo, plotAddress, onwaniAddress, propertyNo, propertyRegistrationNo, city, area, joveracommission } = req.body;

            const property = await Property.findOne({ _id: req.params.id });

            if (!property) {
                return res.status(404).send({ message: 'Property not found' });
            }

            // Update the property details
            property.name = name;
            property.user = user;
            property.status = status;
            property.address = address;
            property.propertyType = propertyType;
            property.contactinfo = contactinfo;
            property.cname = cname;
            property.ccontact = ccontact;
            property.cemail = cemail;
            property.municipality = municipality;
            property.zone = zone;
            property.sector = sector;
            property.roadName = roadName;
            property.plotNo = plotNo;
            property.plotAddress = plotAddress;
            property.onwaniAddress = onwaniAddress;
            property.propertyNo = propertyNo;
            property.propertyRegistrationNo = propertyRegistrationNo;
            property.city = city;
            property.area = area;
            property.address = joveracommission;
            if (req.file) {
                // If a new image is uploaded, update the path
                property.propertyImage = req.file.path;
            }

            // Update other fields as needed
            property.status = status;
            property.propertyType = propertyType;
            property.contactinfo = contactinfo;

            const updatedProperty = await property.save();

            res.send(updatedProperty);

        } catch (error) {
            console.error('Error editing user:', error);
            res.status(500).send({ message: 'Error editing user' });
        }
    })
);

propertyRouter.post('/properties-by-user', isAuth, isSuperAdmin, async (req, res) => {
    const { userId } = req.body; // Get userId from request body

    try {
        // Find properties where the user ID matches
        const properties = await Property.find({ user: userId });

        res.status(200).json(properties);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});



////   Admin Property Routes //// 
////   Admin Property Routes //// 
////   Admin Property Routes //// 


propertyRouter.post('/addproperty-for-admin', uploadToCloudinary, isAuth, isAdmin, logPropertyAction('Add Property'), async (req, res) => {
    try {
        const {
            name,
            userId,
            cname,
            ccontact,
            cemail,
            address,
            contactinfo,
            status,
            propertyType,
            municipality,
            zone,
            sector,
            roadName,
            plotNo,
            plotAddress,
            onwaniAddress,
            propertyNo,
            propertyRegistrationNo,
            city,
            area,
            bondtype,
            bondno,
            bonddate,
            govermentalno,
            pilotno,
            buildingname,
            nameandstreet,
            propertytype,
            description,
            propertyno,
            joveracommission
        } = req.body;

        // Use the uploaded property image if available, otherwise use the default property image URL
        const propertyImage = req.file ? req.file.path : 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRMT5-ORb-nBTDd9b-kppjXDoS3QxTZNts_8SImhAmnT98A_kTK&s';

        const property = new Property({
            name,
            user: userId,
            cname,
            ccontact,
            cemail,
            address,
            contactinfo,
            propertyImage,
            status,
            propertyType,
            municipality,
            zone,
            sector,
            roadName,
            plotNo,
            plotAddress,
            onwaniAddress,
            propertyNo,
            propertyRegistrationNo,
            city,
            area,
            bondtype,
            bondno,
            bonddate,
            govermentalno,
            pilotno,
            buildingname,
            nameandstreet,
            propertytype,
            description,
            propertyno,
            joveracommission
        });

        const savedProperty = await property.save();

        res.status(201).json({ message: 'Property added successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


////Add Floor
propertyRouter.post('/floor/:propertyId/addFloor-for-admin', isAuth, isAdmin, logPropertyAction('Add Floor'), async (req, res) => {
    try {
        const { propertyId } = req.params;
        const { name, units } = req.body;

        // Check if the property exists
        const property = await Property.findById(propertyId);
        if (!property) {
            return res.status(404).json({ error: 'Property not found' });
        }

        // Create the floor
        const floor = new Floor({
            name,
            units
        });

        // Save the floor
        await floor.save();

        // Add the floor to the property
        property.floors.push(floor);
        await property.save();

        res.status(201).json({ message: 'Floor added to property successfully', floor });
    } catch (error) {
        console.error('Error adding floor to property:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});



// API endpoint to edit floor 
propertyRouter.put('/floor-for-admin/:floorId', isAuth, isAdmin, logPropertyAction('Edit Floor'), async (req, res) => {
    try {
        const { floorId } = req.params;
        const { name, units , DelStatus} = req.body;

        // Check if the floor exists
        const floor = await Floor.findById(floorId);
        if (!floor) {
            return res.status(404).json({ error: 'Floor not found' });
        }

        // Update floor details
        if (name) floor.name = name;
        if (units) floor.units = units;
        if (DelStatus) floor.DelStatus = DelStatus;


        await floor.save();

        res.status(200).json({ message: 'Floor updated successfully' });
    } catch (error) {
        console.error('Error updating floor:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// API endpoint to add a unit to a floor
propertyRouter.post('/:floorId/addUnit-for-admin', isAuth, isAdmin, logPropertyAction('Add Unit'), async (req, res) => {
    try {
        const { floorId } = req.params;
        const { type, occupied, premiseNo, unitRegNo, unitNo } = req.body;

        // Check if the floor exists
        const floor = await Floor.findById(floorId);
        if (!floor) {
            return res.status(404).json({ error: 'Floor not found' });
        }

        // Create the unit
        const unit = new Unit({
            type,
            occupied,
            premiseNo,
            unitRegNo,
            unitNo
        });

        // Save the unit
        await unit.save();

        // Add the unit to the floor
        floor.units.push(unit);
        await floor.save();

        res.status(201).json({ message: 'Unit added to floor successfully', unit });
    } catch (error) {
        console.error('Error adding unit to floor:', error); 
        res.status(500).json({ error: 'Internal server error' });
    }
});




// Edit unit route
// Update the route handler
propertyRouter.put('/:floorId/editUnit-for-admin/:unitId', isAuth, isAdmin, logPropertyAction('Edit Unit'), async (req, res) => {
    try {
        const { floorId, unitId } = req.params;
        const { type, occupied, premiseNo, unitRegNo, unitNo, DelStatus } = req.body;

        // Check if the floor exists
        const floor = await Floor.findById(floorId);
        if (!floor) {
            console.error('Floor not found');
            return res.status(404).json({ error: 'Floor not found' });
        }

        // Find the unit by ID
        const unit = await Unit.findById(unitId);
        if (!unit) {
            console.error('Unit not found');
            return res.status(404).json({ error: 'Unit not found' });
        }

        // Update the unit fields with the provided values in the request body
        if (type) unit.type = type;
        if (occupied !== undefined) unit.occupied = occupied;
        if (premiseNo) unit.premiseNo = premiseNo;
        if (unitRegNo) unit.unitRegNo = unitRegNo;
        if (unitNo) unit.unitNo = unitNo;
        if (DelStatus !== undefined) unit.DelStatus = DelStatus;

        // Save the updated unit
        await unit.save();

        console.log('Unit edited successfully');
        return res.status(200).json({ message: 'Unit edited successfully' });
    } catch (error) {
        console.error('Error editing unit:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});



// Endpoint to get all properties (for superadmin) with user and floor details populated
propertyRouter.get('/allproperties-for-admin', isAuth, isAdmin, async (req, res) => {
    try {
        const properties = await Property.find()
            .populate('user', 'name email contact') // Populate user details
            .populate({
                path: 'floors', // Populate floors field
                populate: {
                    path: 'units' // Populate units field within each floor
                }
            });
        res.status(200).json(properties);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Endpoint to get all properties (for superadmin) with user and floor details populated
propertyRouter.get('/singleproperty-for-admin/:propertyId?', isAuth, isAdmin, async (req, res) => {
    try {
        const { propertyId } = req.params;
        if (propertyId) {
            const property = await Property.findById(propertyId)
                .populate('user', 'name email contact') // Populate user details
                .populate({
                    path: 'floors', // Populate floors field
                    populate: {
                        path: 'units' // Populate units field within each floor
                    }
                });
            if (!property) {
                return res.status(404).json({ error: 'Property not found' });
            }
            return res.status(200).json(property);
        } else {
            const properties = await Property.find()
                .populate('user', 'name email') // Populate user details
                .populate({
                    path: 'floors', // Populate floors field
                    populate: {
                        path: 'units' // Populate units field within each floor
                    }
                });
            return res.status(200).json(properties);
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// Endpoint to edit property 
propertyRouter.put(
    '/edit-for-admin/:id',
    uploadToCloudinary,
    isAuth,
    isAdmin, logPropertyAction('Edit Property'),
    expressAsyncHandler(async (req, res) => {
        try {
            const { name, user, address, status, propertyType, contactinfo, cname, ccontact, cemail, municipality, zone, sector, roadName, plotNo, plotAddress, onwaniAddress, propertyNo, propertyRegistrationNo, city, area, joveracommission } = req.body;

            const property = await Property.findOne({ _id: req.params.id });

            if (!property) {
                return res.status(404).send({ message: 'Property not found' });
            }

            // Update the property details
            property.name = name;
            property.user = user;
            property.status = status;
            property.address = address;
            property.propertyType = propertyType;
            property.contactinfo = contactinfo;
            property.cname = cname;
            property.ccontact = ccontact;
            property.cemail = cemail;
            property.municipality = municipality;
            property.zone = zone;
            property.sector = sector;
            property.roadName = roadName;
            property.plotNo = plotNo;
            property.plotAddress = plotAddress;
            property.onwaniAddress = onwaniAddress;
            property.propertyNo = propertyNo;
            property.propertyRegistrationNo = propertyRegistrationNo;
            property.city = city;
            property.area = area;
            property.address = joveracommission;
            if (req.file) {
                // If a new image is uploaded, update the path
                property.propertyImage = req.file.path;
            }

            // Update other fields as needed
            property.status = status;
            property.propertyType = propertyType;
            property.contactinfo = contactinfo;

            const updatedProperty = await property.save();

            res.send(updatedProperty);

        } catch (error) {
            console.error('Error editing user:', error);
            res.status(500).send({ message: 'Error editing user' });
        }
    })
);

propertyRouter.post('/properties-by-user-for-admin', isAuth, isAdmin, async (req, res) => {
    const { userId } = req.body; // Get userId from request body

    try {
        // Find properties where the user ID matches
        const properties = await Property.find({ user: userId });

        res.status(200).json(properties);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


////   Owner Property Routes //// 
////   Owner Property Routes //// 
////   Owner Property Routes //// 
propertyRouter.get('/myproperties', isAuth, isOwner, async (req, res) => {
    try {
        // Retrieve properties for the current user and populate the 'floors' field
        const properties = await Property.find({ user: req.user._id })
            .populate({
                path: 'floors',
                populate: { path: 'units' } // Populate the 'units' field within each 'floor' document
            });
        res.status(200).json(properties);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Endpoint to get all properties (for owner) with user and floor details populated
propertyRouter.get('/singlepropertyforowners/:propertyId?', isAuth, async (req, res) => {
    try {
        const { propertyId } = req.params;
        if (propertyId) {
            const property = await Property.findById(propertyId)
                .populate('user', 'name email contact') // Populate user details
                .populate({
                    path: 'floors', // Populate floors field
                    populate: {
                        path: 'units' // Populate units field within each floor
                    }
                });
            if (!property) {
                return res.status(404).json({ error: 'Property not found' });
            }
            return res.status(200).json(property);
        } else {
            const properties = await Property.find()
                .populate('user', 'name email') // Populate user details
                .populate({
                    path: 'floors', // Populate floors field
                    populate: {
                        path: 'units' // Populate units field within each floor
                    }
                });
            return res.status(200).json(properties);
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});




export default propertyRouter;


