"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
require("./utils/db.util");
const express_1 = __importDefault(require("express"));
const routes_1 = __importDefault(require("./routes"));
const errors_middleware_1 = require("./middleware/errors.middleware");
const app = (0, express_1.default)();
const PORT = (_a = process.env.PORT) !== null && _a !== void 0 ? _a : 3000;
app.use(express_1.default.json());
app.use('/api', routes_1.default);
app.use(errors_middleware_1.notFoundHandler);
app.use(errors_middleware_1.logErrors);
app.use(errors_middleware_1.errorHandler);
app.listen(PORT, () => {
    console.log(`🚀 Server started on port ${PORT}!`);
});
