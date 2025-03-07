const express = require("express");
const dotenv = require("dotenv").config();
const hpp = require("hpp");
const cors = require("cors");
const xss = require("xss-clean");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");

const { encryptionMiddleware, responseEncryptionMiddleware } = require("./middleware/encryption.middleware");
const connectDB = require("./config/connectDB");
const { config } = require("./config/settings");
const { errorMiddleware } = require("./middleware/error.middleware");
const logger = require("./config/winston.config");

// Database connection
connectDB();

const app = express();

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3000']
}));

// Set security headers
app.use(helmet());

// Rate limiting for specific endpoints
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per windowMs
});

const refreshTokenLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 refresh token requests per windowMs
});

app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/refreshToken', refreshTokenLimiter);

// Body parser, URL encoding and cookies setup, Encryption Middleware (selective encryption)
app.use(encryptionMiddleware);
app.use(express.json());
app.use(responseEncryptionMiddleware);
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

// Custom error handler
app.use(errorMiddleware);

app.listen(config.port, () =>
  logger.info(`Server running on port: ${config.port}`)
);

module.exports = app;