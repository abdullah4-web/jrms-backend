// Import required modules and dependencies
import express from 'express';
import bcrypt from 'bcryptjs';
import expressAsyncHandler from 'express-async-handler';
import User from '../models/userModel.js';
import { isAdmin, isSuperAdmin, isOwner, isAuth, generateToken } from '../utils.js';
import multer from 'multer';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';


cloudinary.config({
    cloud_name: 'dn1oz4vt9',
    api_key: '376365558848471',
    api_secret: 'USb46ns9p4V7fAWMppTP54xiv00'
});
const userRouter = express.Router();

// Use CloudinaryStorage to configure multer for image upload
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
});

const upload = multer({ storage });

// Middleware for Cloudinary image upload
const uploadToCloudinary = upload.single('picture');


userRouter.post(
    '/register',
    uploadToCloudinary, 
    expressAsyncHandler(async (req, res) => {
      const { name, email, password, role, contact, othercontact, address, nationality, emid } = req.body;
  
      // Use the uploaded picture if available, otherwise use the default picture URL
      const picture = req.file ? req.file.path : 'https://cdn-icons-png.freepik.com/512/18/18148.png';
      const hashedPassword = bcrypt.hashSync(password, 8);
  
      try {
        // Check if a user with the given emid already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          return res.status(400).send({ message: 'User with the provided Email already exists' });
        }
       
  
        // Create a new user if emid is unique
        const newUser = new User({
          name,
          email,
          password: hashedPassword,
          picture,
          role,
          contact,
          othercontact,
          address,
          nationality,
          emid,
        });
  
        const user = await newUser.save();
  
        res.status(201).send({
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          picture: user.picture,
          contact: user.contact,
          othercontact: user.othercontact,
          address: user.address,
          nationality: user.nationality,
          emid: user.emid,
          token: generateToken(user),
        });
      } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).send({ message: 'Error registering user' });
      }
    })
  );
  



userRouter.put(
    '/profile',
    isAuth,
    uploadToCloudinary,
    expressAsyncHandler(async (req, res) => {
        try {
            const user = await User.findById(req.user._id);
            if (!user) {
                return res.status(404).send({ message: 'User not found' });
            }

            const updateData = {
                name: req.body.name,
                email: req.body.email,
            };

            if (req.body.password) {
                // If newPassword is provided, update the password
                updateData.password = bcrypt.hashSync(req.body.password, 8);
            }

            if (req.file && req.file.path) {
                // If a new picture was uploaded to Cloudinary, update the picture
                updateData.picture = req.file.path;
            }

            const updatedUser = await User.findByIdAndUpdate(
                req.user._id,
                updateData,
                { new: true }
            );

            if (updatedUser) {
                res.status(200).send(updatedUser);
            } else {
                res.status(500).send({ message: 'Error updating user profile' });
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            res.status(500).send({ message: 'Error updating user profile' });
        }
    })
);
userRouter.put(
    '/delete/:id',  
    isAuth,
    isSuperAdmin,
    expressAsyncHandler(async (req, res) => {
        try {
            const user = await User.findOne({ _id: req.params.id });

            if (!user) {
                return res.status(404).send({ message: 'User not found' });
            }

            if (user.isAdmin) {
                return res.status(400).send({ message: 'Cannot delete an admin user' });
            }

            if (req.body.DelStatus === undefined) {
                return res.status(400).send({ message: 'DelStatus is required' });
            }

            user.DelStatus = req.body.DelStatus;
            await user.save();
            
            res.send({ message: 'User status updated successfully' });
        } catch (error) {
            console.error('Error updating user status:', error);
            res.status(500).send({ message: 'Error updating user status' });
        }
    })
);


userRouter.post(
    '/forgot-password',
    expressAsyncHandler(async (req, res) => {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).send({ message: 'User not found' });
        }

        // Generate a random 6-digit OTP
        const otp = crypto.randomBytes(3).toString('hex');

        // Set OTP and expiration time in the user document
        user.otp = otp;
        user.otpExpiration = Date.now() + 720 * 60 * 1000; // OTP expires in 12 hours
        await user.save();

        // Send OTP to the user's email
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Password Reset OTP',
            html: `
                        <html>
                        <head>
                        </head>
                        <body>
                        <div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
                    <div style="margin:50px auto;width:70%;padding:20px 0">
                        <div style="border-bottom:1px solid #eee">
                        <a href="" style="font-size:1.4em;color: #00466a;text-decoration:none;font-weight:600">Jovera Groups</a>
                        </div>
                        <p style="font-size:1.1em">Hi,</p>
                        <p>Thank you for choosing Jovera Groups  Use the following OTP to complete your Sign Up procedures. OTP is valid for 2 hours</p>
                        <h2 style="background: #00466a;margin: 0 auto;width: max-content;padding: 0 10px;color: #fff;border-radius: 4px;">${otp}</h2>
                        <p style="font-size:0.9em;">Regards,<br />Your Brand</p>
                        <hr style="border:none;border-top:1px solid #eee" />
                        <div style="float:right;padding:8px 0;color:#aaa;font-size:0.8em;line-height:1;font-weight:300">
                        <p>Jovera Groups </p>
                        <p>Abu Dhabi </p>
                        <p>UAE</p>
                        </div>
                    </div>
                    </div>
                        </body>
                        </html>
  `,
        };

        await transporter.sendMail(mailOptions);

        res.send({ message: 'OTP sent successfully' });
    })
);



