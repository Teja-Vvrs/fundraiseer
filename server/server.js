require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const { errorHandler } = require('./middleware/error');
const fs = require('fs').promises;

// Route imports
const adminRoutes = require('./routes/adminRoutes');
const authRoutes = require('./routes/authRoutes');
const campaignRoutes = require('./routes/campaignRoutes');
const userRoutes = require('./routes/users');
const contactRoutes = require('./routes/contact');
const dashboardRoutes = require('./routes/dashboardRoutes');
const donationRoutes = require('./routes/donationRoutes');

const app = express();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
const avatarsDir = path.join(uploadsDir, 'avatars');
const campaignsDir = path.join(uploadsDir, 'campaigns');
const documentsDir = path.join(uploadsDir, 'documents');

(async () => {
  try {
    await fs.mkdir(avatarsDir, { recursive: true });
    await fs.mkdir(campaignsDir, { recursive: true });
    await fs.mkdir(documentsDir, { recursive: true });
    console.log('Uploads directories created/verified:', {
      uploadsDir,
      avatarsDir,
      campaignsDir,
      documentsDir
    });
  } catch (error) {
    console.error('Error creating uploads directory:', error);
  }
})();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Debug middleware for all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, {
    headers: req.headers,
    body: req.body,
    query: req.query
  });
  next();
});

// Serve static files from uploads directory with proper URL path
const staticPath = path.join(__dirname, 'uploads');
console.log('Setting up static file serving from:', staticPath);
app.use('/api/uploads', express.static(staticPath));

// Additional debug middleware for static file requests
app.use('/api/uploads', (req, res, next) => {
  console.log('Static file request:', {
    originalUrl: req.originalUrl,
    path: req.path,
    physicalPath: path.join(staticPath, req.path)
  });
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/donations', donationRoutes);

// Error handler
app.use(errorHandler);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});