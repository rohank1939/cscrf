import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Function to generate a deterministic OTP based on email and a secret key for a given time window
// This allows the OTP to be regenerated and verified without storing it in a database.
const generateOtp = (email, secret, windowMinutes = 5) => {
  // Use a timestamp rounded to the windowMinutes to ensure OTP is valid for that period
  const now = Math.floor(Date.now() / 1000 / (windowMinutes * 60));
  const data = `${email}-${secret}-${now}`;
  const hash = crypto.createHmac('sha256', secret).update(data).digest('hex');
  // Take first 6 digits of the hash and convert to number
  const otp = parseInt(hash.substring(0, 6), 16) % 1000000;
  return String(otp).padStart(6, '0'); // Ensure it's always 6 digits
};

/**
 * Serverless API route to send an OTP to the user's email.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
export default async function handler(req, res) {
  // Ensure the request method is POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { email } = req.body;

  // Basic validation for email
  if (!email || !/\S+@\S+\.\S+/.test(email)) {
    return res.status(400).json({ error: 'Valid email is required.' });
  }

  // Retrieve environment variables for email service
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  const otpSecret = process.env.OTP_SECRET; // Secret key for OTP generation

  // Check if environment variables are set
  if (!emailUser || !emailPass || !otpSecret) {
    console.error('Missing environment variables for email or OTP secret.');
    return res.status(500).json({ error: 'Server configuration error. Email service not set up.' });
  }

  // Generate the OTP using the deterministic function
  const otp = generateOtp(email, otpSecret);

  // Configure Nodemailer transporter
  // You should replace this with your actual SMTP details (e.g., SendGrid, Mailgun, Resend)
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com', // Example: For Gmail, use 'smtp.gmail.com'
    port: 587, // Standard port for TLS
    secure: false, // true for 465, false for other ports
    auth: {
      user: emailUser,
      pass: emailPass,
    },
    tls: {
      // Do not fail on invalid certs
      rejectUnauthorized: false
    }
  });

  const mailOptions = {
    from: emailUser, // Sender address
    to: email,       // Recipient address
    subject: 'Your OTP for Entity Registration',
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #0056b3;">OTP for Email Verification</h2>
        <p>Dear User,</p>
        <p>Your One-Time Password (OTP) for verifying your email address for Entity Registration is:</p>
        <p style="font-size: 24px; font-weight: bold; color: #007bff; background-color: #f0f0f0; padding: 10px; border-radius: 5px; display: inline-block;">${otp}</p>
        <p>This OTP is valid for 5 minutes. Please do not share this with anyone.</p>
        <p>If you did not request this, please ignore this email.</p>
        <p>Thank you,</p>
        <p>The Registration Team</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`OTP sent to ${email}`);
    res.status(200).json({ message: 'OTP sent successfully!' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send OTP email. Please check server logs.' });
  }
}
