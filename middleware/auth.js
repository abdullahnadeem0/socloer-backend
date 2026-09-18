import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";
import Agent from "../models/Agent.js";

// ============================================
// 1. ADMIN AUTHENTICATION MIDDLEWARE
// ============================================
export const protect = async (req, res, next) => {
    let token;

    // Check if token exists in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];
            
            // Verify token
            const decoded = jwt.verify(
                token, 
                process.env.JWT_SECRET || "your_jwt_secret_key_here"
            );
            
            // Get admin from database (excluding password)
            const admin = await Admin.findById(decoded.id).select('-password -otp -otpExpiry');
            
            if (!admin) {
                return res.status(401).json({
                    success: false,
                    message: 'Admin not found'
                });
            }
            
            // Attach admin to request
            req.admin = admin;
            next();
            
        } catch (error) {
            console.error('❌ Admin Auth Error:', error);
            
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: 'Token expired. Please login again.'
                });
            }
            
            return res.status(401).json({
                success: false,
                message: 'Not authorized, token failed'
            });
        }
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized, no token provided'
        });
    }
};

// ============================================
// 2. AGENT AUTHENTICATION MIDDLEWARE
// ============================================
export const protectAgent = async (req, res, next) => {
    let token;

    // Check if token exists in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];
            
            // Verify token
            const decoded = jwt.verify(
                token, 
                process.env.JWT_SECRET || "your_jwt_secret_key_here"
            );
            
            // Get agent from database (excluding password)
            const agent = await Agent.findById(decoded.id)
                .select('-password -otp -otpExpiry -resetToken -resetTokenExpiry');
            
            if (!agent) {
                return res.status(401).json({
                    success: false,
                    message: 'Agent not found'
                });
            }
            
            // Check if agent is active
            if (!agent.isActive) {
                return res.status(401).json({
                    success: false,
                    message: 'Account is deactivated. Please contact support.'
                });
            }
            
            // Check if agent is verified
            if (!agent.isVerified) {
                return res.status(401).json({
                    success: false,
                    message: 'Account not verified. Please verify your email first.'
                });
            }
            
            // Attach agent to request
            req.agent = agent;
            next();
            
        } catch (error) {
            console.error('❌ Agent Auth Error:', error);
            
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: 'Token expired. Please login again.'
                });
            }
            
            return res.status(401).json({
                success: false,
                message: 'Not authorized, token failed'
            });
        }
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized, no token provided'
        });
    }
};

// ============================================
// 3. AUTHENTICATE TOKEN (Original)
// ============================================
export const authenticateToken = (req, res, next) => {
    // Get token from header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Access denied. No token provided."
        });
    }

    try {
        // Verify token
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || "your_jwt_secret_key_here"
        );
        
        // Attach admin info to request
        req.admin = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(403).json({
                success: false,
                message: "Token has expired. Please sign in again."
            });
        }
        return res.status(403).json({
            success: false,
            message: "Invalid token."
        });
    }
};

// ============================================
// 4. SUPER ADMIN MIDDLEWARE
// ============================================
export const isSuperAdmin = (req, res, next) => {
    if (req.admin && req.admin.role === 'super_admin') {
        next();
    } else {
        return res.status(403).json({
            success: false,
            message: "Access denied. Super admin privileges required."
        });
    }
};

// ============================================
// 5. ADMIN MIDDLEWARE
// ============================================
export const isAdmin = (req, res, next) => {
    if (req.admin && (req.admin.role === 'admin' || req.admin.role === 'super_admin')) {
        next();
    } else {
        return res.status(403).json({
            success: false,
            message: "Access denied. Admin privileges required."
        });
    }
};

// ============================================
// 6. OPTIONAL: CHECK OWNER OR ADMIN
// ============================================
export const isOwnerOrAdmin = (req, res, next) => {
    const userId = req.params.id || req.body.userId;
    
    if (req.admin && (req.admin.role === 'super_admin' || req.admin.role === 'admin')) {
        next();
    } else if (req.admin && req.admin.id === userId) {
        next();
    } else {
        return res.status(403).json({
            success: false,
            message: "Access denied. You can only access your own data."
        });
    }
};

// ============================================
// 7. OPTIONAL: CHECK AGENT OR ADMIN
// ============================================
export const isAgentOrAdmin = (req, res, next) => {
    if (req.agent || (req.admin && (req.admin.role === 'admin' || req.admin.role === 'super_admin'))) {
        next();
    } else {
        return res.status(403).json({
            success: false,
            message: "Access denied. Agent or admin privileges required."
        });
    }
};

// ============================================
// 8. OPTIONAL: MULTI-ROLE AUTH
// ============================================
export const authenticate = (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(
                token, 
                process.env.JWT_SECRET || "your_jwt_secret_key_here"
            );
            
            // Check if user is admin
            const admin = Admin.findById(decoded.id);
            if (admin) {
                req.admin = decoded;
                req.userType = 'admin';
                return next();
            }
            
            // Check if user is agent
            const agent = Agent.findById(decoded.id);
            if (agent) {
                req.agent = decoded;
                req.userType = 'agent';
                return next();
            }
            
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
            
        } catch (error) {
            console.error('❌ Auth Error:', error);
            return res.status(401).json({
                success: false,
                message: 'Not authorized, token failed'
            });
        }
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized, no token'
        });
    }
};