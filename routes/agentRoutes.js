import express from 'express';
import multer from 'multer';
import {
    signUp,
    verifyOTP,
    resendOTP,
    login,
    getProfile,
    updateProfile,
    changePassword
} from '../controllers/agentController.js';
import { protectAgent } from '../middleware/auth.js';

const router = express.Router();

// ===== MULTER CONFIG =====
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPG, PNG and PDF are allowed.'));
        }
    }
});

// ============================================
// PUBLIC ROUTES
// ============================================
router.post('/signup', upload.single('idFile'), signUp);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.post('/login', login);

// ============================================
// AGENT PROTECTED ROUTES
// ============================================
router.get('/profile', protectAgent, getProfile);
router.put('/:id', protectAgent, updateProfile);
router.put('/:id/change-password', protectAgent, changePassword);

export default router;