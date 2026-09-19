import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// ============================================
// EMAIL CONFIGURATION
// ============================================
console.log('📧 Email Configuration:');
console.log(`   EMAIL_USER: ${process.env.EMAIL_USER || '❌ Missing'}`);
console.log(`   EMAIL_PASS: ${process.env.EMAIL_PASS ? '✅ Loaded' : '❌ Missing'}`);

const EMAIL_USER = process.env.EMAIL_USER || 'techrosoft.academy@gmail.com';
const EMAIL_PASS = process.env.EMAIL_PASS || 'nlqx jqis yrtr hloy';

// ============================================
// TRANSPORTER  ⭐ (تبدیل شدہ)
// ============================================
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS
    },
    family: 4,                    // ⭐ IPv4 زبردستی
    tls: {
        rejectUnauthorized: false
    },
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 30000
});

transporter.verify((error, success) => {
    if (error) {
        console.error('❌ Email configuration error:', error.message);
    } else {
        console.log('✅ Email server is ready to send messages');
        console.log(`📧 Using email: ${EMAIL_USER}`);
    }
});

// ============================================
// SHARED EMAIL STYLES
// ============================================
const emailStyles = `
    body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: #f0f2f5; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .card { background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .header { text-align: center; padding: 30px; border-radius: 12px; color: white; }
    .header h1 { margin: 0; font-size: 28px; }
    .header p { margin: 8px 0 0 0; opacity: 0.9; }
    .content { padding: 30px 0; }
    .content h2 { color: #1a202c; margin-top: 0; font-size: 22px; }
    .content p { color: #4a5568; font-size: 16px; line-height: 1.6; }
    .otp-box { text-align: center; padding: 25px; background: #f1f5f9; border-radius: 12px; margin: 25px 0; }
    .otp-box h1 { font-size: 52px; letter-spacing: 16px; color: #2563eb; margin: 0; font-weight: 700; }
    .expiry { color: #718096; font-size: 14px; text-align: center; margin: 0; }
    .reason-box { background: #fff5f5; border-left: 4px solid #e53e3e; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .reason-box strong { color: #c53030; }
    .button { display: inline-block; padding: 14px 32px; background: #2563eb; color: white; text-decoration: none; border-radius: 10px; font-weight: 600; margin: 20px 0; }
    hr { border: none; border-top: 1px solid #e2e8f0; margin: 25px 0; }
    .footer { color: #a0aec0; font-size: 13px; text-align: center; margin: 0; }
    .footer-small { color: #a0aec0; font-size: 12px; text-align: center; margin-top: 12px; }
`;

// ============================================
// 1. SEND OTP EMAIL
// ============================================
export const sendOTPEmail = async (email, otp, type) => {
    try {
        if (!EMAIL_USER || !EMAIL_PASS) {
            console.error('❌ Email credentials missing');
            console.log('📧 OTP (testing):', otp);
            return false;
        }

        console.log(`📧 Sending OTP to: ${email}`);
        console.log(`🔑 OTP: ${otp}`);

        let subject = '🔐 Verification Code - Solreshapip';
        let title = 'Verification Code';
        let description = 'Please use the verification code below to complete your verification.';
        let headerColor = 'linear-gradient(135deg, #2563eb, #1d4ed8)';

        if (type === 'signup') {
            subject = '🔐 Verify Your Admin Account - Solreshapip';
            title = 'Admin Account Verification';
            description = 'Thank you for signing up! Please use the verification code below to complete your registration.';
        } else if (type === 'signin') {
            subject = '🔐 Login Verification Code - Solreshapip';
            title = 'Login Verification';
            description = 'Please use the verification code below to login to your account.';
        } else if (type === 'agent_signup') {
            subject = '🔐 Verify Your Agent Account - Solreshapip';
            title = 'Agent Account Verification';
            description = 'Thank you for registering as an agent! Please use the verification code below to complete your registration.';
        }

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>${emailStyles}</style>
            </head>
            <body>
                <div class="container">
                    <div class="card">
                        <div class="header" style="background: ${headerColor};">
                            <h1>🔐 Solreshapip</h1>
                            <p>${title}</p>
                        </div>
                        <div class="content">
                            <h2>${title}</h2>
                            <p>${description}</p>
                            <div class="otp-box">
                                <h1>${otp}</h1>
                            </div>
                            <p class="expiry">⏰ This code will expire in <strong>2 minutes</strong></p>
                            <hr />
                            <p class="footer">If you didn't request this, please ignore this email.</p>
                            <p class="footer-small">This is an automated message from <strong>Solreshapip</strong>.</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;

        const mailOptions = {
            from: `"Solreshapip" <${EMAIL_USER}>`,
            to: email,
            subject: subject,
            html: html
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ OTP email sent successfully to ${email}`);
        console.log(`📧 Message ID: ${info.messageId}`);
        return true;

    } catch (error) {
        console.error('❌ Email send error:', error.message);
        return false;
    }
};

// ============================================
// 2. SEND APPROVAL EMAIL
// ============================================
export const sendApprovalEmail = async (email, name) => {
    try {
        console.log(`📧 Sending approval email to: ${email}`);

        const subject = '🎉 Congratulations! Your Agent Account is Approved - Solreshapip';

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>${emailStyles}</style>
            </head>
            <body>
                <div class="container">
                    <div class="card">
                        <div class="header" style="background: linear-gradient(135deg, #48bb78, #38a169);">
                            <h1>🎉 Congratulations!</h1>
                            <p>Your Agent Account is Approved</p>
                        </div>
                        <div class="content">
                            <h2>Hello ${name},</h2>
                            <p>Great news! We are pleased to inform you that your agent account has been <strong style="color: #48bb78;">approved</strong> by our admin team.</p>
                            
                            <div style="background: #f0fff4; border-left: 4px solid #48bb78; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                <p style="margin: 0; color: #22543d; font-size: 16px;">
                                    <strong>✅ You are now verified and available on our website!</strong>
                                </p>
                            </div>

                            <p>You can now:</p>
                            <ul style="color: #4a5568; font-size: 16px; line-height: 1.8;">
                                <li>Login to your agent dashboard</li>
                                <li>Start accepting client requests</li>
                                <li>Manage your profile and listings</li>
                                <li>Grow your business with us</li>
                            </ul>

                            <div style="text-align: center; margin: 30px 0;">
                                <a href="http://localhost:3000/agent/login" class="button">Login to Your Account</a>
                            </div>

                            <p>Welcome aboard! We're excited to have you as part of our team.</p>
                            
                            <hr />
                            <p class="footer">If you have any questions, feel free to contact our support team.</p>
                            <p class="footer-small">This is an automated message from <strong>Solreshapip</strong>.</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;

        const mailOptions = {
            from: `"Solreshapip" <${EMAIL_USER}>`,
            to: email,
            subject: subject,
            html: html
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Approval email sent to ${email}`);
        console.log(`📧 Message ID: ${info.messageId}`);
        return true;

    } catch (error) {
        console.error('❌ Approval email error:', error.message);
        return false;
    }
};

