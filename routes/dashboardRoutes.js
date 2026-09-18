// backend/routes/dashboardRoutes.js
import express from 'express';
import Agent from '../models/Agent.js';
import Application from '../models/Application.js';
import Payment from '../models/Payment.js';
import University from '../models/University.js';
import Program from '../models/Program.js';
import { protect as adminProtect } from '../middleware/auth.js';

const router = express.Router();

// ============================================
// @desc    Dashboard Stats
// @route   GET /api/admin/dashboard/stats
// @access  Private (Admin)
// ============================================
router.get('/stats', adminProtect, async (req, res) => {
    try {
        console.log('📊 GET DASHBOARD STATS');

        // ===== AGENTS =====
        const totalAgents = await Agent.countDocuments();
        const approvedAgents = await Agent.countDocuments({ approvalStatus: 'approved' });
        const pendingAgents = await Agent.countDocuments({ approvalStatus: 'pending' });
        const rejectedAgents = await Agent.countDocuments({ approvalStatus: 'rejected' });

        // ===== APPLICATIONS =====
        const totalApplications = await Application.countDocuments();
        const approvedApplications = await Application.countDocuments({ status: 'approved' });
        const pendingApplications = await Application.countDocuments({
            status: { $in: ['submitted', 'under-review', 'pending-documents'] }
        });
        const rejectedApplications = await Application.countDocuments({ status: 'rejected' });
        const disbursedApplications = await Application.countDocuments({ status: 'scholarship-disbursed' });

        // ===== PAYMENTS =====
        const receivedStats = await Payment.aggregate([
            { $match: { type: 'receive', status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
        ]);

        const sentStats = await Payment.aggregate([
            { $match: { type: 'send', status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
        ]);

        const totalReceived = receivedStats[0]?.total || 0;
        const totalSent = sentStats[0]?.total || 0;
        const balance = totalReceived - totalSent;

        // Today
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayReceived = await Payment.aggregate([
            { $match: { type: 'receive', status: 'completed', paymentDate: { $gte: today } } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const todaySent = await Payment.aggregate([
            { $match: { type: 'send', status: 'completed', paymentDate: { $gte: today } } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        // ===== OTHER =====
        const totalUniversities = await University.countDocuments({ isActive: true });
        const totalPrograms = await Program.countDocuments({ isActive: true });

        // ===== RECENT =====
        const recentApplications = await Application.find()
            .populate('agent', 'name email')
            .populate('university', 'name')
            .sort({ createdAt: -1 })
            .limit(5);

        const recentAgents = await Agent.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select('name email approvalStatus createdAt');

        const recentPayments = await Payment.find({ status: 'completed' })
            .populate('agent', 'name')
            .sort({ createdAt: -1 })
            .limit(5);

        res.status(200).json({
            success: true,
            data: {
                agents: {
                    total: totalAgents,
                    approved: approvedAgents,
                    pending: pendingAgents,
                    rejected: rejectedAgents
                },
                applications: {
                    total: totalApplications,
                    approved: approvedApplications,
                    pending: pendingApplications,
                    rejected: rejectedApplications,
                    disbursed: disbursedApplications
                },
                payments: {
                    totalReceived,
                    totalSent,
                    balance,
                    receivedCount: receivedStats[0]?.count || 0,
                    sentCount: sentStats[0]?.count || 0,
                    todayReceived: todayReceived[0]?.total || 0,
                    todaySent: todaySent[0]?.total || 0
                },
                universities: totalUniversities,
                programs: totalPrograms,
                recentApplications,
                recentAgents,
                recentPayments
            }
        });

    } catch (error) {
        console.error('❌ Dashboard Stats Error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

export default router;