const notFoundMiddleware = (req, res, next) => {
    const error = new Error(`Route not found: ${req.originalUrl}`);
    error.statusCode = 404;
    next(error);
};

const errorMiddleware = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;

    res.status(statusCode).json({
        message: err.message || "Internal server error",
        statusCode
    });
};

module.exports = {
    notFoundMiddleware,
    errorMiddleware
};