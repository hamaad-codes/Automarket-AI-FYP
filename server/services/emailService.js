import nodemailer from 'nodemailer';

let cachedTransporter = null;

const createTransporterConfig = (host, port, user, pass) => {
    const isGmail = host.includes('gmail');
    const targetHost = isGmail ? 'smtp.gmail.com' : host;
    const targetPort = port || 587;

    return nodemailer.createTransport({
        host: targetHost,
        port: targetPort,
        secure: targetPort === 465,
        requireTLS: targetPort === 587,
        family: 4, // Force IPv4
        pool: true,
        maxConnections: 5,
        maxMessages: 100,
        connectionTimeout: 5000, // Fast 5s timeout to prevent hanging on blocked cloud ports
        greetingTimeout: 5000,
        socketTimeout: 5000,
        tls: {
            rejectUnauthorized: false
        },
        auth: {
            user: user,
            pass: pass
        }
    });
};

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
        cachedTransporter = createTransporterConfig(host, port, user, pass);
    }

    return cachedTransporter;
};

// Resend HTTP API Sender (Works over HTTPS Port 443 - Never blocked by Render)
const sendViaResendApi = async (email, code, subject, htmlContent) => {
    const rawKey = process.env.RESEND_API_KEY || '';
    const cleanKey = rawKey.trim().replace(/^["']|["']$/g, '');
    if (!cleanKey) return false;

    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${cleanKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: 'AutoMarket <onboarding@resend.dev>',
                to: [email],
                subject: subject,
                html: htmlContent
            })
        });

        const data = await response.json();
        if (response.ok) {
            console.log(`[RESEND API SUCCESS] Verification email sent to ${email} (ID: ${data.id})`);
            return true;
        } else {
            console.error('[RESEND API ERROR]', data);
            return false;
        }
    } catch (err) {
        console.error('[RESEND API FETCH ERROR]', err.message);
        return false;
    }
};

export const sendVerificationEmail = async (email, code, type = 'verification') => {
    const rawUser = process.env.SMTP_USER;
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

    // 1. Try Resend HTTP API first if key exists (Recommended for Render cloud hosting)
    if (process.env.RESEND_API_KEY) {
        const resendSuccess = await sendViaResendApi(email, code, subject, htmlContent);
        if (resendSuccess) return true;
    }

    // 2. Try SMTP Nodemailer Transporter (Works locally)
    const transporter = getTransporter();
    if (!transporter) {
        console.log('\n======================================================');
        console.log(`[SMTP NOT CONFIGURED] ${type.toUpperCase()} Code for ${email} is: ${code}`);
        console.log('======================================================\n');
        return false;
    }

    const senderUser = rawUser ? rawUser.trim() : 'hamaadzafar7@gmail.com';

    try {
        await transporter.sendMail({
            from: `"AutoMarket" <${senderUser}>`,
            to: email,
            subject: subject,
            html: htmlContent
        });

        console.log(`[EMAIL SENT VIA SMTP] ${type} email sent successfully to ${email}`);
        return true;
    } catch (error) {
        console.error(`Error sending email via SMTP (${error.message}). Note: Render free tier blocks outbound SMTP ports 25/465/587.`);
        console.log('\n======================================================');
        console.log(`[RENDER FALLBACK LOG] ${type.toUpperCase()} Code for ${email} is: ${code}`);
        console.log('======================================================\n');
        return false;
    }
};
