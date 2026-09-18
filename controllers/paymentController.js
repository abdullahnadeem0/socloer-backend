// backend/controllers/paymentController.js
import Payment from '../models/Payment.js';
import Agent from '../models/Agent.js';
import Application from '../models/Application.js';
import mongoose from 'mongoose';

// ============================================
// 1. CREATE PAYMENT (Receive or Send)
// ============================================
export const createPayment = async (req, res) => {
    try {
        const adminId = req.admin?._id || req.admin?.id;
        const adminName = req.admin?.name || 'Admin';

        console.log('=========================================');
        console.log('💰 CREATE PAYMENT');
        console.log('📝 Type:', req.body.type);
        console.log('💵 Amount:', req.body.amount);
        console.log('=========================================');

        const {
            type,
            amount,
            currency = 'PKR',
            fromName, fromEmail, fromPhone,
            toName, toEmail, toPhone,
            agent: agentId,
            application: applicationId,
            paymentMethod,
            transactionId,
            bankName,
            accountNumber,
            note,
            paymentDate,
            status = 'completed'
        } = req.body;

        // ===== VALIDATION =====
        if (!type || !['receive', 'send'].includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'Payment type must be "receive" or "send"'
            });
        }

        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid amount is required'
            });
        }

        // ===== BUILD PAYMENT DATA =====
        const paymentData = {
            type,
            amount: parseFloat(amount),
            currency,
            fromName,
            fromEmail,
            fromPhone,
            toName,
            toEmail,
            toPhone,
            paymentMethod: paymentMethod || 'Bank Transfer',
            transactionId,
            bankName,
            accountNumber,
            note,
            paymentDate: paymentDate || new Date(),
            status,
            createdBy: adminId,
            createdByName: adminName
        };

        // ===== HANDLE AGENT (for send) =====
        if (type === 'send' && agentId) {
            const agent = await Agent.findById(agentId);
            if (agent) {
                paymentData.agent = agent._id;
                paymentData.agentName = agent.name;
                paymentData.agentEmail = agent.email;
                paymentData.toName = paymentData.toName || agent.name;
                paymentData.toEmail = paymentData.toEmail || agent.email;
                paymentData.toPhone = paymentData.toPhone || agent.phone;
            }
        }

        // ===== HANDLE APPLICATION (for receive) =====
        if (type === 'receive' && applicationId) {
            const application = await Application.findById(applicationId);
            if (application) {
                paymentData.application = application._id;
                paymentData.applicationNumber = application.applicationNumber;
                paymentData.student = application._id;
                paymentData.studentName = 
                    `${application.student?.firstName} ${application.student?.lastName}`;
            }
        }

        // ===== CREATE PAYMENT =====
        const payment = await Payment.create(paymentData);

        console.log('✅ Payment created:', payment.paymentNumber);

        res.status(201).json({
            success: true,
            message: `${type === 'receive' ? 'Payment received' : 'Payment sent'} successfully`,
            data: payment
        });

    } catch (error) {
        console.error('❌ Create Payment Error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create payment'
        });
    }
};

