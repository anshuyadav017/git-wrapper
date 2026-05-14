class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

class RateLimitError extends AppError {
  constructor(message = 'GitHub API rate limit exceeded') {
    super(message, 429);
  }
}

class ExternalServiceError extends AppError {
  constructor(message = 'External service error') {
    super(message, 502);
  }
}

const errorHandler = (err, req, res, _next) => {
  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'Internal server error';

  if (process.env.NODE_ENV === 'development') {
    console.error(`[Error] ${err.message}`);
    console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    statusCode
  });
};

module.exports = { AppError, NotFoundError, RateLimitError, ExternalServiceError, errorHandler };