// ============================================
// 3. SEND REJECTION EMAIL
// ============================================
export const sendRejectionEmail = async (email, name, reason) => {
    try {
        console.log(`📧 Sending rejection email to: ${email}`);

        const subject = '📋 Update on Your Agent Application - Solreshapip';

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>${emailStyles}</style>
            </head>
            <body>
                <div class="container">
                    <div class="card">
                        <div class="header" style="background: linear-gradient(135deg, #e53e3e, #c53030);">
                            <h1>📋 Application Update</h1>
                            <p>Status of Your Agent Application</p>
                        </div>
                        <div class="content">
                            <h2>Hello ${name},</h2>
                            <p>Thank you for your interest in becoming an agent with us. After careful review of your application, we regret to inform you that we are unable to approve it at this time.</p>
                            
                            <div class="reason-box">
                                <strong>📝 Reason for Rejection:</strong>
                                <p style="margin: 8px 0 0 0; color: #4a5568; font-size: 15px;">${reason}</p>
                            </div>

                            <p><strong>What can you do next?</strong></p>
                            <ul style="color: #4a5568; font-size: 16px; line-height: 1.8;">
                                <li>Review the reason mentioned above</li>
                                <li>Address the issues if possible</li>
                                <li>Contact our support team for clarification</li>
                                <li>You may reapply after resolving the issues</li>
                            </ul>

                            <p>If you believe this is a mistake or have any questions, please don't hesitate to contact our support team.</p>
                            
                            <hr />
                            <p class="footer">We appreciate your interest and wish you the best.</p>
                            <p class="footer-small">This is an automated message from <strong>Solreshapip</strong>.</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;

        const mailOptions = {
            from: `"Solreshapip" <${EMAIL_USER}>`,
            to: email,
            subject: subject,
            html: html
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Rejection email sent to ${email}`);
        console.log(`📧 Message ID: ${info.messageId}`);
        return true;

    } catch (error) {
        console.error('❌ Rejection email error:', error.message);
        return false;
    }
};

// ============================================
// 4. SEND PENDING EMAIL
// ============================================
export const sendPendingEmail = async (email, name) => {
    try {
        console.log(`📧 Sending pending email to: ${email}`);

        const subject = '⏳ Your Agent Application is Under Review - Solreshapip';

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>${emailStyles}</style>
            </head>
            <body>
                <div class="container">
                    <div class="card">
                        <div class="header" style="background: linear-gradient(135deg, #ed8936, #dd6b20);">
                            <h1>⏳ Application Under Review</h1>
                            <p>We're reviewing your application</p>
                        </div>
                        <div class="content">
                            <h2>Hello ${name},</h2>
                            <p>Thank you for registering as an agent with us! Your application status is currently <strong style="color: #dd6b20;">Pending</strong>.</p>
                            
                            <div style="background: #fffaf0; border-left: 4px solid #ed8936; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                <p style="margin: 0; color: #c05621; font-size: 16px;">
                                    <strong>⏳ Your application is being reviewed by our team.</strong>
                                </p>
                            </div>

                            <p>Our admin team is carefully reviewing your submitted information and documents. This process typically takes 24-48 hours.</p>

                            <p><strong>What happens next?</strong></p>
                            <ul style="color: #4a5568; font-size: 16px; line-height: 1.8;">
                                <li>Our team will verify your documents</li>
                                <li>We'll review your professional details</li>
                                <li>You'll receive an email once a decision is made</li>
                                <li>If approved, you can start using the platform immediately</li>
                            </ul>

                            <p>We appreciate your patience during this process. If you have any questions in the meantime, feel free to contact us.</p>
                            
                            <hr />
                            <p class="footer">Thank you for your patience!</p>
                            <p class="footer-small">This is an automated message from <strong>Solreshapip</strong>.</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;

        const mailOptions = {
            from: `"Solreshapip" <${EMAIL_USER}>`,
            to: email,
            subject: subject,
            html: html
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Pending email sent to ${email}`);
        console.log(`📧 Message ID: ${info.messageId}`);
        return true;

    } catch (error) {
        console.error('❌ Pending email error:', error.message);
        return false;
    }
};