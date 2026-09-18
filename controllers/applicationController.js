// backend/controllers/applicationController.js
import Application from '../models/Application.js';
import University from '../models/University.js';
import Program from '../models/Program.js';
import Agent from '../models/Agent.js';
import mongoose from 'mongoose';

// ============================================
// @desc    Create new application (Agent)
// @route   POST /api/agent/applications
// @access  Private (Agent)
// ============================================
export const createApplication = async (req, res) => {
    try {
        console.log('=========================================');
        console.log('📥 CREATE APPLICATION');
        console.log('=========================================');

        const agentId = req.agent?._id || req.agent?.id;

        if (!agentId) {
            return res.status(401).json({
                success: false,
                message: 'Agent authentication required'
            });
        }

        const agent = await Agent.findById(agentId);
        if (!agent) {
            return res.status(404).json({
                success: false,
                message: 'Agent not found'
            });
        }

        const body = req.body;
        console.log('📦 Body keys:', Object.keys(body));
        console.log('📎 Files:', req.files ? Object.keys(req.files) : 'none');

        // Validate references
        const university = await University.findById(body.university);
        if (!university) {
            return res.status(400).json({
                success: false,
                message: 'Invalid University'
            });
        }

        const program = await Program.findById(body.program);
        if (!program) {
            return res.status(400).json({
                success: false,
                message: 'Invalid Program'
            });
        }

        // Parse JSON
        const student = typeof body.student === 'string'
            ? JSON.parse(body.student) : body.student;

        const academic = typeof body.academic === 'string'
            ? JSON.parse(body.academic) : body.academic;

        const statement = typeof body.statement === 'string'
            ? JSON.parse(body.statement) : body.statement;

        const bankDetails = typeof body.bankDetails === 'string'
            ? JSON.parse(body.bankDetails) : body.bankDetails;

        // ===== HANDLE ALL FILES =====
        const documents = {};

        if (req.files) {
            const fileFields = [
                'idProof', 'marksheet', 'incomeCertificate',
                'profilePhoto', 'previousCertificate', 'bankPassbook',
                'dependentPassport1', 'sponsorDetails', 'bankStatementLetter',
                'visaCopies', 'pendingDocument', 'visaDocument',
                'studyContinuousLetter', 'dependentPassport2', 'transferStudents',
                'signedCAL', 'paymentInvoice',
                'applicationFeeReceipt', 'englishExamReceipt',
                'internalAdmissionFee', 'bankCheckDraft',
                'insuranceFee', 'tuitionFee',
                'finalSignedCAL', 'finalPaymentInvoice',
                'initialAdmissionPortfolio', 'deferralAdmissionPortfolio'
            ];

            fileFields.forEach(field => {
                if (req.files[field] && req.files[field][0]) {
                    const file = req.files[field][0];
                    documents[field] = `uploads/agents/${file.filename}`;
                }
            });
        }

        // ===== GENERATE APPLICATION NUMBER =====
        const year = new Date().getFullYear();
        const count = await Application.countDocuments();
        const applicationNumber = `APP-${year}-${String(count + 1).padStart(5, '0')}`;

        // ===== CREATE APPLICATION =====
        const application = await Application.create({
            applicationNumber,
            agent: agent._id,
            agentName: agent.name,
            agentEmail: agent.email,
            agentPhone: agent.phone,

            student: {
                ...student,
                profileImage: documents.profilePhoto || student.profileImage
            },

            academic,
            university: university._id,
            universityName: university.name,
            program: program._id,
            programName: program.name,
            documents,
            statement,
            bankDetails,
            status: 'submitted',
            submittedAt: new Date(),
            statusHistory: [{
                status: 'submitted',
                changedBy: agent._id,
                changedByModel: 'Agent',
                changedAt: new Date(),
                remarks: 'Application submitted by agent'
            }]
        });

        console.log('✅ Application created:', application.applicationNumber);

        res.status(201).json({
            success: true,
            message: 'Application submitted successfully!',
            data: {
                applicationId: application._id,
                applicationNumber: application.applicationNumber,
                status: application.status,
                submittedAt: application.submittedAt
            }
        });

    } catch (error) {
        console.error('❌ Create Application Error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to submit application'
        });
    }
};

