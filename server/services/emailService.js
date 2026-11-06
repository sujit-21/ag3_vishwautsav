const nodemailer = require('nodemailer');

let transporter = null;

const getTransporter = () => {
    if (!transporter) {
        const user = process.env.EMAIL_USER || process.env.GMAIL_USER;
        const pass = process.env.EMAIL_PASS || process.env.GMAIL_APP_PASSWORD;

        if (user && pass) {
            transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: user.trim(),
                    pass: pass.trim().replace(/\s+/g, '')
                }
            });
        }
    }
    return transporter;
};

/**
 * Send Branded OTP Email via Brevo HTTPS API (or Nodemailer fallback)
 * @param {Object} params
 * @param {string} params.to - Recipient email address
 * @param {string} params.otp - 6-digit OTP code
 * @param {string} params.purpose - 'signup' | 'login' | 'pass_download' | 'reset_password'
 * @param {string} [params.userName] - Optional recipient name
 */
const sendOtpEmail = async ({ to, otp, purpose = 'Verification', userName = 'Valued Member' }) => {
    const brevoApiKey = process.env.BREVO_API_KEY;
    const senderEmail = (process.env.EMAIL_USER || process.env.BREVO_SENDER_EMAIL || 'sovitgupta70@gmail.com').trim();
    const senderName = process.env.EMAIL_SENDER_NAME || 'VishwaUtsav';

    const purposeTitles = {
        signup: 'Account Registration Verification',
        login: 'Instant Passkey Login',
        pass_download: 'Official Pass Download Authorization',
        reset_password: 'Password Reset Verification'
    };

    const title = purposeTitles[purpose] || 'Security Verification Code';

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 15px;">
            <tr>
                <td align="center">
                    <table width="100%" max-width="540" cellpadding="0" cellspacing="0" style="max-width: 540px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08); border: 1px solid #e2e8f0;">
                        <!-- Header Banner -->
                        <tr>
                            <td style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 36px 30px; text-align: center;">
                                <div style="display: inline-block; background: rgba(234, 88, 12, 0.15); border: 1.5px solid rgba(234, 88, 12, 0.4); border-radius: 12px; padding: 8px 16px; margin-bottom: 12px;">
                                    <span style="color: #ea580c; font-size: 13px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase;">VISHWAUTSAV AUTH</span>
                                </div>
                                <h1 style="color: #ffffff; font-size: 22px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">${title}</h1>
                            </td>
                        </tr>

                        <!-- Body Content -->
                        <tr>
                            <td style="padding: 36px 32px 28px 32px;">
                                <p style="color: #334155; font-size: 15px; margin: 0 0 18px 0; line-height: 1.6;">
                                    Hello <strong>${userName}</strong>,
                                </p>
                                <p style="color: #64748b; font-size: 14px; margin: 0 0 24px 0; line-height: 1.6;">
                                    Use the 6-digit verification code below to authorize your request. This code is confidential and expires in <strong>5 minutes</strong>.
                                </p>

                                <!-- OTP Box -->
                                <div style="background: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 16px; padding: 22px; text-align: center; margin: 24px 0;">
                                    <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; color: #ea580c; letter-spacing: 8px; display: inline-block;">
                                        ${otp}
                                    </span>
                                </div>

                                <p style="color: #94a3b8; font-size: 12px; margin: 20px 0 0 0; line-height: 1.5; text-align: center;">
                                    ⚠️ Never share this one-time code with anyone. If you did not make this request, please safely disregard this email.
                                </p>
                            </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                            <td style="background-color: #f8fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                                <p style="color: #94a3b8; font-size: 11px; margin: 0; font-weight: 600;">
                                    &copy; ${new Date().getFullYear()} VishwaUtsav Platform • Secure Cryptographic Access
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    `;

    // 1. Primary Dispatch: Brevo HTTPS REST API (Port 443 - 100% reliable on Render)
    if (brevoApiKey) {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'api-key': brevoApiKey.trim(),
                'content-type': 'application/json',
                'accept': 'application/json'
            },
            body: JSON.stringify({
                sender: {
                    name: senderName,
                    email: senderEmail
                },
                to: [
                    { email: to, name: userName }
                ],
                subject: `[VishwaUtsav] Your Verification Code is ${otp}`,
                htmlContent: htmlContent
            })
        });

        const data = await response.json();
        if (!response.ok) {
            console.error('Brevo API Error:', data);
            throw new Error(data.message || 'Failed to dispatch email via Brevo');
        }

        return data;
    }

    // 2. Secondary Dispatch: Nodemailer SMTP
    const transport = getTransporter();
    if (transport) {
        const mailOptions = {
            from: `${senderName} <${senderEmail}>`,
            to,
            subject: `[VishwaUtsav] Your Verification Code is ${otp}`,
            html: htmlContent
        };
        return await transport.sendMail(mailOptions);
    }

    throw new Error('Email credentials not configured. Please set BREVO_API_KEY in your environment.');
};

module.exports = {
    sendOtpEmail
};
