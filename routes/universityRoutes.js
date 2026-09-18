import express from 'express';
import multer from 'multer';
import {
    createUniversity,
    getAllUniversities,
    getUniversityById,
    updateUniversity,
    deleteUniversity,
    toggleActiveStatus,
    toggleVerifiedStatus
} from '../controllers/universityController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// ===== MULTER CONFIG =====
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/svg+xml'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPG, PNG, SVG are allowed.'));
        }
    }
});

// ============================================
// ALL ROUTES PROTECTED (ADMIN ONLY)
// ============================================

// Create university with logo upload
router.post('/', protect, upload.single('logo'), createUniversity);

// Get all universities
router.get('/', protect, getAllUniversities);

// Get university by ID
router.get('/:id', protect, getUniversityById);

// Update university
router.put('/:id', protect, upload.single('logo'), updateUniversity);

// Delete university
router.delete('/:id', protect, deleteUniversity);

// Toggle active status
router.put('/:id/toggle-active', protect, toggleActiveStatus);

// Toggle verified status
router.put('/:id/toggle-verified', protect, toggleVerifiedStatus);

export default router;