// Backend: Node.js + Express
const express = require("express");
const admin = require("firebase-admin");
const twilio = require("twilio");

// const accountSid = TWILIO_ACCOUNT_SID; // Twilio Account SID from environment
// const authToken = TWILIO_AUTH_TOKEN; // Twilio Auth Token from environment
console.log(accountSid, authToken);
// const client = new twilio(accountSid, authToken);
const cors = require("cors");

const client = require("twilio")(accountSid, authToken);

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

const app = express();
app.use(express.json()); // To parse JSON requests
app.use(cors());

// Route: Send OTP
app.post("/api/send-otp", async (req, res) => {
  const phoneNumber = req.body.phoneNumber;
  console.log(phoneNumber);
  const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP

  try {
    client.verify.v2
      .services("VA469a1564f9d0fb38209d4f56f0a45e62")
      .verifications.create({ to: phoneNumber, channel: "sms" })
      .then((verification) => console.log(verification.sid));
    // const message = await client.messages.create({
    //   body: `Your OTP is ${otp}`,
    //   from: "+94705841668", // Twilio Phone Number (replace with your Twilio number)
    //   to: phoneNumber,
    // });

    // Save OTP to Firestore
    const otpRef = db.collection("otps").doc(phoneNumber);
    await otpRef.set({
      otp,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(200).send({ success: true, message: "OTP sent successfully!" });
  } catch (err) {
    console.error("Error sending OTP:", err);
    res.status(500).send({ success: false, message: "Failed to send OTP" });
  }
});

// Route: Verify OTP
app.post("/api/verify-otp", async (req, res) => {
  const { phoneNumber, enteredOtp } = req.body;

  try {
    // Retrieve OTP from Firestore
    const otpRef = db.collection("otps").doc(phoneNumber);
    const otpDoc = await otpRef.get();

    if (!otpDoc.exists) {
      return res
        .status(400)
        .send({ success: false, message: "OTP not found!" });
    }

    const { otp } = otpDoc.data();

    // Compare OTP
    if (otp !== enteredOtp) {
      return res.status(400).send({ success: false, message: "Invalid OTP!" });
    }

    // OTP matched, create Firebase Auth user (optional)
    const user = await admin.auth().createUser({
      phoneNumber: phoneNumber,
    });

    res.status(200).send({ success: true, user });
  } catch (err) {
    console.error("Error verifying OTP:", err);
    res.status(500).send({ success: false, message: "Failed to verify OTP" });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
