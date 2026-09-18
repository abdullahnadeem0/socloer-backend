import University from "../models/University.js";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================
// 1. CREATE UNIVERSITY
// ============================================
export const createUniversity = async (req, res) => {
    try {
        console.log("=========================================");
        console.log("📝 CREATE UNIVERSITY");
        console.log("=========================================");

        const {
            name, shortName, code, email, phone, alternatePhone, website,
            address, city, state, country, pincode, location,
            ownerManager, description, establishedYear, universityType,
            accreditation, courses
        } = req.body;

        // ===== VALIDATION =====
        if (!name || !code || !email || !phone || !address || !city || !state || !pincode) {
            return res.status(400).json({
                success: false,
                message: "All required fields must be filled"
            });
        }

        // ===== CHECK EXISTING =====
        const existing = await University.findOne({
            $or: [
                { name: name.trim() },
                { code: code.toUpperCase().trim() }
            ]
        });

        if (existing) {
            return res.status(400).json({
                success: false,
                message: existing.code === code.toUpperCase() 
                    ? "University code already exists" 
                    : "University name already exists"
            });
        }

        // ===== HANDLE LOGO =====
        let logoUrl = '';
        if (req.file) {
            const uploadDir = path.join(__dirname, '../uploads/universities');
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }
            
            const fileName = `uni_${Date.now()}_${req.file.originalname}`;
            const filePath = path.join(uploadDir, fileName);
            fs.writeFileSync(filePath, req.file.buffer);
            logoUrl = `/uploads/universities/${fileName}`;
        }

        // ===== PARSE OWNER MANAGER =====
        let parsedOwnerManager = {};
        try {
            parsedOwnerManager = typeof ownerManager === 'string' 
                ? JSON.parse(ownerManager) 
                : ownerManager;
        } catch (error) {
            console.log("⚠️ Owner parse error:", error);
        }

        // ===== PARSE COURSES =====
        let parsedCourses = [];
        try {
            parsedCourses = typeof courses === 'string' 
                ? JSON.parse(courses) 
                : courses || [];
        } catch (error) {
            console.log("⚠️ Courses parse error:", error);
        }

        // ===== CREATE UNIVERSITY =====
        const university = new University({
            name: name.trim(),
            shortName: shortName?.toUpperCase().trim() || '',
            code: code.toUpperCase().trim(),
            logo: logoUrl,
            email: email.toLowerCase().trim(),
            phone: phone.trim(),
            alternatePhone: alternatePhone?.trim() || '',
            website: website?.trim() || '',
            address: address.trim(),
            city: city.trim(),
            state: state.trim(),
            country: country || 'India',
            pincode: pincode.trim(),
            location: location || '',
            ownerManager: parsedOwnerManager,
            description: description || '',
            establishedYear: establishedYear || null,
            universityType: universityType || 'Private',
            accreditation: accreditation || '',
            courses: parsedCourses,
            createdBy: req.admin.id
        });

        await university.save();

        console.log("✅ University created:", university.name);

        res.status(201).json({
            success: true,
            message: "University created successfully",
            university
        });

    } catch (error) {
        console.error("❌ Create University Error:", error);
        res.status(500).json({
            success: false,
            message: "Server error while creating university",
            error: error.message
        });
    }
};

// ============================================
// 2. GET ALL UNIVERSITIES
// ============================================
export const getAllUniversities = async (req, res) => {
    try {
        const { search, status, city, state } = req.query;
        
        let query = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { code: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { city: { $regex: search, $options: 'i' } }
            ];
        }

        if (status === 'active') query.isActive = true;
        if (status === 'inactive') query.isActive = false;
        if (status === 'verified') query.isVerified = true;
        if (status === 'unverified') query.isVerified = false;

        if (city) query.city = { $regex: city, $options: 'i' };
        if (state) query.state = { $regex: state, $options: 'i' };

        const universities = await University.find(query)
            .sort({ createdAt: -1 });

        const stats = {
            total: await University.countDocuments(),
            active: await University.countDocuments({ isActive: true }),
            inactive: await University.countDocuments({ isActive: false }),
            verified: await University.countDocuments({ isVerified: true }),
            unverified: await University.countDocuments({ isVerified: false })
        };

        res.json({
            success: true,
            count: universities.length,
            stats,
            universities
        });

    } catch (error) {
        console.error("❌ Get All Universities Error:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching universities",
            error: error.message
        });
    }
};

