const express = require("express");
const dotenv = require("dotenv").config();
const hpp = require("hpp");
const cors = require("cors");
const xss = require("xss-clean");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");

const connectDB = require("./config/connectDB");
const { config } = require("./config/settings");
const { errorMiddleware } = require("./middleware/error.middleware");

// Database connection
connectDB();

const app = express();

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3000']
}));

// Set security headers
app.use(helmet());

// Rate limiting for a specific IP address
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
});

app.use(limiter);

// Body parser, URL encoding and cookies setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Data sanitization against XSS
app.use(xss());

// Data sanitization against NoSQL injection
app.use(mongoSanitize());

// Prevent HTTP parameter pollution
app.use(hpp());

// Logging all server requests
app.use(morgan("dev"));

// Static folder
app.use("/assets", express.static(__dirname + "/uploads"));

// Mount points
app.use("/api/auth", require("./routes/user.routes"));
app.use("/api/goals", require("./routes/goal.routes"));

// Custom error handler
app.use(errorMiddleware);

app.listen(config.port, () =>
  console.log(`Server running on port: ${config.port}`.cyan.italic.bold)
);

module.exports = app;
