import Admin from "../models/Admin.js";
import OTPStore from "../models/OTPStore.js";
import jwt from "jsonwebtoken";
import { generateOTP, isOTPExpired } from "../utils/otpGenerator.js";
import { sendOTPEmail } from "../services/emailService.js";

// ============================================
// 1. SIGN UP
// ============================================
export const signUp = async (req, res) => {
    try {
        const { name, email, password, confirmPassword } = req.body;

        console.log("📝 Signup request:", { name, email });

        if (!name || !email || !password || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        if (name.trim().length < 3) {
            return res.status(400).json({
                success: false,
                message: "Name must be at least 3 characters"
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address"
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters"
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Passwords do not match"
            });
        }

        const existingAdmin = await Admin.findOne({ email: email.toLowerCase() });
        if (existingAdmin) {
            return res.status(400).json({
                success: false,
                message: "Admin already exists with this email"
            });
        }

        const adminCount = await Admin.countDocuments();
        if (adminCount >= 1) {
            return res.status(400).json({
                success: false,
                message: "Only one admin account is allowed"
            });
        }

        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 2 * 60 * 1000);

        await OTPStore.findOneAndUpdate(
            { email: email.toLowerCase() },
            {
                email: email.toLowerCase(),
                name: name.trim(),
                password: password,
                otp: otp,
                otpExpiry: otpExpiry
            },
            { upsert: true, new: true }
        );

        console.log("✅ OTP saved in OTPStore");
        console.log("🔑 OTP for testing:", otp);

        try {
            await sendOTPEmail(email, otp, 'signup');
            console.log("✅ OTP email sent");
        } catch (emailError) {
            console.log("⚠️ Email error:", emailError.message);
        }

        res.status(201).json({
            success: true,
            message: "Verification code sent to your email",
            email: email,
            otp: otp
        });

    } catch (error) {
        console.error("❌ SignUp Error:", error);
        res.status(500).json({
            success: false,
            message: "Server error during signup",
            error: error.message
        });
    }
};

// ============================================
// 2. VERIFY SIGNUP OTP
// ============================================
export const verifySignUpOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        console.log("🔐 Verify Signup OTP:", { email, otp });

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: "Email and OTP are required"
            });
        }

        const tempData = await OTPStore.findOne({ email: email.toLowerCase() });
        
        if (!tempData) {
            return res.status(404).json({
                success: false,
                message: "No OTP found. Please sign up again."
            });
        }

        if (String(tempData.otp).trim() !== String(otp).trim()) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP"
            });
        }

        if (new Date() > new Date(tempData.otpExpiry)) {
            return res.status(400).json({
                success: false,
                message: "OTP has expired. Please request a new one."
            });
        }

        const admin = new Admin({
            name: tempData.name,
            email: tempData.email,
            password: tempData.password,
            isVerified: true
        });

        await admin.save();
        await OTPStore.deleteOne({ email: email.toLowerCase() });

        const token = jwt.sign(
            {
                id: admin._id,
                email: admin.email,
                name: admin.name
            },
            process.env.JWT_SECRET || "your_jwt_secret_key_here",
            { expiresIn: "7d" }
        );

        res.json({
            success: true,
            message: "Account verified and created!",
            token,
            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                isVerified: admin.isVerified,
                createdAt: admin.createdAt
            }
        });

    } catch (error) {
        console.error("❌ Verify Error:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};

// ============================================
// 3. RESEND OTP
// ============================================
export const resendOTP = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        const tempData = await OTPStore.findOne({ email: email.toLowerCase() });
        if (!tempData) {
            return res.status(404).json({
                success: false,
                message: "No OTP found. Please sign up again."
            });
        }

        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 2 * 60 * 1000);

        tempData.otp = otp;
        tempData.otpExpiry = otpExpiry;
        await tempData.save();

        try {
            await sendOTPEmail(email, otp, 'signup');
        } catch (emailError) {
            console.log("⚠️ Email error:", emailError.message);
        }

        res.json({
            success: true,
            message: "New verification code sent to your email",
            otp: otp
        });

    } catch (error) {
        console.error("❌ Resend OTP Error:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};

// ============================================
// 4. SIGN IN
// ============================================
export const signIn = async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log("🔐 Signin request:", { email });

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const admin = await Admin.findOne({ email: email.toLowerCase() });
        
        if (!admin) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials"
            });
        }

        if (!admin.isVerified) {
            return res.status(401).json({
                success: false,
                message: "Account not verified. Please verify your email first."
            });
        }

        const isPasswordValid = await admin.comparePassword(password);
        
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials"
            });
        }

        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 2 * 60 * 1000);

        console.log("🔑 Generated OTP:", otp);

        admin.otp = otp;
        admin.otpExpiry = otpExpiry;
        await admin.save();
        console.log("✅ Admin OTP updated successfully");

        try {
            await sendOTPEmail(email, otp, 'signin');
            console.log("✅ OTP email sent");
        } catch (emailError) {
            console.log("⚠️ Email error:", emailError.message);
        }

        res.json({
            success: true,
            message: "Verification code sent to your email",
            email: admin.email,
            otp: otp
        });

    } catch (error) {
        console.error("❌ SignIn Error:", error);
        res.status(500).json({
            success: false,
            message: "Server error during signin",
            error: error.message
        });
    }
};

