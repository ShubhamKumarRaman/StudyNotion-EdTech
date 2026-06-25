const User = require("../models/User");
const OTP = require("../models/OTP");
const otpGenerator = require("otp-generator");

// Send OTP
exports.sendOTP = async (req, res) => {
    try {
        // Fetch Email from request's body
        const {email} = req.body;

        // Check if user already exists
        const userExists = await User.exists({email});

        if (userExists) {
            return res.status(409).json({
                success: false,
                message: "User already registered",
            });
        }

        // Generate OTP
        let otp;
        let existingOtp;

        do {
            otp = otpGenerator.generate(6, {
                upperCaseAlphabets: false,
                lowerCaseAlphabets: false,
                specialChars: false,
                alphabets: false,
            });

            existingOtp = await OTP.findOne({otp});
        } while (existingOtp);

        console.log("Generated OTP:", otp);

        await OTP.deleteMany({email});

        await OTP.create({
            email,
            otp,
        });

        return res.status(200).json({
            success: true,
            message: "OTP sent successfully",
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};