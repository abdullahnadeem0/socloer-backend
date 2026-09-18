// backend/controllers/programController.js
import Program from "../models/Program.js";
import University from "../models/University.js";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================
// 1. CREATE PROGRAM
// ============================================
export const createProgram = async (req, res) => {
    try {
        console.log("=========================================");
        console.log("📝 CREATE PROGRAM");
        console.log("=========================================");

        const { name, description, university } = req.body;

        // ===== VALIDATION =====
        if (!name || !university) {
            return res.status(400).json({
                success: false,
                message: "Name and university are required"
            });
        }

        // ===== CHECK UNIVERSITY =====
        const uni = await University.findById(university);
        if (!uni) {
            return res.status(404).json({
                success: false,
                message: "University not found"
            });
        }

        // ===== CHECK EXISTING =====
        const existing = await Program.findOne({
            name: name.trim(),
            university: university
        });

        if (existing) {
            return res.status(400).json({
                success: false,
                message: "Program with this name already exists in this university"
            });
        }

        // ===== SAVE BANNER =====
        let bannerUrl = '';
        if (req.file) {
            const uploadDir = path.join(__dirname, '../uploads/programs');
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }
            
            const timestamp = Date.now();
            const randomStr = Math.random().toString(36).substring(2, 8);
            const ext = path.extname(req.file.originalname);
            const fileName = `banner_${timestamp}_${randomStr}${ext}`;
            const filePath = path.join(uploadDir, fileName);
            
            fs.writeFileSync(filePath, req.file.buffer);
            bannerUrl = `/uploads/programs/${fileName}`;
            
            console.log("✅ Banner saved:", bannerUrl);
        }

        // ===== CREATE PROGRAM =====
        const program = new Program({
            name: name.trim(),
            description: description || '',
            banner: bannerUrl,
            university,
            createdBy: req.admin.id
        });

        await program.save();
        await program.populate('university', 'name code shortName');

        console.log("✅ Program created:", program.name);

        res.status(201).json({
            success: true,
            message: "Program created successfully",
            program
        });

    } catch (error) {
        console.error("❌ Create Program Error:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};

// ============================================
// 2. GET ALL PROGRAMS
// ============================================
export const getAllPrograms = async (req, res) => {
    try {
        const { search, university, status } = req.query;

        let query = {};

        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }

        if (university) query.university = university;
        if (status === 'active') query.isActive = true;
        if (status === 'inactive') query.isActive = false;

        const programs = await Program.find(query)
            .populate('university', 'name code shortName logo city state')
            .sort({ createdAt: -1 });

        const stats = {
            total: await Program.countDocuments(),
            active: await Program.countDocuments({ isActive: true }),
            inactive: await Program.countDocuments({ isActive: false }),
            featured: await Program.countDocuments({ isFeatured: true })
        };

        res.json({
            success: true,
            count: programs.length,
            stats,
            data: programs,           // ⭐ Frontend uses "data"
            programs: programs        // ⭐ Keep for backwards compat
        });

    } catch (error) {
        console.error("❌ Get All Programs Error:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching programs",
            error: error.message
        });
    }
};

// ============================================
// 3. GET PROGRAM BY ID
// ============================================
export const getProgramById = async (req, res) => {
    try {
        const { id } = req.params;

        const program = await Program.findById(id)
            .populate('university', 'name code shortName logo city state address email phone');

        if (!program) {
            return res.status(404).json({
                success: false,
                message: "Program not found"
            });
        }

        res.json({
            success: true,
            data: program,          // ⭐ Add "data"
            program                 // Keep for backwards compat
        });

    } catch (error) {
        console.error("❌ Get Program Error:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching program",
            error: error.message
        });
    }
};

// ============================================
// 4. UPDATE PROGRAM
// ============================================
export const updateProgram = async (req, res) => {
    try {
        const { id } = req.params;

        const program = await Program.findById(id);
        if (!program) {
            return res.status(404).json({
                success: false,
                message: "Program not found"
            });
        }

        // ===== HANDLE NEW BANNER =====
        if (req.file) {
            // Delete old banner
            if (program.banner) {
                const oldPath = path.join(__dirname, '..', program.banner);
                if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                }
            }

            const uploadDir = path.join(__dirname, '../uploads/programs');
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            const timestamp = Date.now();
            const randomStr = Math.random().toString(36).substring(2, 8);
            const ext = path.extname(req.file.originalname);
            const fileName = `banner_${timestamp}_${randomStr}${ext}`;
            const filePath = path.join(uploadDir, fileName);
            
            fs.writeFileSync(filePath, req.file.buffer);
            program.banner = `/uploads/programs/${fileName}`;

            console.log("✅ New banner saved:", program.banner);
        }

        // ===== UPDATE FIELDS =====
        const { name, description, university } = req.body;

        if (name) program.name = name.trim();
        if (description !== undefined) program.description = description;
        if (university) program.university = university;

        program.updatedBy = req.admin.id;
        await program.save();
        await program.populate('university', 'name code shortName');

        res.json({
            success: true,
            message: "Program updated successfully",
            data: program,          // ⭐ Add "data"
            program
        });

    } catch (error) {
        console.error("❌ Update Program Error:", error);
        res.status(500).json({
            success: false,
            message: "Error updating program",
            error: error.message
        });
    }
};

