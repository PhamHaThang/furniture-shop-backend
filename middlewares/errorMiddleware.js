const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Lỗi hệ thống";
  const error = err.error || "INTERNAL_SERVER_ERROR";
  res.status(statusCode).json({
    success: false,
    message: message,
    error: error,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};

module.exports = {
  errorHandler,
};
