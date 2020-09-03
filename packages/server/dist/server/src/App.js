"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const express_1 = tslib_1.__importDefault(require("express"));
const User_1 = tslib_1.__importDefault(require("./routes/User"));
const Todo_1 = tslib_1.__importDefault(require("./routes/Todo"));
const app = express_1.default();
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use('/api/user', User_1.default);
app.use('/api/todo', Todo_1.default);
exports.default = app;
//# sourceMappingURL=App.js.map