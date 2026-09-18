// backend/controllers/dropdownController.js
import University from '../models/University.js';
import Program from '../models/Program.js';

// ============================================
// @desc    Get all active universities (for dropdown)
// @route   GET /api/agent/dropdowns/universities
// @access  Private (Agent)
// ============================================
export const getUniversities = async (req, res) => {
    try {
        console.log('🎓 GET UNIVERSITIES for dropdown');

        const universities = await University.find({ isActive: true })
            .select('name shortName code logo city state universityType')
            .sort({ name: 1 });

        console.log('📥 Found:', universities.length);

        res.status(200).json({
            success: true,
            count: universities.length,
            data: universities
        });

    } catch (error) {
        console.error('❌ Get Universities Error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// @desc    Get programs by university (for dropdown)
// @route   GET /api/agent/dropdowns/programs/:universityId
// @access  Private (Agent)
// ============================================
export const getProgramsByUniversity = async (req, res) => {
    try {
        const { universityId } = req.params;
        console.log('📚 GET PROGRAMS for University:', universityId);

        const programs = await Program.find({
            university: universityId,
            isActive: true
        })
            .select('name description banner isFeatured')
            .sort({ name: 1 });

        console.log('📥 Found:', programs.length);

        res.status(200).json({
            success: true,
            count: programs.length,
            data: programs
        });

    } catch (error) {
        console.error('❌ Get Programs Error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};