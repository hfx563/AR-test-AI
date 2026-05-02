class AppError extends Error {
    constructor(message, code, statusCode = 500) {
        super(message);
        this.name = 'AppError';
        this.code = code;
        this.statusCode = statusCode;
        this.timestamp = new Date().toISOString();
    }
}

module.exports = { AppError };
