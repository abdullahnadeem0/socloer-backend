// backend/routes/adminRoutes.js
import express from 'express';
import {
    signUp,
    verifySignUpOTP,
    resendOTP,
    signIn,
    verifyLoginOTP,
    getCurrentAdmin,
    getAllAdmins,
    getAdminById,
    updateAdmin,
    deleteAdmin,
    changePassword,
    forgotPassword,
    resetPassword
} from '../controllers/adminController.js';

// ✅ Import agent controller functions
import {
    getAllAgents,
    getPendingAgents,
    getAgentById,
    approveAgent,
    rejectAgent,
    setPendingStatus,
    deleteAgent
} from '../controllers/agentController.js';

// ⭐ Import payment controller functions
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

import { protect } from '../middleware/auth.js';

const router = express.Router();

// ============================================
// PUBLIC ROUTES
// ============================================
router.post('/signup', signUp);
router.post('/verify-signup', verifySignUpOTP);
router.post('/resend-otp', resendOTP);
router.post('/signin', signIn);
router.post('/verify-login-otp', verifyLoginOTP);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

// ============================================
// ⭐ SPECIFIC ROUTES (PEHLE)
// ============================================

// Profile
router.get('/profile', protect, getCurrentAdmin);
router.get('/all', protect, getAllAdmins);

// ============================================
// AGENT MANAGEMENT ROUTES
// ============================================
router.get('/agents', protect, getAllAgents);
router.get('/agents/pending', protect, getPendingAgents);
router.put('/agents/approve/:id', protect, approveAgent);
router.put('/agents/reject/:id', protect, rejectAgent);
router.put('/agents/pending/:id', protect, setPendingStatus);
router.delete('/agents/:id', protect, deleteAgent);
router.get('/agents/:id', protect, getAgentById);

// ============================================
// ⭐ PAYMENT ROUTES (MUST BE BEFORE /:id)
// ============================================

// Payment stats & reports
router.get('/payments/stats', protect, getPaymentStats);
router.get('/payments/daily-report', protect, getDailyReport);
router.get('/payments/agent/:agentId/summary', protect, getAgentPaymentSummary);

// Payment CRUD
router.post('/payments', protect, createPayment);
router.get('/payments', protect, getAllPayments);
router.get('/payments/:id', protect, getPaymentById);
router.put('/payments/:id', protect, updatePayment);
router.delete('/payments/:id', protect, deletePayment);

// ============================================
// ⚠️ GENERIC ROUTES (SABSE AAKHIR MEIN)
// Ye :id wale routes hain — inko LAST mein rakho
// ============================================
router.put('/:id/change-password', protect, changePassword);
router.get('/:id', protect, getAdminById);
router.put('/:id', protect, updateAdmin);
router.delete('/:id', protect, deleteAdmin);

export default router;