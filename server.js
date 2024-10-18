const express = require("express");
const admin = require("firebase-admin");
const cors = require("cors");
const nodemailer = require("nodemailer");
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
app.use(express.json());
app.use(cors());

let tempOtpStore = {};

// Configure your email service
const transporter = nodemailer.createTransport({
  service: "gmail", // Use your email provider
  auth: {
    user: "didusri2001@gmail.com",
    pass: "quta paab lncc xluw",
  },
});
// Route to send OTP to email
app.post("/api/send-email-otp", (req, res) => {
  const { email } = req.body;

  const otp = generateNumericOtp();
  console.log("Generated OTP:", otp);

  tempOtpStore[email] = otp;

  // Send the OTP to the user's email
  const mailOptions = {
    from: "didusri2001@gmail.com",
    to: email,
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
  console.log("Entered OTP:", enteredOtp);
  console.log("Temp store:", tempOtpStore);
  console.log("Temp store email:", tempOtpStore[email]);

  if (tempOtpStore[email] && tempOtpStore[email].toString() === enteredOtp) {
    delete tempOtpStore[email];

    res
      .status(200)
      .send({ success: true, message: "Email OTP verified successfully!" });
  } else {
    res.status(400).send({ success: false, message: "Invalid OTP" });
  }
});
// Route to update password
app.post("/api/update-password", async (req, res) => {
  const { email, newPassword } = req.body;
  console.log("Email:", email);
  console.log("New Password", newPassword);

  try {
    // Fetch the user by email from Firebase
    const user = await admin.auth().getUserByEmail(email);

    // Update the user's password
    await admin.auth().updateUser(user.uid, {
      password: newPassword,
    });

    res
      .status(200)
      .send({ success: true, message: "Password updated successfully!" });
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).send({
      success: false,
      message: "Failed to update password. Try again.",
    });
  }
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
