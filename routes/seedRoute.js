// // userRoutes.js

// import express from 'express';
// import User from '../models/userModel.js';

// const router = express.Router();

// // Route to add seed data to the database
// router.post('/seed', async (req, res) => {
//   try {
//     // Insert seed data into the database
//     const insertedUsers = await User.insertMany(userData);
//     res.status(201).json({ message: 'Seed data inserted successfully', data: insertedUsers });
//   } catch (error) {
//     res.status(500).json({ message: 'Failed to insert seed data', error: error.message });
//   }
// });

// // Route to add a single user to the database
// router.post('/', async (req, res) => {
//   try {
//     const { name, email, password, role, picture, contact, othercontact, address, nationality, emid } = req.body;
    
//     // Create a new user object
//     const newUser = new User({
//       name,
//       email,
//       password,
//       role,
//       picture,
//       contact,
//       othercontact,
//       address,
//       nationality,
//       emid,
//     });

//     // Save the user to the database
//     const savedUser = await newUser.save();

//     res.status(201).json({ message: 'User added successfully', data: savedUser });
//   } catch (error) {
//     res.status(500).json({ message: 'Failed to add user', error: error.message });
//   }
// });

// export default router;
