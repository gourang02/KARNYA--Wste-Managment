const jwt = require('jsonwebtoken');
const dbs = require('../../database/db');

// Authentication middleware
exports.authenticate = (req, res, next) => {
    try {
        // Get token from header
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ message: 'No token, authorization denied' });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'karnya_secret_key');
        
        // Find user by ID
        dbs.users.findOne({ _id: decoded.user.id }, (err, user) => {
            if (err || !user) {
                return res.status(401).json({ message: 'Token is not valid' });
            }
            
            // Add user to request object
            req.user = user;
            next();
        });
    } catch (err) {
        console.error('Authentication error:', err);
        res.status(401).json({ message: 'Token is not valid' });
    }
};

// Role-based authorization middleware
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                message: `User role ${req.user.role} is not authorized to access this route` 
            });
        }
        next();
    };
};
