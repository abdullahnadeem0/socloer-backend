import mongoose from "mongoose";

const programSchema = new mongoose.Schema({
    // ===== Basic Information =====
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    banner: {
        type: String,
        default: ''
    },
    
    // ===== University =====
    university: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'University',
        required: true
    },
    
    // ===== Status =====
    isActive: {
        type: Boolean,
        default: true
    },
    isFeatured: {
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
programSchema.index({ name: 1 });
programSchema.index({ university: 1 });

const Program = mongoose.model('Program', programSchema);
export default Program;