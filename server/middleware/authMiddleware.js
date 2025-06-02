const jwt = require('jsonwebtoken');

  const authMiddleware = (req, res, next) => {
  const authHeader = req.header('Authorization');
  const token = authHeader && authHeader.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Attach userId and role (and whatever else you put in the token) to req
    req.user = { userId: decoded.userId, role: decoded.role }; // Ensure these match your JWT payload
    next();
  } catch (error) {
    console.error('Token verification failed:', error.message);
    res.status(401).json({ message: 'Invalid token' });
  }
};

   const adminMiddleware = (req, res, next) => {
     if (req.user.role !== 'admin') {
       return res.status(403).json({ message: 'Admin access required' });
     }
     next();
   };

   module.exports = { authMiddleware, adminMiddleware };