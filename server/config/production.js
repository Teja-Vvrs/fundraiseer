module.exports = {
  // MongoDB connection (use environment variable in production)
  mongoURI: process.env.MONGODB_URI,
  
  // JWT configuration
  jwtSecret: process.env.JWT_SECRET,
  jwtExpire: '7d',
  
  // Server configuration
  port: process.env.PORT || 5000,
  
  // Email configuration
  email: {
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  
  // Frontend URL for CORS
  clientURL: process.env.CLIENT_URL || 'http://localhost:3000',
  
  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  }
}; 