const isAdmin = (req, res, next) => {
  try {
    console.log('Checking admin access, user:', req.user);
    
    if (!req.user) {
      console.log('No user object found in request');
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Check role from token payload
    if (req.user.role !== 'admin') {
      console.log('User role is not admin:', req.user.role);
      return res.status(403).json({ message: 'Admin access required' });
    }

    console.log('Admin access granted');
    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { isAdmin }; 