const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Otp = require('../models/Otp');
const { sendOtpEmail } = require('../services/emailService');

/**
 * @route   POST /api/otp/send
 * @desc    Generate and send 6-digit OTP via Resend
 * @access  Public
 */
router.post('/send', async (req, res) => {
    try {
        const { email, purpose = 'signup', userName } = req.body;

        if (!email || !email.includes('@')) {
            return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Rate-limiting check: Ensure 60-second cooldown between requests
        const existingOtp = await Otp.findOne({ email: normalizedEmail, purpose });
        if (existingOtp) {
            const timeSinceCreated = (Date.now() - new Date(existingOtp.createdAt).getTime()) / 1000;
            if (timeSinceCreated < 60) {
                const waitSeconds = Math.ceil(60 - timeSinceCreated);
                return res.status(429).json({
                    success: false,
                    message: `Please wait ${waitSeconds}s before requesting a new code.`
                });
            }
            // Remove previous expired/replaced OTP for this purpose
            await Otp.deleteMany({ email: normalizedEmail, purpose });
        }

        // Generate 6-digit cryptographic numeric code (100000 to 999999)
        const generatedOtp = String(crypto.randomInt(100000, 1000000));

        // Save in MongoDB (MongoDB TTL automatically removes after 300 seconds)
        await Otp.create({
            email: normalizedEmail,
            otp: generatedOtp,
            purpose,
            attempts: 0
        });

        // Send via Resend Email Service
        try {
            await sendOtpEmail({
                to: normalizedEmail,
                otp: generatedOtp,
                purpose,
                userName: userName || normalizedEmail.split('@')[0]
            });
        } catch (emailError) {
            console.error('Email dispatch error:', emailError.message);
            // In case of Resend test domain restriction (onboarding@resend.dev can only send to account owner email),
            // return a clear error message with a fallback for local testing
            return res.status(500).json({
                success: false,
                message: `Failed to deliver email: ${emailError.message}`
            });
        }

        return res.status(200).json({
            success: true,
            message: `Verification code sent to ${normalizedEmail}. Valid for 5 minutes.`
        });
    } catch (err) {
        console.error('Error in /api/otp/send:', err);
        return res.status(500).json({ success: false, message: 'Internal server error while generating OTP' });
    }
});

/**
 * @route   POST /api/otp/verify
 * @desc    Validate 6-digit OTP
 * @access  Public
 */
router.post('/verify', async (req, res) => {
    try {
        const { email, otp, purpose = 'signup' } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ success: false, message: 'Email and verification code are required' });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const enteredOtp = String(otp).trim();

        const record = await Otp.findOne({ email: normalizedEmail, purpose });

        if (!record) {
            return res.status(400).json({
                success: false,
                message: 'Verification code has expired or does not exist. Please request a new code.'
            });
        }

        // Check failed attempts limit (max 5)
        if (record.attempts >= 5) {
            await Otp.deleteOne({ _id: record._id });
            return res.status(429).json({
                success: false,
                message: 'Too many incorrect attempts. Code invalidated. Please request a new one.'
            });
        }

        if (record.otp !== enteredOtp) {
            record.attempts += 1;
            await record.save();
            const remaining = 5 - record.attempts;
            return res.status(400).json({
                success: false,
                message: `Incorrect code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
            });
        }

        // Successfully verified: Delete single-use OTP
        await Otp.deleteOne({ _id: record._id });

        return res.status(200).json({
            success: true,
            verified: true,
            message: 'Email identity verified successfully!'
        });
    } catch (err) {
        console.error('Error in /api/otp/verify:', err);
        return res.status(500).json({ success: false, message: 'Internal server error while verifying OTP' });
    }
});

module.exports = router;

