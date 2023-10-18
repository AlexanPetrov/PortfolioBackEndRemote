const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const nodemailer = require("nodemailer");
const validator = require("validator");
const rateLimit = require("express-rate-limit");
const app = express();

require("dotenv").config();

const allowedOrigins = process.env.CORS_ORIGIN.split(",");

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW, 10),
  max: parseInt(process.env.RATE_LIMIT_MAX, 10),
});

app.use(express.json());

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: "GET,POST,DELETE",
    credentials: true,
  })
);

app.use(morgan("combined"));

// Address inline styling errors before production!
res.setHeader(
  "Content-Security-Policy",
  "default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; script-src 'self' 'unsafe-inline'; connect-src 'self' https://portfolio-submissions.onrender.com"
);

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SENDER_EMAIL,
    pass: process.env.SENDER_PASSWORD,
  },
});

app.post("/submit", limiter, (req, res) => {
  let { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).send("All fields are required.");
  }

  name = validator.escape(name);
  email = validator.escape(email);
  subject = validator.escape(subject);
  message = validator.escape(message);

  if (!validator.isEmail(email)) {
    return res.status(400).send("Invalid email format.");
  }

  const sql =
    "INSERT INTO contact_submissions (name, email, subject, message) VALUES (?, ?, ?, ?)";
  const values = [name, email, subject, message];

  const mailOptions = {
    from: email,
    to: process.env.RECEIVER_EMAIL,
    subject: "New Contact Submission",
    text: `Name: ${name}, Email: ${email}, Subject: ${subject}, Message: ${message}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
});

app.listen(process.env.SERVER_PORT, () => {
  console.log(`Server running at http://localhost:${process.env.SERVER_PORT}`);
});
