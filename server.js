
const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const cors = require('cors');
const path = require('path');

const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");


// Load environment variables
dotenv.config();

// Connect to the database
connectDB();

// Initialize Express app
const app = express();

// Middleware
// app.use(cors()); // Enable CORS for all routes

// app.use(cors({
//   origin: 'http://localhost:5173',  // Frontend URL
//   credentials: true
// }));

const allowedOrigins = [
  "http://localhost:5173",
  "https://procureqa.netlify.app"
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (e.g., mobile apps, curl)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);


app.use(express.json()); // Parse JSON bodies

// Load swagger.yml
const swaggerDocument = YAML.load(path.join(__dirname, "swagger.yml"));
// Route for Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));


// API Routes
app.use('/api/admin/products', require('./routes/productRoutes')); // Product management routes
app.use('/api/admin/suppliers', require('./routes/supplierRoutes')); // Supplier management routes
app.use('/api/admin', require('./routes/userRoutes')); // User management routes
app.use('/api/admin/cat', require('./routes/categoryRoutes')); // Category management routes (admin)
app.use('/api/admin/sub', require('./routes/subcategoryRoutes')); // Subcategory management routes (admin)
app.use('/api/category', require('./routes/categoryRoutes')); // Public category routes
app.use('/api/suppliers', require('./routes/supplierRoutes')); // Public supplier routes
app.use('/api/', require('./routes/searchRoutes')); // Search routes (alternative path)
app.use('/api/admin/clients', require('./routes/clientRoutes')); // Client management routes
app.use('/api/admin/clientHistory', require('./routes/clientHistoryRoutes')); // Client history routes
app.use('/api/home', require('./routes/bannerRoutes')); // Banner routes for home page

// Serve static files from images directory and subfolders
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/images', express.static(path.join(__dirname, 'images', 'cmpLogos')));
app.use('/images', express.static(path.join(__dirname, 'images', 'bannerImage')));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
 console.log("Swagger Docs → http://localhost:5000/api-docs");
module.exports = app;
