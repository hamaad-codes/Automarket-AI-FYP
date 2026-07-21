import nodemailer from 'nodemailer';

let cachedTransporter = null;

const getTransporter = () => {
    const host = (process.env.SMTP_HOST || 'smtp.gmail.com').trim();
    const port = parseInt(process.env.SMTP_PORT || '587');
    const rawUser = process.env.SMTP_USER;
    const rawPass = process.env.SMTP_PASS;

    if (!rawUser || !rawPass) {
        return null;
    }

    const user = rawUser.trim();
    const pass = rawPass.replace(/\s+/g, '');

    if (!cachedTransporter) {
        if (host.includes('gmail')) {
            cachedTransporter = nodemailer.createTransport({
                host: 'smtp.gmail.com',
                port: 465,
                secure: true,
                pool: true,
                maxConnections: 5,
                maxMessages: 100,
                connectionTimeout: 5000,
                greetingTimeout: 5000,
                socketTimeout: 10000,
                auth: {
                    user: user,
                    pass: pass
                }
            });
        } else {
            cachedTransporter = nodemailer.createTransport({
                host: host,
                port: port,
                secure: port === 465,
                pool: true,
                connectionTimeout: 5000,
                greetingTimeout: 5000,
                socketTimeout: 10000,
                auth: {
                    user: user,
                    pass: pass
                }
            });
        }
    }

    return cachedTransporter;
};

export const sendVerificationEmail = async (email, code, type = 'verification') => {
    const rawUser = process.env.SMTP_USER;
    const transporter = getTransporter();

    if (!transporter) {
        console.log('\n======================================================');
        console.log(`[SMTP NOT CONFIGURED] ${type.toUpperCase()} Code for ${email} is: ${code}`);
        console.log('======================================================\n');
        return false;
    }

    const senderUser = rawUser ? rawUser.trim() : 'hamaadzafar7@gmail.com';
    const isReset = type === 'reset';
    const subject = isReset ? 'Reset Your AutoMarket Password' : 'Verify Your AutoMarket Account';
    const heading = isReset ? 'Password Reset Request' : 'Welcome to AutoMarket!';
    const message = isReset 
        ? 'You requested to reset your password. Please enter the 6-digit verification code below to proceed:' 
        : 'Thank you for registering with AutoMarket. Please verify your email address by entering the 6-digit verification code below:';

    const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #ffffff;">
            <h2 style="color: #6366f1; text-align: center; margin-bottom: 20px;">${heading}</h2>
            <p style="font-size: 16px; color: #374151; line-height: 1.5;">${message}</p>
            <div style="background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #4f46e5; border-radius: 8px; margin: 25px 0; border: 1px solid #e5e7eb;">
                ${code}
            </div>
            <p style="font-size: 14px; color: #6b7280; line-height: 1.5;">This verification code is valid for 10-15 minutes. If you did not request this, you can safely ignore this email.</p>
            <hr style="border: 0; border-top: 1px solid #f3f4f6; margin: 25px 0;" />
            <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">AutoMarket Automotive AI Marketplace &copy; 2026</p>
        </div>
    `;

    try {
        await transporter.sendMail({
            from: `"AutoMarket" <${senderUser}>`,
            to: email,
            subject: subject,
            html: htmlContent
        });

        console.log(`[EMAIL SENT] ${type} email sent successfully to ${email}`);
        return true;
    } catch (error) {
        console.error('Error sending email:', error.message);
        console.log('\n======================================================');
        console.log(`[FALLBACK LOG] ${type.toUpperCase()} Code for ${email} is: ${code}`);
        console.log('======================================================\n');
        return false;
    }
};
