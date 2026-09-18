// backend/routes/paymentRoutes.js
import express from 'express';
import {
    createPayment,
    getAllPayments,
    getPaymentById,
    updatePayment,
    deletePayment,
    getPaymentStats,
    getAgentPaymentSummary,
    getDailyReport
} from '../controllers/paymentController.js';
import { protect as adminProtect } from '../middleware/auth.js';

const router = express.Router();

// ============================================
// PAYMENT ROUTES
// ============================================

// Stats & Reports (specific first)
router.get('/stats', adminProtect, getPaymentStats);
router.get('/daily-report', adminProtect, getDailyReport);
router.get('/agent/:agentId/summary', adminProtect, getAgentPaymentSummary);

// CRUD
router.post('/', adminProtect, createPayment);
router.get('/', adminProtect, getAllPayments);
router.get('/:id', adminProtect, getPaymentById);
router.put('/:id', adminProtect, updatePayment);
router.delete('/:id', adminProtect, deletePayment);

export default router;