import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const agentSchema = new mongoose.Schema({
    // ===== Personal Information =====
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },

    // ===== Personal Details =====
    dateOfBirth: {
        type: Date,
        required: true
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other'],
        required: true
    },
    nationality: {
        type: String,
        default: ''
    },

    // ===== Identification =====
    idType: {
        type: String,
        enum: ['aadhar', 'pan', 'driving_license', 'passport'],
        required: true
    },
    idNumber: {
        type: String,
        required: true,
        trim: true
    },
    idFile: {
        type: String,
        required: true
    },
    idFilePublicId: {
        type: String
    },

    // ===== Professional Information =====
    jobTitle: {
        type: String,
        required: true,
        trim: true
    },
    company: {
        type: String,
        trim: true
    },
    experience: {
        type: String,
        enum: ['Fresher', '1-2 Years', '3-5 Years', '5-10 Years', '10+ Years'],
        required: true
    },
    education: {
        type: String,
        enum: ['High School', 'Diploma', "Bachelor's Degree", "Master's Degree", 'PhD', 'Professional Certification'],
        required: true
    },
    specialization: {
        type: String,
        trim: true
    },

    // ===== Location =====
    address: {
        type: String,
        required: true,
        trim: true
    },
    city: {
        type: String,
        required: true,
        trim: true
    },
    state: {
        type: String,
        required: true,
        trim: true
    },
    pincode: {
        type: String,
        required: true,
        trim: true
    },
    country: {
        type: String,
        default: 'India'
    },

    // ===== Languages & Skills =====
    languages: {
        type: [String],
        default: []
    },
    skills: {
        type: [String],
        default: []
    },

    // ===== Bio =====
    bio: {
        type: String,
        trim: true
    },

    // ===== Verification Status =====
    isVerified: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    
    // ===== ✅ NEW: APPROVAL SYSTEM =====
    approvalStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    },
    approvedAt: {
        type: Date,
        default: null
    },
    rejectionReason: {
        type: String,
        default: ''
    },
    rejectedAt: {
        type: Date,
        default: null
    },
    rejectedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    },

    // ===== OTP =====
    otp: {
        type: String,
        default: null
    },
    otpExpiry: {
        type: Date,
        default: null
    },

    // ===== Login Tracking =====
    lastLogin: {
        type: Date,
        default: null
    },
    loginCount: {
        type: Number,
        default: 0
    },

    // ===== Ratings =====
    rating: {
        type: Number,
        default: 0
    },
    totalReviews: {
        type: Number,
        default: 0
    },

    // ===== Reset Password =====
    resetToken: {
        type: String,
        default: null
    },
    resetTokenExpiry: {
        type: Date,
        default: null
    }

}, {
    timestamps: true
});

// Hash password before saving
agentSchema.pre('save', async function() {
    if (this.isModified('password')) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
});

// Compare password method
agentSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

const Agent = mongoose.model('Agent', agentSchema);
export default Agent;