// ============================================
// 5. VERIFY LOGIN OTP - FIXED
// ============================================
export const verifyLoginOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        console.log("=========================================");
        console.log("🔐 VERIFY LOGIN OTP ENDPOINT CALLED");
        console.log("=========================================");
        console.log("📧 Email:", email);
        console.log("🔑 Received OTP:", otp);
        console.log("🔑 OTP Type:", typeof otp);
        console.log("=========================================");

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: "Email and OTP are required"
            });
        }

        const admin = await Admin.findOne({ email: email.toLowerCase() });
        
        if (!admin) {
            console.log("❌ Admin not found");
            return res.status(404).json({
                success: false,
                message: "Admin not found"
            });
        }

        console.log("📋 Admin found:", admin.email);
        console.log("📋 Stored OTP:", admin.otp);
        console.log("📋 Stored OTP Type:", typeof admin.otp);
        console.log("📋 OTP Expiry:", admin.otpExpiry);

        // Convert both to string for comparison
        const receivedOtp = String(otp).trim();
        const storedOtp = admin.otp ? String(admin.otp).trim() : '';

        console.log("📋 After trim comparison:");
        console.log("   Stored:", storedOtp);
        console.log("   Received:", receivedOtp);
        console.log("   Match:", receivedOtp === storedOtp);

        if (!storedOtp) {
            console.log("❌ No OTP stored in database!");
            return res.status(400).json({
                success: false,
                message: "No OTP found. Please request a new one."
            });
        }

        if (receivedOtp !== storedOtp) {
            console.log("❌ OTP Mismatch!");
            return res.status(400).json({
                success: false,
                message: "Invalid OTP"
            });
        }

        if (isOTPExpired(admin.otpExpiry)) {
            console.log("❌ OTP Expired!");
            return res.status(400).json({
                success: false,
                message: "OTP has expired. Please request a new one."
            });
        }

        console.log("✅ OTP Verified Successfully!");

        admin.otp = null;
        admin.otpExpiry = null;
        admin.lastLogin = new Date();
        await admin.save();
        console.log("✅ OTP cleared from admin");

        const token = jwt.sign(
            {
                id: admin._id,
                email: admin.email,
                name: admin.name
            },
            process.env.JWT_SECRET || "your_jwt_secret_key_here",
            { expiresIn: "7d" }
        );

        console.log("✅ Login successful!");
        console.log("=========================================");

        res.json({
            success: true,
            message: "Login successful!",
            token,
            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                isVerified: admin.isVerified,
                lastLogin: admin.lastLogin
            }
        });

    } catch (error) {
        console.error("❌ Verify Login OTP Error:", error);
        res.status(500).json({
            success: false,
            message: "Server error during login verification",
            error: error.message
        });
    }
};

// ============================================
// 6. GET CURRENT ADMIN
// ============================================
export const getCurrentAdmin = async (req, res) => {
    try {
        const admin = await Admin.findById(req.admin.id)
            .select("-password -otp -otpExpiry");

        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Admin not found"
            });
        }

        res.json({
            success: true,
            admin
        });

    } catch (error) {
        console.error("❌ GetCurrentAdmin Error:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching admin profile",
            error: error.message
        });
    }
};

// ============================================
// 7. GET ALL ADMINS
// ============================================
export const getAllAdmins = async (req, res) => {
    try {
        const admins = await Admin.find()
            .select("-password -otp -otpExpiry")
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: admins.length,
            admins
        });

    } catch (error) {
        console.error("❌ GetAllAdmins Error:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching admins",
            error: error.message
        });
    }
};

// ============================================
// 8. GET ADMIN BY ID
// ============================================
export const getAdminById = async (req, res) => {
    try {
        const { id } = req.params;

        const admin = await Admin.findById(id)
            .select("-password -otp -otpExpiry");

        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Admin not found"
            });
        }

        res.json({
            success: true,
            admin
        });

    } catch (error) {
        console.error("❌ GetAdminById Error:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching admin",
            error: error.message
        });
    }
};

