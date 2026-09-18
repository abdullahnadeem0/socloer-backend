// backend/routes/agentDashboardRoutes.js
import express from 'express';
import Agent from '../models/Agent.js';
import Application from '../models/Application.js';
import Payment from '../models/Payment.js';
import { protectAgent } from '../middleware/auth.js';
import mongoose from 'mongoose';

const router = express.Router();

// ============================================
// @desc    Agent Dashboard Stats
// @route   GET /api/agent/dashboard/stats
// @access  Private (Agent)
// ============================================
router.get('/stats', protectAgent, async (req, res) => {
    try {
        const agentId = req.agent?._id || req.agent?.id;

        console.log('📊 AGENT DASHBOARD STATS for:', agentId);

        // ===== APPLICATIONS STATS =====
        const totalApplications = await Application.countDocuments({ agent: agentId });
        const approvedApplications = await Application.countDocuments({
            agent: agentId,
            status: 'approved'
        });
        const pendingApplications = await Application.countDocuments({
            agent: agentId,
            status: { $in: ['submitted', 'under-review', 'pending-documents'] }
        });
        const rejectedApplications = await Application.countDocuments({
            agent: agentId,
            status: 'rejected'
        });
        const disbursedApplications = await Application.countDocuments({
            agent: agentId,
            status: 'scholarship-disbursed'
        });

        // ===== PAYMENT STATS =====
        const totalReceived = await Payment.aggregate([
            {
                $match: {
                    agent: new mongoose.Types.ObjectId(agentId),
                    type: 'send',
                    status: 'completed'
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            }
        ]);

        // This Month
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const monthReceived = await Payment.aggregate([
            {
                $match: {
                    agent: new mongoose.Types.ObjectId(agentId),
                    type: 'send',
                    status: 'completed',
                    paymentDate: { $gte: startOfMonth }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            }
        ]);

        // This Week
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());

        const weekReceived = await Payment.aggregate([
            {
                $match: {
                    agent: new mongoose.Types.ObjectId(agentId),
                    type: 'send',
                    status: 'completed',
                    paymentDate: { $gte: startOfWeek }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            }
        ]);

        // Today
        const todayReceived = await Payment.aggregate([
            {
                $match: {
                    agent: new mongoose.Types.ObjectId(agentId),
                    type: 'send',
                    status: 'completed',
                    paymentDate: { $gte: today }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            }
        ]);

        // Monthly Summary (Last 6 Months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const monthlyData = await Payment.aggregate([
            {
                $match: {
                    agent: new mongoose.Types.ObjectId(agentId),
                    type: 'send',
                    status: 'completed',
                    paymentDate: { $gte: sixMonthsAgo }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$paymentDate' },
                        month: { $month: '$paymentDate' }
                    },
                    total: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        const monthlySummary = monthlyData.map(item => ({
            year: item._id.year,
            month: item._id.month,
            label: `${monthNames[item._id.month - 1]} ${String(item._id.year).slice(-2)}`,
            total: item.total,
            count: item.count
        }));

        // ===== RECENT APPLICATIONS =====
        const recentApplications = await Application.find({ agent: agentId })
            .populate('university', 'name')
            .populate('program', 'name')
            .sort({ createdAt: -1 })
            .limit(5);

        // ===== RECENT PAYMENTS =====
        const recentPayments = await Payment.find({
            agent: agentId,
            type: 'send',
            status: 'completed'
        })
            .sort({ paymentDate: -1 })
            .limit(5);

        res.status(200).json({
            success: true,
            data: {
                applications: {
                    total: totalApplications,
                    approved: approvedApplications,
                    pending: pendingApplications,
                    rejected: rejectedApplications,
                    disbursed: disbursedApplications
                },
                payments: {
                    totalReceived: totalReceived[0]?.total || 0,
                    totalCount: totalReceived[0]?.count || 0,
                    
                    monthReceived: monthReceived[0]?.total || 0,
                    monthCount: monthReceived[0]?.count || 0,
                    
                    weekReceived: weekReceived[0]?.total || 0,
                    weekCount: weekReceived[0]?.count || 0,
                    
                    todayReceived: todayReceived[0]?.total || 0,
                    todayCount: todayReceived[0]?.count || 0,
                    
                    monthlySummary
                },
                recentApplications,
                recentPayments
            }
        });

    } catch (error) {
        console.error('❌ Agent Dashboard Error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

export default router;