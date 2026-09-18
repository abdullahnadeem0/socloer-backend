// backend/routes/adminApplicationRoutes.js
import express from 'express';
import {
    adminGetAllApplications,
    adminGetApplicationById,
    adminGetStats,
    adminUpdateApplication,
    adminDeleteApplication,
    approveApplication,
    rejectApplication,
    reviewApplication
} from '../controllers/applicationController.js';
import { protect as adminProtect } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

const applicationUpload = upload.fields([
    { name: 'idProof', maxCount: 1 },
    { name: 'marksheet', maxCount: 1 },
    { name: 'incomeCertificate', maxCount: 1 },
    { name: 'profilePhoto', maxCount: 1 },
    { name: 'previousCertificate', maxCount: 1 },
    { name: 'bankPassbook', maxCount: 1 },
    { name: 'dependentPassport1', maxCount: 1 },
    { name: 'sponsorDetails', maxCount: 1 },
    { name: 'bankStatementLetter', maxCount: 1 },
    { name: 'visaCopies', maxCount: 1 },
    { name: 'pendingDocument', maxCount: 1 },
    { name: 'visaDocument', maxCount: 1 },
    { name: 'studyContinuousLetter', maxCount: 1 },
    { name: 'dependentPassport2', maxCount: 1 },
    { name: 'transferStudents', maxCount: 1 },
    { name: 'signedCAL', maxCount: 1 },
    { name: 'paymentInvoice', maxCount: 1 },
    { name: 'applicationFeeReceipt', maxCount: 1 },
    { name: 'englishExamReceipt', maxCount: 1 },
    { name: 'internalAdmissionFee', maxCount: 1 },
    { name: 'bankCheckDraft', maxCount: 1 },
    { name: 'insuranceFee', maxCount: 1 },
    { name: 'tuitionFee', maxCount: 1 },
    { name: 'finalSignedCAL', maxCount: 1 },
    { name: 'finalPaymentInvoice', maxCount: 1 },
    { name: 'initialAdmissionPortfolio', maxCount: 1 },
    { name: 'deferralAdmissionPortfolio', maxCount: 1 }
]);

// ============================================
// ADMIN APPLICATION ROUTES
// ============================================
router.get('/applications/stats', adminProtect, adminGetStats);
router.get('/applications', adminProtect, adminGetAllApplications);
router.get('/applications/:id', adminProtect, adminGetApplicationById);
router.put('/applications/:id', adminProtect, applicationUpload, adminUpdateApplication);
router.delete('/applications/:id', adminProtect, adminDeleteApplication);
router.patch('/applications/:id/approve', adminProtect, approveApplication);
router.patch('/applications/:id/reject', adminProtect, rejectApplication);
router.patch('/applications/:id/review', adminProtect, reviewApplication);

export default router;