const User = require("../models/User");
const OTP = require("../models/OTP");
const Profile = require("../models/Profile");
const otpGenerator = require("otp-generator");
const bcrypt = require("bcrypt");

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

//Signup
exports.signUp = async (req, res) => {
    try {
        //Data fetch from request body
        const {firstName, lastName, email, password, confirmPassword, accountType, contactNumber, otp} = req.body;

        //Validate data
        if (!firstName || !lastName || !email || !password || !confirmPassword || !contactNumber || !otp) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            })
        }
        // Match both password
        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Password and confirmPassword value doesn't match, please try again",
            })
        }
        //Check user already exists or not
        const existingUser = await User.exists({email});

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "User already registered",
            })
        }

        //Find most recent OTP for the user
        const recentOTP = await OTP.findOne({email})
            .sort({createdAt: -1});
        console.log(recentOTP);

        //Validate otp
        if (!recentOTP) {
            return res.status(400).json({
                success: false,
                message: "OTP expired",
            });
        }

        if (otp !== recentOTP.otp) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP",
            });
        }

        await OTP.deleteMany({email});

        //Hash Password
        const hashedPassword = await bcrypt.hash(password, 10);
        //Entry create in DB
        const profileDetails = await Profile.create({
            gender: null,
            dateOfBirth: null,
            about: null,
            contactNumber: null,
        })
        const user = await User.create({
            firstName,
            lastName,
            email,
            contactNumber,
            password: hashedPassword,
            accountType,
            additionalDetails: profileDetails,
            image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`,
        })
        // return res
        return res.status(200).json({
            success: true,
            message: "User  is registered successfully",
            user,
        })
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "User cannot be registered. Please try again"
        })
    }
}