userRouter.post(
    '/verify-otp',
    expressAsyncHandler(async (req, res) => {
        const { email, otp } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).send({ message: 'User not found' });
        }

        if (user.otp !== otp) {
            return res.status(400).send({ message: 'Incorrect OTP. Please try again.' });
        }

        if (user.otpExpiration < Date.now()) {
            return res.status(400).send({ message: 'OTP has expired. Please request a new OTP.' });
        }

        // If all checks pass, OTP is valid
        res.send({ message: 'OTP verification successful', email: user.email });
    })
);


// Password reset route
userRouter.post(
    '/reset-password',
    expressAsyncHandler(async (req, res) => {
        const { email, newPassword } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).send({ message: 'User not found' });
        }

        // Reset the password without OTP verification
        user.password = bcrypt.hashSync(newPassword, 8);
        user.otp = undefined;
        user.otpExpiration = undefined;
        await user.save();

        res.send({ message: 'Password reset successfully' });
    })
);
userRouter.get(
    '/allusers',
    isAuth,
    isSuperAdmin,
    expressAsyncHandler(async (req, res) => {
        const users = await User.find({});
        res.send(users);
    })
);


userRouter.put(
    '/edit-pass/:id',
    isAuth,
    isSuperAdmin,
    expressAsyncHandler(async (req, res) => {
        try {
            const userId = req.params.id;
            const { newPassword } = req.body;

            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).send({ message: 'User not found' });
            }

            // If newPassword is provided, hash and update password
            if (newPassword) {
                const hashedPassword = bcrypt.hashSync(newPassword, 8);
                user.password = hashedPassword;
            }

            // Save the updated user
            const updatedUser = await user.save();

            res.status(200).send(updatedUser);
        } catch (error) {
            console.error('Error editing user:', error);
            res.status(500).send({ message: 'Error editing user' });
        }
    })
);
userRouter.put(
    '/edit-user/:id',
    isAuth,
    isSuperAdmin,
    expressAsyncHandler(async (req, res) => {
        try {
            const userId = req.params.id;
            const { name, email, role, contact, othercontact, address, nationality } = req.body;

            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).send({ message: 'User not found' });
            }

            user.name = name;
            user.email = email;
            user.role = role;
            user.contact = contact;
            user.othercontact = othercontact;
            user.address = address;
            user.nationality = nationality;

            const updatedUser = await user.save();

            res.status(200).send(updatedUser);
        } catch (error) {
            console.error('Error editing user:', error);
            res.status(500).send({ message: 'Error editing user' });
        }
    })
);


// Modify login route to handle both traditional login and OAuth login
userRouter.post(
    '/login',
    expressAsyncHandler(async (req, res) => {
        const { email, password } = req.body;

        try {
            // Handle traditional login as before
            const user = await User.findOne({ email });

            if (user && bcrypt.compareSync(password, user.password)) {
                return res.send({
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    picture: user.picture,
                    role: user.role,
                    token: generateToken(user),
                });
            } else {
                return res.status(401).send({ message: 'Invalid email or password' });
            }
        } catch (error) {
            console.error('Error logging in:', error);
            return res.status(500).send({ message: 'Error logging in' });
        }
    })
);

userRouter.get(
    '/all-owners',
    isAuth,
    isSuperAdmin,
    expressAsyncHandler(async (req, res) => {
        try {
            const owners = await User.find({ role: 'owner' }).select('-password');
            res.send(owners);
        } catch (error) {
            console.error('Error fetching owners:', error);
            res.status(500).send({ message: 'Error fetching owners' });
        }
    })
);



////////Admin Routes /////////
////////Admin Routes /////////
////////Admin Routes /////////

userRouter.post(
    '/register-for-admin',
    uploadToCloudinary, isAuth, isAdmin,
    expressAsyncHandler(async (req, res) => {
      const { name, email, password, role, contact, othercontact, address, nationality, emid } = req.body;
  
      
     
      const picture = req.file ? req.file.path : 'https://cdn-icons-png.freepik.com/512/18/18148.png';
      const hashedPassword = bcrypt.hashSync(password, 8);
  
      try {
        // Check if a user with the given emid already exists
        const existingUser = await User.findOne({ emid });
        if (existingUser) {
          return res.status(400).send({ message: 'User with the provided emid already exists' });
        }

        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
          return res.status(400).send({ message: 'User with the provided Email already exists' });
        }
  
        // Create a new user if emid is unique
        const newUser = new User({
          name,
          email,
          password: hashedPassword,
          picture,
          role,
          contact,
          othercontact,
          address,
          nationality,
          emid,
        });
  
        const user = await newUser.save();
  
        res.status(201).send({
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          picture: user.picture,
          contact: user.contact,
          othercontact: user.othercontact,
          address: user.address,
          nationality: user.nationality,
          emid: user.emid,
          token: generateToken(user),
        });
      } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).send({ message: 'Error registering user' });
      }
    })
  );

userRouter.get(
    '/allusers-for-admin',
    isAuth,
    isAdmin,
    expressAsyncHandler(async (req, res) => {
        const users = await User.find({});
        res.send(users);
    })
);

userRouter.get(
    '/all-owners-for-admin',
    isAuth,
    isAdmin,
    expressAsyncHandler(async (req, res) => {
        try {
            const owners = await User.find({ role: 'owner' }).select('-password');
            res.send(owners);
        } catch (error) {
            console.error('Error fetching owners:', error);
            res.status(500).send({ message: 'Error fetching owners' });
        }
    })
);


export default userRouter;