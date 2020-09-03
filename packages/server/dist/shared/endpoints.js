"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteTodo = exports.AddTodo = exports.ToggleTodoComplete = exports.GetTodos = exports.DeleteUser = exports.AddUser = exports.LoginUser = void 0;
const tslib_1 = require("tslib");
const t = tslib_1.__importStar(require("io-ts"));
exports.LoginUser = t.strict({
    email: t.string,
    password: t.string
});
exports.AddUser = t.strict({
    email: t.string,
    password: t.string,
    name: t.string
});
exports.DeleteUser = t.strict({
    userid: t.number,
    password: t.string
});
exports.GetTodos = t.strict({
    userid: t.number
});
exports.ToggleTodoComplete = t.strict({
    todoid: t.number
});
exports.AddTodo = t.strict({
    userid: t.number,
    text: t.string
});
exports.DeleteTodo = t.strict({
    todoid: t.number
});
//# sourceMappingURL=endpoints.js.map