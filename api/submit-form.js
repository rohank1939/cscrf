import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Re-use the generateOtp function to verify the OTP
const generateOtp = (email, secret, windowMinutes = 5) => {
  const now = Math.floor(Date.now() / 1000 / (windowMinutes * 60));
  const data = `${email}-${secret}-${now}`;
  const hash = crypto.createHmac('sha256', secret).update(data).digest('hex');
  const otp = parseInt(hash.substring(0, 6), 16) % 1000000;
  return String(otp).padStart(6, '0');
};

/**
 * Serverless API route to submit the form data and verify OTP.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
export default async function handler(req, res) {
  // Ensure the request method is POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Extract form data and OTP from the request body
  const {
    entityName, website, sebiRegistrationNo, address, city, state,
    country, contactPerson, designation, emailId, mobile, otp
  } = req.body;

  // Basic validation for required fields
  const requiredFields = [
    'entityName', 'website', 'sebiRegistrationNo', 'address', 'city', 'state',
    'country', 'contactPerson', 'designation', 'emailId', 'mobile', 'otp'
  ];
  for (const field of requiredFields) {
    if (!req.body[field]) {
      return res.status(400).json({ error: `Missing required field: ${field}` });
    }
  }

  // Validate email format
  if (!/\S+@\S+\.\S+/.test(emailId)) {
    return res.status(400).json({ error: 'Invalid email format.' });
  }

  // Retrieve environment variables
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  const targetEmail = process.env.TARGET_EMAIL || 'pghosh27@gmail.com'; // Default target email
  const otpSecret = process.env.OTP_SECRET; // Secret key for OTP generation

  // Check if environment variables are set
  if (!emailUser || !emailPass || !targetEmail || !otpSecret) {
    console.error('Missing environment variables for email or OTP secret.');
    return res.status(500).json({ error: 'Server configuration error. Email service not set up.' });
  }

  // --- OTP Verification ---
  const expectedOtp = generateOtp(emailId, otpSecret);

  // Allow for a small time window for OTP validity (e.g., current minute or previous minute)
  // This handles potential clock skew or slight delays in OTP generation/submission.
  const now = Math.floor(Date.now() / 1000 / (5 * 60)); // Current 5-minute window
  const prev = Math.floor((Date.now() - 5 * 60 * 1000) / 1000 / (5 * 60)); // Previous 5-minute window

  const expectedOtpCurrentWindow = generateOtp(emailId, otpSecret, 5);
  const expectedOtpPreviousWindow = generateOtp(emailId, otpSecret, 5, prev); // Pass prev timestamp explicitly

  let otpVerified = false;
  if (otp === expectedOtpCurrentWindow) {
    otpVerified = true;
  } else {
    // Check if OTP is from the immediately preceding window (e.g., if it was generated just before the minute rolled over)
    const prevWindowOtp = generateOtp(emailId, otpSecret, 5, prev);
    if (otp === prevWindowOtp) {
      otpVerified = true;
    }
  }

  if (!otpVerified) {
    console.warn(`OTP mismatch for ${emailId}. Entered: ${otp}, Expected: ${expectedOtpCurrentWindow} or ${expectedOtpPreviousWindow}`);
    return res.status(401).json({ error: 'Invalid or expired OTP. Please try again.' });
  }

  // --- Send Form Details Email ---
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com', // Example: For Gmail, use 'smtp.gmail.com'
    port: 587,
    secure: false,
    auth: {
      user: emailUser,
      pass: emailPass,
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  const mailContent = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <h2 style="color: #0056b3;">New Entity Registration Submission</h2>
      <p>A new entity registration form has been submitted with the following details:</p>
      <ul style="list-style-type: none; padding: 0;">
        <li style="margin-bottom: 8px;"><strong>Entity Name:</strong> ${entityName}</li>
        <li style="margin-bottom: 8px;"><strong>Website:</strong> <a href="${website}" target="_blank">${website}</a></li>
        <li style="margin-bottom: 8px;"><strong>SEBI Registration No:</strong> ${sebiRegistrationNo}</li>
        <li style="margin-bottom: 8px;"><strong>Address:</strong> ${address}, ${city}, ${state}, ${country}</li>
        <li style="margin-bottom: 8px;"><strong>Contact Person:</strong> ${contactPerson}</li>
        <li style="margin-bottom: 8px;"><strong>Designation:</strong> ${designation}</li>
        <li style="margin-bottom: 8px;"><strong>Email ID:</strong> ${emailId}</li>
        <li style="margin-bottom: 8px;"><strong>Mobile:</strong> ${mobile}</li>
      </ul>
      <p>This submission was made at: ${new Date().toLocaleString()}</p>
    </div>
  `;

  const mailOptions = {
    from: emailUser,
    to: targetEmail, // The specific email address to send the form details to
    subject: `New Entity Registration: ${entityName}`,
    html: mailContent,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Form details sent to ${targetEmail}`);
    res.status(200).json({ message: 'Form submitted and email sent successfully!' });
  } catch (error) {
    console.error('Error sending form details email:', error);
    res.status(500).json({ error: 'Failed to send form details email. Please check server logs.' });
  }
}