// ============================================
// 3. GET UNIVERSITY BY ID
// ============================================
export const getUniversityById = async (req, res) => {
    try {
        const { id } = req.params;

        const university = await University.findById(id);

        if (!university) {
            return res.status(404).json({
                success: false,
                message: "University not found"
            });
        }

        res.json({
            success: true,
            university
        });

    } catch (error) {
        console.error("❌ Get University Error:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching university",
            error: error.message
        });
    }
};

// ============================================
// 4. UPDATE UNIVERSITY
// ============================================
export const updateUniversity = async (req, res) => {
    try {
        const { id } = req.params;

        const university = await University.findById(id);
        if (!university) {
            return res.status(404).json({
                success: false,
                message: "University not found"
            });
        }

        // Handle new logo
        if (req.file) {
            // Delete old logo
            if (university.logo) {
                const oldLogoPath = path.join(__dirname, '..', university.logo);
                if (fs.existsSync(oldLogoPath)) {
                    fs.unlinkSync(oldLogoPath);
                }
            }

            const uploadDir = path.join(__dirname, '../uploads/universities');
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }
            
            const fileName = `uni_${Date.now()}_${req.file.originalname}`;
            const filePath = path.join(uploadDir, fileName);
            fs.writeFileSync(filePath, req.file.buffer);
            university.logo = `/uploads/universities/${fileName}`;
        }

        // Parse nested objects
        const updates = { ...req.body };
        
        if (updates.ownerManager && typeof updates.ownerManager === 'string') {
            try {
                updates.ownerManager = JSON.parse(updates.ownerManager);
            } catch (error) {
                console.log("⚠️ Owner parse error:", error);
            }
        }
        
        if (updates.courses && typeof updates.courses === 'string') {
            try {
                updates.courses = JSON.parse(updates.courses);
            } catch (error) {
                console.log("⚠️ Courses parse error:", error);
            }
        }

        // Update fields
        Object.keys(updates).forEach(key => {
            if (key !== 'logo' && key !== '_id' && key !== 'createdAt') {
                university[key] = updates[key];
            }
        });

        university.updatedBy = req.admin.id;
        await university.save();

        res.json({
            success: true,
            message: "University updated successfully",
            university
        });

    } catch (error) {
        console.error("❌ Update University Error:", error);
        res.status(500).json({
            success: false,
            message: "Error updating university",
            error: error.message
        });
    }
};

// ============================================
// 5. DELETE UNIVERSITY
// ============================================
export const deleteUniversity = async (req, res) => {
    try {
        const { id } = req.params;

        const university = await University.findById(id);
        if (!university) {
            return res.status(404).json({
                success: false,
                message: "University not found"
            });
        }

        // Delete logo
        if (university.logo) {
            const logoPath = path.join(__dirname, '..', university.logo);
            if (fs.existsSync(logoPath)) {
                fs.unlinkSync(logoPath);
            }
        }

        await University.findByIdAndDelete(id);

        res.json({
            success: true,
            message: "University deleted successfully"
        });

    } catch (error) {
        console.error("❌ Delete University Error:", error);
        res.status(500).json({
            success: false,
            message: "Error deleting university",
            error: error.message
        });
    }
};

// ============================================
// 6. TOGGLE ACTIVE STATUS
// ============================================
export const toggleActiveStatus = async (req, res) => {
    try {
        const { id } = req.params;

        const university = await University.findById(id);
        if (!university) {
            return res.status(404).json({
                success: false,
                message: "University not found"
            });
        }

        university.isActive = !university.isActive;
        university.updatedBy = req.admin.id;
        await university.save();

        res.json({
            success: true,
            message: `University ${university.isActive ? 'activated' : 'deactivated'} successfully`,
            university
        });

    } catch (error) {
        console.error("❌ Toggle Status Error:", error);
        res.status(500).json({
            success: false,
            message: "Error toggling status",
            error: error.message
        });
    }
};

// ============================================
// 7. TOGGLE VERIFIED STATUS
// ============================================
export const toggleVerifiedStatus = async (req, res) => {
    try {
        const { id } = req.params;

        const university = await University.findById(id);
        if (!university) {
            return res.status(404).json({
                success: false,
                message: "University not found"
            });
        }

        university.isVerified = !university.isVerified;
        university.updatedBy = req.admin.id;
        await university.save();

        res.json({
            success: true,
            message: `University ${university.isVerified ? 'verified' : 'unverified'} successfully`,
            university
        });

    } catch (error) {
        console.error("❌ Toggle Verified Error:", error);
        res.status(500).json({
            success: false,
            message: "Error toggling verified status",
            error: error.message
        });
    }
};