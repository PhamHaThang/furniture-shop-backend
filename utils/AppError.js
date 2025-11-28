class AppError extends Error {
  constructor(statusCode, message, error) {
    super(message);
    this.statusCode = statusCode;
    this.error = error;
    Error.captureStackTrace(this, this.constructor);
  }
}
module.exports = AppError;