// ============================================
// @desc    Get my applications (Agent)
// @route   GET /api/agent/applications
// @access  Private (Agent)
// ============================================
export const getMyApplications = async (req, res) => {
    try {
        const agentId = req.agent?._id || req.agent?.id;

        const applications = await Application.find({ agent: agentId })
            .populate('university', 'name city state logo')
            .populate('program', 'name')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: applications.length,
            data: applications
        });

    } catch (error) {
        console.error('❌ Get Applications Error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// @desc    Get single application (Agent)
// @route   GET /api/agent/applications/:id
// @access  Private (Agent)
// ============================================
export const getApplicationById = async (req, res) => {
    try {
        const agentId = req.agent?._id || req.agent?.id;

        const application = await Application.findById(req.params.id)
            .populate('university')
            .populate('program');

        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }

        if (application.agent.toString() !== agentId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized'
            });
        }

        res.status(200).json({
            success: true,
            data: application
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// @desc    Update application (Agent)
// @route   PUT /api/agent/applications/:id
// @access  Private (Agent)
// ============================================
export const updateApplication = async (req, res) => {
    try {
        const agentId = req.agent?._id || req.agent?.id;
        const { id } = req.params;

        console.log('📥 UPDATE APPLICATION:', id);

        const application = await Application.findById(id);

        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }

        if (application.agent.toString() !== agentId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to edit this application'
            });
        }

        if (['approved', 'scholarship-disbursed'].includes(application.status)) {
            return res.status(400).json({
                success: false,
                message: 'Cannot edit approved/disbursed applications'
            });
        }

        const body = req.body;

        const student = typeof body.student === 'string'
            ? JSON.parse(body.student) : body.student;

        const academic = typeof body.academic === 'string'
            ? JSON.parse(body.academic) : body.academic;

        const statement = typeof body.statement === 'string'
            ? JSON.parse(body.statement) : body.statement;

        const bankDetails = typeof body.bankDetails === 'string'
            ? JSON.parse(body.bankDetails) : body.bankDetails;

        const newDocuments = { ...application.documents };

        if (req.files) {
            const fileFields = [
                'idProof', 'marksheet', 'incomeCertificate',
                'profilePhoto', 'previousCertificate', 'bankPassbook',
                'dependentPassport1', 'sponsorDetails', 'bankStatementLetter',
                'visaCopies', 'pendingDocument', 'visaDocument',
                'studyContinuousLetter', 'dependentPassport2', 'transferStudents',
                'signedCAL', 'paymentInvoice',
                'applicationFeeReceipt', 'englishExamReceipt',
                'internalAdmissionFee', 'bankCheckDraft',
                'insuranceFee', 'tuitionFee',
                'finalSignedCAL', 'finalPaymentInvoice',
                'initialAdmissionPortfolio', 'deferralAdmissionPortfolio'
            ];

            fileFields.forEach(field => {
                if (req.files[field] && req.files[field][0]) {
                    const file = req.files[field][0];
                    newDocuments[field] = `uploads/agents/${file.filename}`;
                }
            });
        }

        if (student) application.student = { ...application.student, ...student };
        if (academic) application.academic = { ...application.academic, ...academic };
        if (statement) application.statement = { ...application.statement, ...statement };
        if (bankDetails) application.bankDetails = { ...application.bankDetails, ...bankDetails };
        application.documents = newDocuments;

        if (body.university && body.university !== application.university.toString()) {
            const university = await University.findById(body.university);
            if (university) {
                application.university = university._id;
                application.universityName = university.name;
            }
        }

        if (body.program && body.program !== application.program.toString()) {
            const program = await Program.findById(body.program);
            if (program) {
                application.program = program._id;
                application.programName = program.name;
            }
        }

        await application.save();

        console.log('✅ Application updated:', application.applicationNumber);

        res.status(200).json({
            success: true,
            message: 'Application updated successfully',
            data: application
        });

    } catch (error) {
        console.error('❌ Update Application Error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update application'
        });
    }
};

// ============================================
// @desc    Get application stats (Agent)
// @route   GET /api/agent/applications/stats
// @access  Private (Agent)
// ============================================
export const getApplicationStats = async (req, res) => {
    try {
        const agentId = req.agent?._id || req.agent?.id;

        const total = await Application.countDocuments({ agent: agentId });
        const submitted = await Application.countDocuments({ agent: agentId, status: 'submitted' });
        const underReview = await Application.countDocuments({ agent: agentId, status: 'under-review' });
        const pending = await Application.countDocuments({ agent: agentId, status: 'pending-documents' });
        const approved = await Application.countDocuments({ agent: agentId, status: 'approved' });
        const rejected = await Application.countDocuments({ agent: agentId, status: 'rejected' });
        const disbursed = await Application.countDocuments({ agent: agentId, status: 'scholarship-disbursed' });

        res.status(200).json({
            success: true,
            data: {
                total,
                submitted,
                underReview,
                pending,
                approved,
                rejected,
                disbursed
            }
        });

    } catch (error) {
        console.error('❌ Get Stats Error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// @desc    Delete application (Agent)
// @route   DELETE /api/agent/applications/:id
// @access  Private (Agent)
// ============================================
export const deleteApplication = async (req, res) => {
    try {
        const agentId = req.agent?._id || req.agent?.id;

        const application = await Application.findById(req.params.id);

        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }

        if (application.agent.toString() !== agentId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized'
            });
        }

        if (['approved', 'scholarship-disbursed'].includes(application.status)) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete approved applications'
            });
        }

        await Application.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Application deleted successfully'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// ============================================
