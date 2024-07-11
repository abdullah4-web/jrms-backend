import express from "express";
import morgan from "morgan";
import cors from "cors";
import colors from "colors";
import dotenv from "dotenv";
import path from "path";
import connectDB from "./config/db.js";
import userRouter from "./routes/userRoutes.js";
import propertyRouter from "./routes/propertyRoutes.js";
import tenantRouter from "./routes/tenantRoutes.js";
import maintenanceRouter from "./routes/maintenanceRoutes.js";
import administrationfeeRouter from "./routes/administrationfeesRoutes.js";
import adminActionRouter from "./routes/adminActionRouter.js";
import tenantActionsRouter from './routes/tenantActionsRouter.js'
// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Create an Express app
const app = express();

// Middleware setup
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));


// Set port
const PORT = process.env.PORT || 8080;



// API routes
app.get('/', (req, res) => {
  res.json({ message: "API is working" });
});
app.use('/api/users', userRouter);
app.use('/api/properties', propertyRouter);
app.use('/api/tenants', tenantRouter);
app.use('/api/maintenance', maintenanceRouter);
app.use('/api/adminstrationfees', administrationfeeRouter);
app.use('/api/adminActions', adminActionRouter);
app.use('/api', tenantActionsRouter);


// // Serve static assets if in production
// if (process.env.NODE_ENV === 'production') {
//   const __dirname = path.resolve();
//   app.use(express.static(path.join(__dirname, '../client/build')));
//   app.get('*', (req, res) => {
//     res.sendFile(path.join(__dirname, '../client/build/index.html'));
//   });
// }


// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});