// ============================================
// 5. DELETE PROGRAM
// ============================================
export const deleteProgram = async (req, res) => {
    try {
        const { id } = req.params;

        const program = await Program.findById(id);
        if (!program) {
            return res.status(404).json({
                success: false,
                message: "Program not found"
            });
        }

        // Delete banner
        if (program.banner) {
            const bannerPath = path.join(__dirname, '..', program.banner);
            if (fs.existsSync(bannerPath)) {
                fs.unlinkSync(bannerPath);
            }
        }

        await Program.findByIdAndDelete(id);

        res.json({
            success: true,
            message: "Program deleted successfully"
        });

    } catch (error) {
        console.error("❌ Delete Program Error:", error);
        res.status(500).json({
            success: false,
            message: "Error deleting program",
            error: error.message
        });
    }
};

// ============================================
// 6. TOGGLE ACTIVE
// ============================================
export const toggleActive = async (req, res) => {
    try {
        const { id } = req.params;

        const program = await Program.findById(id);
        if (!program) {
            return res.status(404).json({
                success: false,
                message: "Program not found"
            });
        }

        program.isActive = !program.isActive;
        program.updatedBy = req.admin.id;
        await program.save();

        res.json({
            success: true,
            message: `Program ${program.isActive ? 'activated' : 'deactivated'} successfully`,
            data: program,
            program
        });

    } catch (error) {
        console.error("❌ Toggle Active Error:", error);
        res.status(500).json({
            success: false,
            message: "Error toggling status",
            error: error.message
        });
    }
};

// ============================================
// 7. TOGGLE FEATURED
// ============================================
export const toggleFeatured = async (req, res) => {
    try {
        const { id } = req.params;

        const program = await Program.findById(id);
        if (!program) {
            return res.status(404).json({
                success: false,
                message: "Program not found"
            });
        }

        program.isFeatured = !program.isFeatured;
        program.updatedBy = req.admin.id;
        await program.save();

        res.json({
            success: true,
            message: `Program ${program.isFeatured ? 'featured' : 'unfeatured'} successfully`,
            data: program,
            program
        });

    } catch (error) {
        console.error("❌ Toggle Featured Error:", error);
        res.status(500).json({
            success: false,
            message: "Error toggling featured",
            error: error.message
        });
    }
};

// ============================================
// 8. GET PROGRAMS BY UNIVERSITY ⭐ FIXED
// ============================================
export const getProgramsByUniversity = async (req, res) => {
    try {
        const { universityId } = req.params;

        console.log('=========================================');
        console.log('📚 GET PROGRAMS BY UNIVERSITY');
        console.log('📍 University ID:', universityId);
        console.log('👤 User:', req.agent ? 'Agent' : req.admin ? 'Admin' : 'Unknown');
        console.log('=========================================');

        // ===== VALIDATE ObjectId =====
        if (!universityId || universityId.length !== 24) {
            console.log('❌ Invalid ObjectId');
            return res.status(400).json({
                success: false,
                message: 'Invalid University ID'
            });
        }

        // ===== BUILD FILTER =====
        const filter = { university: universityId };

        // Agent ko sirf active programs dikhao
        if (req.agent) {
            filter.isActive = true;
        }

        // ===== FETCH PROGRAMS =====
        const programs = await Program.find(filter)
            .populate('university', 'name code shortName logo city state')
            .sort({ createdAt: -1 });

        console.log('📥 Programs found:', programs.length);

        // ===== RETURN WITH MULTIPLE KEYS =====
        res.json({
            success: true,
            count: programs.length,
            data: programs,           // ⭐ Frontend uses "data"
            programs: programs        // ⭐ Keep for backwards compat
        });

    } catch (error) {
        console.error("❌ Get Programs by University Error:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching programs",
            error: error.message
        });
    }
};