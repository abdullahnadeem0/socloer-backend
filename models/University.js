import mongoose from "mongoose";

const universitySchema = new mongoose.Schema({
    // ===== Basic Information =====
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    shortName: {
        type: String,
        trim: true,
        uppercase: true
    },
    code: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        uppercase: true
    },
    logo: {
        type: String,
        default: ''
    },
    
    // ===== Contact Information =====
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    alternatePhone: {
        type: String,
        trim: true
    },
    website: {
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
    country: {
        type: String,
        default: 'India',
        trim: true
    },
    pincode: {
        type: String,
        required: true,
        trim: true
    },
    location: {
        type: String, // Google Maps link or coordinates
        default: ''
    },
    
    // ===== Owner/Manager Information =====
    ownerManager: {
        name: {
            type: String,
            required: true,
            trim: true
        },
        designation: {
            type: String,
            required: true,
            trim: true,
            enum: ['Owner', 'Manager', 'Director', 'Principal', 'Dean', 'Registrar', 'Other']
        },
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true
        },
        phone: {
            type: String,
            required: true,
            trim: true
        },
        alternatePhone: {
            type: String,
            trim: true
        },
        address: {
            type: String,
            trim: true
        },
        city: {
            type: String,
            trim: true
        },
        state: {
            type: String,
            trim: true
        },
        pincode: {
            type: String,
            trim: true
        }
    },
    
    // ===== Additional Info =====
    description: {
        type: String,
        trim: true
    },
    establishedYear: {
        type: Number
    },
    universityType: {
        type: String,
        enum: ['Government', 'Private', 'Deemed', 'Autonomous', 'Central', 'State'],
        default: 'Private'
    },
    accreditation: {
        type: String,
        trim: true
    },
    courses: {
        type: [String],
        default: []
    },
    
    // ===== Status =====
    isActive: {
        type: Boolean,
        default: true
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    
    // ===== Metadata =====
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    }
}, {
    timestamps: true
});

// ===== Indexes =====
universitySchema.index({ name: 1 });
universitySchema.index({ code: 1 });
universitySchema.index({ city: 1, state: 1 });

const University = mongoose.model('University', universitySchema);
export default University;