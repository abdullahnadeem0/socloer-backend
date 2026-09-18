// backend/controllers/agentPaymentController.js
import Payment from '../models/Payment.js';
import Agent from '../models/Agent.js';
import mongoose from 'mongoose';

// ============================================
// 1. GET AGENT PAYMENTS (Apne payments)
// ============================================
export const getMyPayments = async (req, res) => {
    try {
        const agentId = req.agent?._id || req.agent?.id;

        console.log('📥 GET MY PAYMENTS for agent:', agentId);

        if (!agentId) {
            return res.status(401).json({
                success: false,
                message: 'Agent authentication required'
            });
        }

        const {
            type,
            status,
            from,
            to,
            search,
            page = 1,
            limit = 100
        } = req.query;

        const filter = { agent: agentId };

        if (type && type !== 'all') filter.type = type;
        if (status && status !== 'all') filter.status = status;

        // Date range
        if (from || to) {
            filter.paymentDate = {};
            if (from) filter.paymentDate.$gte = new Date(from);
            if (to) {
                const toDate = new Date(to);
                toDate.setHours(23, 59, 59, 999);
                filter.paymentDate.$lte = toDate;
            }
        }

        // Search
        if (search) {
            filter.$or = [
                { paymentNumber: { $regex: search, $options: 'i' } },
                { fromName: { $regex: search, $options: 'i' } },
                { toName: { $regex: search, $options: 'i' } },
                { transactionId: { $regex: search, $options: 'i' } },
                { note: { $regex: search, $options: 'i' } }
            ];
        }

        const payments = await Payment.find(filter)
            .populate('application', 'applicationNumber student')
            .sort({ paymentDate: -1, createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Payment.countDocuments(filter);

        res.status(200).json({
            success: true,
            count: payments.length,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit),
            data: payments
        });

    } catch (error) {
        console.error('❌ Get My Payments Error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// 2. GET AGENT PAYMENT STATS
// ============================================
export const getMyPaymentStats = async (req, res) => {
    try {
        const agentId = req.agent?._id || req.agent?.id;

        console.log('📊 GET MY STATS for agent:', agentId);

        // Total received (send type = admin sends to agent)
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

        // This week
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

        // This month
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

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

        res.status(200).json({
            success: true,
            data: {
                totalReceived: totalReceived[0]?.total || 0,
                totalCount: totalReceived[0]?.count || 0,
                
                weekReceived: weekReceived[0]?.total || 0,
                weekCount: weekReceived[0]?.count || 0,
                
                monthReceived: monthReceived[0]?.total || 0,
                monthCount: monthReceived[0]?.count || 0,
                
                todayReceived: todayReceived[0]?.total || 0,
                todayCount: todayReceived[0]?.count || 0
            }
        });

    } catch (error) {
        console.error('❌ Get My Stats Error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// 3. GET SINGLE PAYMENT
// ============================================
export const getMyPaymentById = async (req, res) => {
    try {
        const agentId = req.agent?._id || req.agent?.id;

        const payment = await Payment.findById(req.params.id)
            .populate('application', 'applicationNumber student');

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }

        // Ownership check
        if (payment.agent?.toString() !== agentId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized'
            });
        }

        res.status(200).json({
            success: true,
            data: payment
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// 4. AGENT MONTHLY SUMMARY
// ============================================
export const getMyMonthlySummary = async (req, res) => {
    try {
        const agentId = req.agent?._id || req.agent?.id;

        // Last 6 months
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
            { $sort: { '_id.year': -1, '_id.month': -1 } }
        ]);

        // Format months
        const formatted = monthlyData.map(item => {
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                              'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return {
                year: item._id.year,
                month: item._id.month,
                monthName: monthNames[item._id.month - 1],
                label: `${monthNames[item._id.month - 1]} ${item._id.year}`,
                total: item.total,
                count: item.count
            };
        });

        res.status(200).json({
            success: true,
            data: formatted
        });

    } catch (error) {
        console.error('❌ Monthly Summary Error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};