// ============================================
// 9. UPDATE ADMIN
// ============================================
export const updateAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, password } = req.body;

        const admin = await Admin.findById(id);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Admin not found"
            });
        }

        if (name) admin.name = name.trim();

        if (email) {
            const existingAdmin = await Admin.findOne({
                email: email.toLowerCase(),
                _id: { $ne: id }
            });
            if (existingAdmin) {
                return res.status(400).json({
                    success: false,
                    message: "Email already in use by another admin"
                });
            }
            admin.email = email.toLowerCase().trim();
        }

        if (password) {
            if (password.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: "Password must be at least 6 characters"
                });
            }
            admin.password = password;
        }

        await admin.save();

        res.json({
            success: true,
            message: "Admin updated successfully",
            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                isVerified: admin.isVerified,
                updatedAt: admin.updatedAt
            }
        });

    } catch (error) {
        console.error("❌ UpdateAdmin Error:", error);
        res.status(500).json({
            success: false,
            message: "Error updating admin",
            error: error.message
        });
    }
};

// ============================================
// 10. DELETE ADMIN
// ============================================
export const deleteAdmin = async (req, res) => {
    try {
        const { id } = req.params;

        if (req.admin && req.admin.id === id) {
            return res.status(400).json({
                success: false,
                message: "You cannot delete your own account"
            });
        }

        const admin = await Admin.findByIdAndDelete(id);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Admin not found"
            });
        }

        res.json({
            success: true,
            message: "Admin deleted successfully",
            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email
            }
        });

    } catch (error) {
        console.error("❌ DeleteAdmin Error:", error);
        res.status(500).json({
            success: false,
            message: "Error deleting admin",
            error: error.message
        });
    }
};

// ============================================
// 11. CHANGE PASSWORD
// ============================================
export const changePassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { currentPassword, newPassword, confirmNewPassword } = req.body;

        if (!currentPassword || !newPassword || !confirmNewPassword) {
            return res.status(400).json({
                success: false,
                message: "All password fields are required"
            });
        }

        if (newPassword !== confirmNewPassword) {
            return res.status(400).json({
                success: false,
                message: "New passwords do not match"
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: "New password must be at least 6 characters"
            });
        }

        const admin = await Admin.findById(id);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Admin not found"
            });
        }

        const isPasswordValid = await admin.comparePassword(currentPassword);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Current password is incorrect"
            });
        }

        admin.password = newPassword;
        await admin.save();

        res.json({
            success: true,
            message: "Password changed successfully"
        });

    } catch (error) {
        console.error("❌ ChangePassword Error:", error);
        res.status(500).json({
            success: false,
            message: "Error changing password",
            error: error.message
        });
    }
};

// ============================================
// 12. FORGOT PASSWORD
// ============================================
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        const admin = await Admin.findOne({ email: email.toLowerCase() });
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "No admin found with this email"
            });
        }

        const resetToken = jwt.sign(
            { id: admin._id, email: admin.email },
            process.env.JWT_SECRET || "your_jwt_secret_key_here",
            { expiresIn: "1h" }
        );

        admin.resetToken = resetToken;
        admin.resetTokenExpiry = Date.now() + 3600000;
        await admin.save();

        res.json({
            success: true,
            message: "Password reset link sent to your email",
            resetToken: resetToken
        });

    } catch (error) {
        console.error("❌ ForgotPassword Error:", error);
        res.status(500).json({
            success: false,
            message: "Error processing forgot password request",
            error: error.message
        });
    }
};

// ============================================
// 13. RESET PASSWORD
// ============================================
export const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { newPassword, confirmNewPassword } = req.body;

        if (!newPassword || !confirmNewPassword) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        if (newPassword !== confirmNewPassword) {
            return res.status(400).json({
                success: false,
                message: "Passwords do not match"
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters"
            });
        }

        let decoded;
        try {
            decoded = jwt.verify(
                token,
                process.env.JWT_SECRET || "your_jwt_secret_key_here"
            );
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: "Invalid or expired reset token"
            });
        }

        const admin = await Admin.findById(decoded.id);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Admin not found"
            });
        }

        admin.password = newPassword;
        admin.resetToken = null;
        admin.resetTokenExpiry = null;
        await admin.save();

        res.json({
            success: true,
            message: "Password reset successfully"
        });

    } catch (error) {
        console.error("❌ ResetPassword Error:", error);
        res.status(500).json({
            success: false,
            message: "Error resetting password",
            error: error.message
        });
    }
};