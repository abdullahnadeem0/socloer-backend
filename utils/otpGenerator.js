export const generateOTP = () => {
    // 6-digit OTP generate karein
    return Math.floor(100000 + Math.random() * 900000).toString();
};

export const isOTPExpired = (expiryDate) => {
    if (!expiryDate) return true;
    return new Date() > new Date(expiryDate);
};