// ============================================
// 2. GET ALL PAYMENTS
// ============================================
export const getAllPayments = async (req, res) => {
    try {
        const {
            type,
            status,
            agent,
            application,
            from,
            to,
            search,
            page = 1,
            limit = 50
        } = req.query;

        const filter = {};

        if (type && type !== 'all') filter.type = type;
        if (status && status !== 'all') filter.status = status;
        if (agent) filter.agent = agent;
        if (application) filter.application = application;

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
                { agentName: { $regex: search, $options: 'i' } },
                { studentName: { $regex: search, $options: 'i' } },
                { transactionId: { $regex: search, $options: 'i' } },
                { note: { $regex: search, $options: 'i' } }
            ];
        }

        const payments = await Payment.find(filter)
            .populate('agent', 'name email phone')
            .populate('application', 'applicationNumber')
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
        console.error('❌ Get Payments Error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// 3. GET SINGLE PAYMENT
// ============================================
export const getPaymentById = async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id)
            .populate('agent', 'name email phone')
            .populate('application', 'applicationNumber student');

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
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
// 4. UPDATE PAYMENT
// ============================================
export const updatePayment = async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id);

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }

        const allowedFields = [
            'amount', 'currency', 'fromName', 'fromEmail', 'fromPhone',
            'toName', 'toEmail', 'toPhone', 'agent', 'application',
            'paymentMethod', 'transactionId', 'bankName', 'accountNumber',
            'note', 'paymentDate', 'status'
        ];

        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                payment[field] = req.body[field];
            }
        });

        // Update agent info if agent changed
        if (req.body.agent) {
            const agent = await Agent.findById(req.body.agent);
            if (agent) {
                payment.agentName = agent.name;
                payment.agentEmail = agent.email;
            }
        }

        // Update application info if changed
        if (req.body.application) {
            const application = await Application.findById(req.body.application);
            if (application) {
                payment.applicationNumber = application.applicationNumber;
                payment.studentName = 
                    `${application.student?.firstName} ${application.student?.lastName}`;
            }
        }

        await payment.save();

        res.status(200).json({
            success: true,
            message: 'Payment updated successfully',
            data: payment
        });

    } catch (error) {
        console.error('❌ Update Payment Error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// 5. DELETE PAYMENT
// ============================================
export const deletePayment = async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id);

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }

        const paymentNumber = payment.paymentNumber;
        await Payment.findByIdAndDelete(req.params.id);

        console.log('🗑️ Payment deleted:', paymentNumber);

        res.status(200).json({
            success: true,
            message: 'Payment deleted successfully',
            data: { paymentNumber }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// 6. GET PAYMENT STATS
// ============================================
export const getPaymentStats = async (req, res) => {
    try {
        const { from, to } = req.query;

        // Build date filter
        const dateFilter = {};
        if (from || to) {
            dateFilter.paymentDate = {};
            if (from) dateFilter.paymentDate.$gte = new Date(from);
            if (to) {
                const toDate = new Date(to);
                toDate.setHours(23, 59, 59, 999);
                dateFilter.paymentDate.$lte = toDate;
            }
        }

        // Total received
        const receivedStats = await Payment.aggregate([
            { $match: { type: 'receive', status: 'completed', ...dateFilter } },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amount' },
                    count: { $sum: 1 },
                    avgAmount: { $avg: '$amount' }
                }
            }
        ]);

        // Total sent
        const sentStats = await Payment.aggregate([
            { $match: { type: 'send', status: 'completed', ...dateFilter } },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amount' },
                    count: { $sum: 1 },
                    avgAmount: { $avg: '$amount' }
                }
            }
        ]);

        // By status
        const byStatus = await Payment.aggregate([
            { $match: dateFilter },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    total: { $sum: '$amount' }
                }
            }
        ]);

        // Today's stats
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayReceived = await Payment.aggregate([
            {
                $match: {
                    type: 'receive',
                    status: 'completed',
                    paymentDate: { $gte: today, $lt: tomorrow }
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

        const todaySent = await Payment.aggregate([
            {
                $match: {
                    type: 'send',
                    status: 'completed',
                    paymentDate: { $gte: today, $lt: tomorrow }
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
                    type: 'receive',
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

        const monthSent = await Payment.aggregate([
            {
                $match: {
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

        // Top agents (by received amount)
        const topAgents = await Payment.aggregate([
            { $match: { type: 'send', status: 'completed', ...dateFilter } },
            {
                $group: {
                    _id: '$agent',
                    agentName: { $first: '$agentName' },
                    totalSent: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { totalSent: -1 } },
            { $limit: 5 }
        ]);

        const totalReceived = receivedStats[0]?.total || 0;
        const totalSent = sentStats[0]?.total || 0;

        res.status(200).json({
            success: true,
            data: {
                totalReceived,
                totalSent,
                balance: totalReceived - totalSent,
                
                receivedCount: receivedStats[0]?.count || 0,
                sentCount: sentStats[0]?.count || 0,
                
                avgReceived: receivedStats[0]?.avgAmount || 0,
                avgSent: sentStats[0]?.avgAmount || 0,

                todayReceived: todayReceived[0]?.total || 0,
                todaySent: todaySent[0]?.total || 0,
                todayReceivedCount: todayReceived[0]?.count || 0,
                todaySentCount: todaySent[0]?.count || 0,

                monthReceived: monthReceived[0]?.total || 0,
                monthSent: monthSent[0]?.total || 0,
                monthReceivedCount: monthReceived[0]?.count || 0,
                monthSentCount: monthSent[0]?.count || 0,

                byStatus,
                topAgents
            }
        });

    } catch (error) {
        console.error('❌ Get Payment Stats Error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// 7. GET AGENT PAYMENT SUMMARY
// ============================================
export const getAgentPaymentSummary = async (req, res) => {
    try {
        const { agentId } = req.params;

        const agent = await Agent.findById(agentId);
        if (!agent) {
            return res.status(404).json({
                success: false,
                message: 'Agent not found'
            });
        }

        // Total sent to this agent
        const sentStats = await Payment.aggregate([
            {
                $match: {
                    type: 'send',
                    status: 'completed',
                    agent: new mongoose.Types.ObjectId(agentId)
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amount' },
                    count: { $sum: 1 },
                    lastPayment: { $max: '$paymentDate' }
                }
            }
        ]);

        // Recent payments
        const recentPayments = await Payment.find({
            agent: agentId,
            type: 'send'
        })
            .sort({ paymentDate: -1 })
            .limit(10);

        res.status(200).json({
            success: true,
            data: {
                agent: {
                    id: agent._id,
                    name: agent.name,
                    email: agent.email,
                    phone: agent.phone
                },
                totalSent: sentStats[0]?.total || 0,
                totalPayments: sentStats[0]?.count || 0,
                lastPayment: sentStats[0]?.lastPayment || null,
                recentPayments
            }
        });

    } catch (error) {
        console.error('❌ Agent Payment Summary Error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// 8. DAILY REPORT
// ============================================
export const getDailyReport = async (req, res) => {
    try {
        const { date } = req.query;

        const targetDate = date ? new Date(date) : new Date();
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);

        const payments = await Payment.find({
            paymentDate: { $gte: startOfDay, $lte: endOfDay },
            status: 'completed'
        })
            .populate('agent', 'name email')
            .sort({ paymentDate: -1 });

        const received = payments.filter(p => p.type === 'receive');
        const sent = payments.filter(p => p.type === 'send');

        const totalReceived = received.reduce((sum, p) => sum + p.amount, 0);
        const totalSent = sent.reduce((sum, p) => sum + p.amount, 0);

        res.status(200).json({
            success: true,
            data: {
                date: startOfDay.toISOString().split('T')[0],
                totalReceived,
                totalSent,
                balance: totalReceived - totalSent,
                receivedCount: received.length,
                sentCount: sent.length,
                received,
                sent,
                allPayments: payments
            }
        });

    } catch (error) {
        console.error('❌ Daily Report Error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};