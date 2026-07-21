import nodemailer from 'nodemailer';

let cachedTransporter = null;

const getTransporter = () => {
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = parseInt(process.env.SMTP_PORT || '587');
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!user || !pass) {
        return null;
    }

    if (!cachedTransporter) {
        cachedTransporter = nodemailer.createTransport({
            host: host,
            port: port,
            secure: port === 465,
            connectionTimeout: 8000, // 8s connection timeout
            greetingTimeout: 5000,   // 5s greeting timeout
            socketTimeout: 10000,    // 10s socket timeout
            auth: {
                user: user,
                pass: pass
            }
        });
    }

    return cachedTransporter;
};

export const sendVerificationEmail = async (email, code) => {
    const user = process.env.SMTP_USER;
    const transporter = getTransporter();

    if (!transporter) {
        console.log('\n======================================================');
        console.log(`[SMTP NOT CONFIGURED] Verification Code for ${email} is: ${code}`);
        console.log('======================================================\n');
        return false;
    }

    try {
        const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #ffffff;">
                <h2 style="color: #6366f1; text-align: center; margin-bottom: 20px;">Welcome to AutoMarket!</h2>
                <p style="font-size: 16px; color: #374151; line-height: 1.5;">Thank you for starting your registration. To complete your sign-up, please verify your email address by entering the 6-digit code below on the verification page:</p>
                <div style="background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #111827; border-radius: 8px; margin: 25px 0; border: 1px solid #e5e7eb;">
                    ${code}
                </div>
                <p style="font-size: 14px; color: #6b7280; line-height: 1.5;">This verification code is valid for 10 minutes. If you did not request this account creation, you can safely ignore this email.</p>
                <hr style="border: 0; border-top: 1px solid #f3f4f6; margin: 25px 0;" />
                <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">AutoMarket Automotive AI Marketplace &copy; 2026</p>
            </div>
        `;

        await transporter.sendMail({
            from: `"AutoMarket" <${user}>`,
            to: email,
            subject: 'Verify Your AutoMarket Account',
            html: htmlContent
        });

        console.log(`Verification email sent successfully to ${email}`);
        return true;
    } catch (error) {
        console.error('Error sending verification email:', error.message);
        console.log('\n======================================================');
        console.log(`[FALLBACK LOG] Verification Code for ${email} is: ${code}`);
        console.log('======================================================\n');
        return false;
    }
};
