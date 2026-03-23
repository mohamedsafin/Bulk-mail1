const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");

const app = express();

// CORS - allow your Vercel frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
  methods: ["GET", "POST"],
}));
app.use(express.json());

// Health check route for Render
app.get("/", function (req, res) {
  res.json({ status: "ok", message: "Bulkmail API is running" });
});

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://safin:safin123@ac-pk4w2za-shard-00-00.ezad9pk.mongodb.net:27017,ac-pk4w2za-shard-00-01.ezad9pk.mongodb.net:27017,ac-pk4w2za-shard-00-02.ezad9pk.mongodb.net:27017/passkey?ssl=true&replicaSet=atlas-x5nwz9-shard-0&authSource=admin&appName=Cluster0";

mongoose.connect(MONGODB_URI)
  .then(() => console.log("Connected to DB successfully"))
  .catch((err) => console.log("DB error:", err.message));

// Model
const Credential = mongoose.model("credential", {}, "bulkmail");

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
}

// Route
app.post("/sendmail", async function (req, res) {
  const { msg, email } = req.body;

  // Validation
  if (!msg || !Array.isArray(email) || email.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Message and email list are required.",
    });
  }

  try {
    const validEmails = email
      .map((item) => String(item).trim())
      .filter((item) => isValidEmail(item));

    if (validEmails.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid email addresses were found in the uploaded file.",
      });
    }

    // Fetch credentials from DB
    const data = await Credential.findOne().lean();

    if (!data?.user || !data?.pass) {
      return res.status(500).json({
        success: false,
        message: "Email credentials not found in MongoDB. Add a document with user and pass fields.",
      });
    }

    const user = data.user;
    const pass = data.pass;

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  family: 4,
  auth: {
    user: user,
    pass: pass,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

await transporter.verify();

const sendPromises = validEmails.map((e) =>
  transporter.sendMail({
    from: user,
    to: e,
    subject: "Bulk Mail",
    text: msg,
  })
);

    await Promise.all(sendPromises);

    res.json({
      success: true,
      message: `Emails sent successfully to ${validEmails.length} recipient(s).`,
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to send emails.",
    });
  }
});

// Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, function () {
  console.log("Server is running");
});
