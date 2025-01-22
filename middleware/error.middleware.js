const logger = require("../config/winston.config");

const errorMiddleware = (err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || "Backend error!";
  const extraDetails = err.extraDetails || "Error from backend";

  // Log the error with context
  logger.error({
    message,
    extraDetails,
    stack: err.stack,
    user: req.user ? req.user._id : null,
    path: req.path,
    method: req.method,
  });

  return res.status(status).json({
    success: false,
    message,
    extraDetails,
  });
};

module.exports = { errorMiddleware };
