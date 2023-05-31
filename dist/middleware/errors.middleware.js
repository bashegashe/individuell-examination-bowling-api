"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = exports.errorHandler = exports.logErrors = void 0;
function logErrors(err, req, res, next) {
    if (err.stack) {
        console.error(`${err.stack}\n`);
    }
    next(err);
}
exports.logErrors = logErrors;
function errorHandler(err, req, res, next) {
    var _a, _b;
    const statusCodeFromError = (_b = (_a = err.status) !== null && _a !== void 0 ? _a : err.statusCode) !== null && _b !== void 0 ? _b : 500;
    res.status(statusCodeFromError).json({
        status: 'error',
        message: err.message || 'Internal Server Error'
    });
}
exports.errorHandler = errorHandler;
function notFoundHandler(req, res) {
    res.status(404).json({
        status: 'error',
        message: `[${req.method}] ${req.originalUrl} not found!`
    });
}
exports.notFoundHandler = notFoundHandler;
