const jwt = require('jsonwebtoken');

// Middleware to protect routes with Access Tokens
exports.protect = async (req, res, next) => {
  let token;
  
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
  }

  try {
    // ลองใช้ Supabase auth ก่อน
    const supabase = req.app.get('supabase');
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (!error && user) {
      req.user = user;
      req.user.sub = user.id;
      req.user.role = user.user_metadata?.role || 'admin';
      return next();
    }
    
    // Fallback: ลองใช้ JWT ที่เราสร้างเองด้วย JWT_SECRET
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_key_here_change_in_production');
    req.user = decoded;
    req.user.role = decoded.role || 'admin';
    return next();
    
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token is invalid or expired' });
  }
};


// Middleware to handle Role-Based Access Control (RBAC)
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};
