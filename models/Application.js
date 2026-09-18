// backend/models/Application.js
import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema({
    // ===== APPLICATION NUMBER =====
    applicationNumber: {
        type: String,
        unique: true,
        sparse: true
    },

    // ===== AGENT INFO =====
    agent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Agent',
        required: [true, 'Agent reference is required'],
        index: true
    },
    agentName: String,
    agentEmail: String,
    agentPhone: String,

    // ===== STUDENT INFO =====
    student: {
        firstName: { type: String, required: true, trim: true },
        lastName: { type: String, required: true, trim: true },
        email: { type: String, required: true, lowercase: true, trim: true },
        phone: { type: String, required: true, trim: true },
        dateOfBirth: { type: Date, required: true },
        gender: {
            type: String,
            enum: ['Male', 'Female', 'Other'],
            required: true
        },
        nationality: { type: String, default: 'Indian' },
        category: {
            type: String,
            enum: ['General', 'OBC', 'SC', 'ST', 'EWS', 'Other'],
            default: 'General'
        },
        profileImage: String,
        address: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        pincode: { type: String, required: true },
        country: { type: String, default: 'India' },
        fatherName: String,
        motherName: String,
        guardianPhone: String,
        annualIncome: Number
    },

    // ===== ACADEMIC INFO =====
    academic: {
        previousEducation: String,
        previousInstitute: String,
        passingYear: Number,
        percentage: Number,
        gpa: Number
    },

    // ===== SELECTED REFERENCES =====
    university: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'University',
        required: [true, 'University is required']
    },
    universityName: String,

    program: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Program',
        required: [true, 'Program is required']
    },
    programName: String,

    // ===== DOCUMENTS =====
    documents: {
        // Basic Documents
        idProof: String,
        marksheet: String,
        incomeCertificate: String,
        profilePhoto: String,
        previousCertificate: String,
        bankPassbook: String,

        // Additional Documents
        dependentPassport1: String,
        sponsorDetails: String,
        bankStatementLetter: String,
        visaCopies: String,
        pendingDocument: String,
        visaDocument: String,
        studyContinuousLetter: String,
        dependentPassport2: String,
        transferStudents: String,

        // Conditional Letter & Invoice
        signedCAL: String,
        paymentInvoice: String,

        // Payment Receipts
        applicationFeeReceipt: String,
        englishExamReceipt: String,
        internalAdmissionFee: String,
        bankCheckDraft: String,
        insuranceFee: String,
        tuitionFee: String,

        // Final Admission Portfolio
        finalSignedCAL: String,
        finalPaymentInvoice: String,
        initialAdmissionPortfolio: String,
        deferralAdmissionPortfolio: String
    },

    // ===== STATEMENTS =====
    statement: {
        whyDeserve: {
            type: String,
            required: true,
            maxlength: 2000
        },
        achievements: String
    },

    // ===== BANK DETAILS =====
    bankDetails: {
        accountHolderName: String,
        accountNumber: String,
        ifscCode: String,
        bankName: String,
        branchName: String
    },

    // ===== STATUS =====
    status: {
        type: String,
        enum: [
            'draft',
            'submitted',
            'under-review',
            'pending-documents',
            'approved',
            'rejected',
            'scholarship-disbursed'
        ],
        default: 'submitted'
    },

    // ===== ADMIN REVIEW =====
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    },
    reviewedAt: Date,
    adminRemarks: String,
    rejectionReason: String,

    // ===== TIMELINE =====
    submittedAt: {
        type: Date,
        default: Date.now
    },

    // ===== FLAGS =====
    isVerified: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    }

}, {
    timestamps: true
});

// ============================================
// INDEXES
// ============================================
applicationSchema.index({ agent: 1, status: 1 });
applicationSchema.index({ university: 1, program: 1 });
applicationSchema.index({ status: 1, createdAt: -1 });

// ============================================
// AUTO-GENERATE APPLICATION NUMBER
// ============================================
applicationSchema.pre('save', async function(next) {
    if (this.isNew && !this.applicationNumber) {
        try {
            const year = new Date().getFullYear();
            const count = await mongoose.model('Application').countDocuments();
            const num = String(count + 1).padStart(5, '0');
            this.applicationNumber = `APP-${year}-${num}`;
            console.log('✅ Generated:', this.applicationNumber);
        } catch (error) {
            console.error('❌ Error generating application number:', error);
            return next(error);
        }
    }
});

const Application = mongoose.model('Application', applicationSchema);
export default Application;