import mongoose from "mongoose";

const agentOTPStoreSchema = new mongoose.Schema({
    // ===== All form data temporarily stored =====
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        unique: true
    },
    
    // Personal Information
    name: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    
    // Personal Details
    dateOfBirth: {
        type: Date,
        required: true
    },
    gender: {
        type: String,
        required: true
    },
    nationality: {
        type: String,
        default: ''
    },
    
    // Identification
    idType: {
        type: String,
        required: true
    },
    idNumber: {
        type: String,
        required: true
    },
    idFile: {
        type: String,
        required: true
    },
    idFilePublicId: {
        type: String
    },
    
    // Professional
    jobTitle: {
        type: String,
        required: true
    },
    company: {
        type: String
    },
    experience: {
        type: String,
        required: true
    },
    education: {
        type: String,
        required: true
    },
    specialization: {
        type: String
    },
    
    // Location
    address: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    state: {
        type: String,
        required: true
    },
    pincode: {
        type: String,
        required: true
    },
    country: {
        type: String,
        default: 'India'
    },
    
    // Languages & Skills
    languages: {
        type: [String],
        default: []
    },
    skills: {
        type: [String],
        default: []
    },
    bio: {
        type: String
    },
    
    // OTP
    otp: {
        type: String,
        required: true
    },
    otpExpiry: {
        type: Date,
        required: true
    },
    
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 300
    }
});

const AgentOTPStore = mongoose.model('AgentOTPStore', agentOTPStoreSchema);
export default AgentOTPStore;