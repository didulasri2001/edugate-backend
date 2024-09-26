// Backend: Node.js + Express
const express = require("express");
const admin = require("firebase-admin");
const cors = require("cors");
const nodemailer = require("nodemailer");
const randomToken = require("random-token").create(
  "abcdefghijklmnopqrstuvwxzyABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
);

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(require("./serviceAccountKey.json")),
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
});
const db = admin.firestore();
// Helper function to generate a 6-digit OTP
const generateNumericOtp = () => {
  return Math.floor(100000 + Math.random() * 900000);
};

const app = express();
app.use(express.json()); // To parse JSON requests
app.use(cors());

let tempOtpStore = {}; // Temporary store to hold OTPs, you can use a DB instead

// Configure your email service
const transporter = nodemailer.createTransport({
  service: "gmail", // Use your email provider
  auth: {
    user: "didusri2001@gmail.com",
    pass: "quta paab lncc xluw", // Your email password (you may need to enable 'less secure apps' in your Gmail settings)
  },
});
// Route to send OTP to email
app.post("/api/send-email-otp", (req, res) => {
  const { email } = req.body;

  const otp = generateNumericOtp();

  // Store the OTP for verification later (e.g., store it in your database)
  tempOtpStore[email] = otp;

  // Send the OTP to the user's email
  const mailOptions = {
    from: "didusri2001@gmail.com", // Sender address
    to: email, // Recipient's email address
    subject: "Your OTP Code",
    text: `Your OTP code is: ${otp}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending email:", error);
      return res
        .status(500)
        .send({ success: false, message: "Failed to send OTP email" });
    }
    console.log("Email sent:", info.response);
    res.status(200).send({ success: true, message: "OTP sent to email" });
  });
});

// Route to verify OTP
app.post("/api/verify-email-otp", (req, res) => {
  const { email, enteredOtp } = req.body;

  // Check if the entered OTP matches the one we sent
  if (tempOtpStore[email] === enteredOtp) {
    // OTP matched, proceed with sign-up or other actions
    // Remove OTP after successful verification
    delete tempOtpStore[email];

    res
      .status(200)
      .send({ success: true, message: "Email OTP verified successfully!" });
  } else {
    res.status(400).send({ success: false, message: "Invalid OTP" });
  }
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
