// backend/routes/agentPaymentRoutes.js
import express from 'express';
import {
    getMyPayments,
    getMyPaymentStats,
    getMyPaymentById,
    getMyMonthlySummary
} from '../controllers/agentPaymentController.js';
import { protectAgent } from '../middleware/auth.js';

const router = express.Router();

// Stats first (specific)
router.get('/stats', protectAgent, getMyPaymentStats);
router.get('/monthly-summary', protectAgent, getMyMonthlySummary);

// CRUD
router.get('/', protectAgent, getMyPayments);
router.get('/:id', protectAgent, getMyPaymentById);

export default router;