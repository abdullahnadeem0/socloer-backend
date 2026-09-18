// backend/routes/programRoutes.js
import express from 'express';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import {
    createProgram,
    getAllPrograms,
    getProgramById,
    updateProgram,
    deleteProgram,
    toggleActive,
    toggleFeatured,
    getProgramsByUniversity
} from '../controllers/programController.js';
import { protect } from '../middleware/auth.js';
import Agent from '../models/Agent.js';
import Admin from '../models/Admin.js';

const router = express.Router();

// ===== MULTER CONFIG =====
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPG, PNG, WEBP allowed.'));
        }
    }
});

// ============================================
// ⭐ CUSTOM MIDDLEWARE - Agent OR Admin
// ============================================
const agentOrAdmin = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'No token provided'
        });
    }

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || "your_jwt_secret_key_here"
        );

        // Try Agent first
        try {
            const agent = await Agent.findById(decoded.id)
                .select('-password -otp -otpExpiry');

            if (agent && agent.isActive && agent.isVerified) {
                req.agent = agent;
                console.log('✅ Auth: Agent', agent.email);
                return next();
            }
        } catch (e) {
            // Agent not found, try admin
        }

        // Try Admin
        try {
            const admin = await Admin.findById(decoded.id)
                .select('-password -otp -otpExpiry');

            if (admin) {
                req.admin = admin;
                console.log('✅ Auth: Admin', admin.email);
                return next();
            }
        } catch (e) {
            // Admin not found
        }

        return res.status(401).json({
            success: false,
            message: 'User not found'
        });

    } catch (error) {
        console.error('❌ Auth Error:', error.message);
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired token'
        });
    }
};

// ============================================
// ROUTES
// ============================================

// ⭐ Get programs by university - Agent + Admin dono
router.get('/university/:universityId', agentOrAdmin, getProgramsByUniversity);

// ============================================
// ADMIN ROUTES
// ============================================
router.post('/', protect, upload.single('banner'), createProgram);
router.get('/', protect, getAllPrograms);
router.get('/:id', protect, getProgramById);
router.put('/:id', protect, upload.single('banner'), updateProgram);
router.delete('/:id', protect, deleteProgram);

// Toggle routes
router.put('/:id/toggle-active', protect, toggleActive);
router.put('/:id/toggle-featured', protect, toggleFeatured);

export default router;