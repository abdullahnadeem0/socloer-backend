// backend/models/Payment.js
import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
    // ===== PAYMENT TYPE =====
    type: {
        type: String,
        enum: ['receive', 'send'],   // receive = paisa aaya, send = paisa bheja
        required: true
    },

    // ===== PAYMENT NUMBER =====
    paymentNumber: {
        type: String,
        unique: true
    },

    // ===== AMOUNT =====
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: [0, 'Amount cannot be negative']
    },

    currency: {
        type: String,
        default: 'PKR',
        enum: ['PKR', 'INR', 'USD']
    },

    // ===== FROM/TO INFO =====
    // For Receive: From whom
    // For Send: To whom
    fromName: String,
    fromEmail: String,
    fromPhone: String,
    
    toName: String,
    toEmail: String,
    toPhone: String,

    // ===== AGENT REFERENCE (for send payment) =====
    agent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Agent'
    },
    agentName: String,
    agentEmail: String,

    // ===== APPLICATION REFERENCE (optional) =====
    application: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Application'
    },
    applicationNumber: String,

    // ===== STUDENT REFERENCE (for receive) =====
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Application'
    },
    studentName: String,

    // ===== PAYMENT DETAILS =====
    paymentMethod: {
        type: String,
        enum: ['Bank Transfer', 'Cash', 'Cheque', 'Online', 'UPI', 'Other'],
        default: 'Bank Transfer'
    },

    transactionId: String,       // Bank/UPI transaction ID
    bankName: String,
    accountNumber: String,

    // ===== NOTE =====
    note: {
        type: String,
        maxlength: 500
    },

    // ===== STATUS =====
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'cancelled'],
        default: 'completed'
    },

    // ===== DATE =====
    paymentDate: {
        type: Date,
        default: Date.now
    },

    // ===== METADATA =====
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: true
    },
    createdByName: String,

    // ===== ATTACHMENTS =====
    receipt: String,              // Receipt image/PDF URL
    invoice: String,

    // ===== FLAGS =====
    isActive: {
        type: Boolean,
        default: true
    }

}, {
    timestamps: true
});

// ============================================
// AUTO-GENERATE PAYMENT NUMBER
// ============================================
paymentSchema.pre('save', async function(next) {
    if (this.isNew && !this.paymentNumber) {
        const year = new Date().getFullYear();
        const count = await mongoose.model('Payment').countDocuments();
        const num = String(count + 1).padStart(5, '0');
        const prefix = this.type === 'receive' ? 'RCV' : 'SND';
        this.paymentNumber = `${prefix}-${year}-${num}`;
    }
});

// ============================================
// INDEXES
// ============================================
paymentSchema.index({ type: 1, status: 1 });
paymentSchema.index({ paymentDate: -1 });
paymentSchema.index({ agent: 1 });
paymentSchema.index({ application: 1 });

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;