// ⭐ ADMIN FUNCTIONS START FROM HERE
// ============================================
// ============================================

// ============================================
// @desc    Get ALL applications (Admin)
// @route   GET /api/admin/applications
// @access  Private (Admin)
// ============================================
export const adminGetAllApplications = async (req, res) => {
    try {
        console.log('📥 ADMIN GET ALL APPLICATIONS');

        const {
            status,
            agent,
            university,
            search,
            page = 1,
            limit = 100
        } = req.query;

        // Build filter
        const filter = {};
        if (status && status !== 'all') filter.status = status;
        if (agent && agent !== 'all') filter.agent = agent;
        if (university) filter.university = university;

        // Search
        if (search) {
            filter.$or = [
                { applicationNumber: { $regex: search, $options: 'i' } },
                { 'student.firstName': { $regex: search, $options: 'i' } },
                { 'student.lastName': { $regex: search, $options: 'i' } },
                { 'student.email': { $regex: search, $options: 'i' } },
                { agentName: { $regex: search, $options: 'i' } },
                { universityName: { $regex: search, $options: 'i' } }
            ];
        }

        const applications = await Application.find(filter)
            .populate('university', 'name city state logo')
            .populate('program', 'name')
            .populate('agent', 'name email phone')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Application.countDocuments(filter);

        res.status(200).json({
            success: true,
            count: applications.length,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit),
            data: applications
        });

    } catch (error) {
        console.error('❌ Admin Get All Error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// @desc    Get single application (Admin)
// @route   GET /api/admin/applications/:id
// @access  Private (Admin)
// ============================================
export const adminGetApplicationById = async (req, res) => {
    try {
        const application = await Application.findById(req.params.id)
            .populate('university')
            .populate('program')
            .populate('agent', 'name email phone');

        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }

        res.status(200).json({
            success: true,
            data: application
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// @desc    Get all application stats (Admin)
// @route   GET /api/admin/applications/stats
// @access  Private (Admin)
// ============================================
export const adminGetStats = async (req, res) => {
    try {
        const total = await Application.countDocuments();
        const submitted = await Application.countDocuments({ status: 'submitted' });
        const underReview = await Application.countDocuments({ status: 'under-review' });
        const pending = await Application.countDocuments({ status: 'pending-documents' });
        const approved = await Application.countDocuments({ status: 'approved' });
        const rejected = await Application.countDocuments({ status: 'rejected' });
        const disbursed = await Application.countDocuments({ status: 'scholarship-disbursed' });

        // Top agents
        const topAgents = await Application.aggregate([
            { $group: { _id: '$agent', name: { $first: '$agentName' }, count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        // Top universities
        const topUniversities = await Application.aggregate([
            { $group: { _id: '$university', name: { $first: '$universityName' }, count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        res.status(200).json({
            success: true,
            data: {
                total,
                submitted,
                underReview,
                pending,
                approved,
                rejected,
                disbursed,
                topAgents,
                topUniversities
            }
        });

    } catch (error) {
        console.error('❌ Admin Stats Error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// @desc    Update application (ADMIN) ⭐
// @route   PUT /api/admin/applications/:id
// @access  Private (Admin)
// ============================================
export const adminUpdateApplication = async (req, res) => {
    try {
        const adminId = req.admin?._id || req.admin?.id;
        const { id } = req.params;

        console.log('=========================================');
        console.log('📥 ADMIN UPDATE APPLICATION:', id);
        console.log('👤 Admin ID:', adminId);
        console.log('📦 Body keys:', Object.keys(req.body));
        console.log('📎 Files:', req.files ? Object.keys(req.files) : 'none');
        console.log('=========================================');

        const application = await Application.findById(id);

        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }

        // ⚠️ Admin can edit ANY application (no ownership check)
        // But cannot edit disbursed applications
        if (application.status === 'scholarship-disbursed') {
            return res.status(400).json({
                success: false,
                message: 'Cannot edit disbursed applications'
            });
        }

        const body = req.body;

        // Parse JSON fields
        let student = body.student;
        let academic = body.academic;
        let statement = body.statement;
        let bankDetails = body.bankDetails;

        try {
            if (typeof student === 'string') student = JSON.parse(student);
            if (typeof academic === 'string') academic = JSON.parse(academic);
            if (typeof statement === 'string') statement = JSON.parse(statement);
            if (typeof bankDetails === 'string') bankDetails = JSON.parse(bankDetails);
        } catch (parseError) {
            console.error('❌ JSON Parse Error:', parseError);
            return res.status(400).json({
                success: false,
                message: 'Invalid JSON data in request'
            });
        }

        // ===== HANDLE NEW FILES =====
        const newDocuments = { ...application.documents };

        if (req.files) {
            const fileFields = [
                'idProof', 'marksheet', 'incomeCertificate',
                'profilePhoto', 'previousCertificate', 'bankPassbook',
                'dependentPassport1', 'sponsorDetails', 'bankStatementLetter',
                'visaCopies', 'pendingDocument', 'visaDocument',
                'studyContinuousLetter', 'dependentPassport2', 'transferStudents',
                'signedCAL', 'paymentInvoice',
                'applicationFeeReceipt', 'englishExamReceipt',
                'internalAdmissionFee', 'bankCheckDraft',
                'insuranceFee', 'tuitionFee',
                'finalSignedCAL', 'finalPaymentInvoice',
                'initialAdmissionPortfolio', 'deferralAdmissionPortfolio'
            ];

            fileFields.forEach(field => {
                if (req.files[field] && req.files[field][0]) {
                    const file = req.files[field][0];
                    newDocuments[field] = `uploads/agents/${file.filename}`;
                    console.log(`📎 Updated file: ${field} →`, newDocuments[field]);
                }
            });
        }

        // ===== UPDATE FIELDS =====
        if (student) {
            application.student = { ...application.student, ...student };
            // Update profile image if new one uploaded
            if (newDocuments.profilePhoto) {
                application.student.profileImage = newDocuments.profilePhoto;
            }
        }

        if (academic) {
            application.academic = { ...application.academic, ...academic };
        }

        if (statement) {
            application.statement = { ...application.statement, ...statement };
        }

        if (bankDetails) {
            application.bankDetails = { ...application.bankDetails, ...bankDetails };
        }

        application.documents = newDocuments;

        // ===== UPDATE UNIVERSITY/PROGRAM IF CHANGED =====
        if (body.university && body.university !== application.university.toString()) {
            const university = await University.findById(body.university);
            if (university) {
                application.university = university._id;
                application.universityName = university.name;
                console.log('🎓 University updated:', university.name);
            }
        }

        if (body.program && body.program !== application.program.toString()) {
            const program = await Program.findById(body.program);
            if (program) {
                application.program = program._id;
                application.programName = program.name;
                console.log('📚 Program updated:', program.name);
            }
        }

        // ===== TRACK ADMIN UPDATE IN HISTORY =====
        application.statusHistory = application.statusHistory || [];
        application.statusHistory.push({
            status: application.status,
            changedBy: adminId,
            changedByModel: 'Admin',
            changedAt: new Date(),
            remarks: 'Application updated by admin'
        });

        await application.save();

        console.log('✅ Application updated by admin:', application.applicationNumber);

        res.status(200).json({
            success: true,
            message: 'Application updated successfully',
            data: application
        });

    } catch (error) {
        console.error('❌ Admin Update Error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update application'
        });
    }
};

// ============================================
// @desc    Delete application (ADMIN) ⭐
// @route   DELETE /api/admin/applications/:id
// @access  Private (Admin)
// ============================================
export const adminDeleteApplication = async (req, res) => {
    try {
        const adminId = req.admin?._id || req.admin?.id;

        console.log('=========================================');
        console.log('🗑️ ADMIN DELETE APPLICATION:', req.params.id);
        console.log('👤 Admin ID:', adminId);
        console.log('=========================================');

        const application = await Application.findById(req.params.id);

        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }

        // Store info for logging
        const appNumber = application.applicationNumber;

        // ⚠️ Admin can delete ANY application (no status restriction)

        await Application.findByIdAndDelete(req.params.id);

        console.log('✅ Application deleted by admin:', appNumber);

        res.status(200).json({
            success: true,
            message: 'Application deleted successfully',
            data: {
                applicationNumber: appNumber
            }
        });

    } catch (error) {
        console.error('❌ Admin Delete Error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to delete application'
        });
    }
};
// ============================================
// @desc    Approve application (Admin)
// @route   PATCH /api/admin/applications/:id/approve
// @access  Private (Admin)
// ============================================
export const approveApplication = async (req, res) => {
    try {
        const adminId = req.admin?._id || req.admin?.id;
        const { remarks } = req.body;

        console.log('=========================================');
        console.log('✅ APPROVE APPLICATION');
        console.log('👤 Admin ID:', adminId);
        console.log('📋 App ID:', req.params.id);
        console.log('=========================================');

        const application = await Application.findById(req.params.id)
            .populate('agent', 'name email');

        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }

        if (application.status === 'approved') {
            return res.status(400).json({
                success: false,
                message: 'Application already approved'
            });
        }

        // Update application
        application.status = 'approved';
        application.reviewedBy = adminId;
        application.reviewedAt = new Date();
        application.adminRemarks = remarks || 'Application approved by admin';

        // Add to history
        application.statusHistory = application.statusHistory || [];
        application.statusHistory.push({
            status: 'approved',
            changedBy: adminId,
            changedByModel: 'Admin',
            changedAt: new Date(),
            remarks: remarks || 'Application approved by admin'
        });

        await application.save();

        console.log('✅ Application approved:', application.applicationNumber);

        res.status(200).json({
            success: true,
            message: 'Application approved successfully',
            data: application
        });

    } catch (error) {
        console.error('❌ Approve Error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to approve application'
        });
    }
};

// ============================================
// @desc    Reject application (Admin)
// @route   PATCH /api/admin/applications/:id/reject
// @access  Private (Admin)
// ============================================
export const rejectApplication = async (req, res) => {
    try {
        const adminId = req.admin?._id || req.admin?.id;
        const { reason, remarks } = req.body;

        const rejectionReason = reason || remarks;

        if (!rejectionReason || !rejectionReason.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Rejection reason is required'
            });
        }

        console.log('=========================================');
        console.log('❌ REJECT APPLICATION');
        console.log('👤 Admin ID:', adminId);
        console.log('📋 App ID:', req.params.id);
        console.log('📝 Reason:', rejectionReason);
        console.log('=========================================');

        const application = await Application.findById(req.params.id)
            .populate('agent', 'name email');

        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }

        if (application.status === 'rejected') {
            return res.status(400).json({
                success: false,
                message: 'Application already rejected'
            });
        }

        // Update
        application.status = 'rejected';
        application.reviewedBy = adminId;
        application.reviewedAt = new Date();
        application.rejectionReason = rejectionReason;

        // Add to history
        application.statusHistory = application.statusHistory || [];
        application.statusHistory.push({
            status: 'rejected',
            changedBy: adminId,
            changedByModel: 'Admin',
            changedAt: new Date(),
            remarks: rejectionReason
        });

        await application.save();

        console.log('✅ Application rejected:', application.applicationNumber);

        res.status(200).json({
            success: true,
            message: 'Application rejected successfully',
            data: application
        });

    } catch (error) {
        console.error('❌ Reject Error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to reject application'
        });
    }
};

// ============================================
// @desc    Send back for review (Admin)
// @route   PATCH /api/admin/applications/:id/review
// @access  Private (Admin)
// ============================================
export const reviewApplication = async (req, res) => {
    try {
        const adminId = req.admin?._id || req.admin?.id;
        const { remarks } = req.body;

        if (!remarks || !remarks.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Review remarks are required'
            });
        }

        console.log('=========================================');
        console.log('🔄 REVIEW APPLICATION');
        console.log('👤 Admin ID:', adminId);
        console.log('📋 App ID:', req.params.id);
        console.log('📝 Remarks:', remarks);
        console.log('=========================================');

        const application = await Application.findById(req.params.id)
            .populate('agent', 'name email');

        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }

        // Update - send back to agent for corrections
        application.status = 'pending-documents';
        application.reviewedBy = adminId;
        application.reviewedAt = new Date();
        application.adminRemarks = remarks;

        // Add to history
        application.statusHistory = application.statusHistory || [];
        application.statusHistory.push({
            status: 'pending-documents',
            changedBy: adminId,
            changedByModel: 'Admin',
            changedAt: new Date(),
            remarks: remarks
        });

        await application.save();

        console.log('✅ Application sent for review:', application.applicationNumber);

        res.status(200).json({
            success: true,
            message: 'Application sent back to agent for review',
            data: application
        });

    } catch (error) {
        console.error('❌ Review Error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to send for review'
        });
    }
};