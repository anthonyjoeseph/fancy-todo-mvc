"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const t = tslib_1.__importStar(require("io-ts"));
exports.LoginUser = t.strict({
    email: t.string,
    password: t.string
});
exports.loginUserEndpoint = '/user';
exports.AddUser = t.strict({
    email: t.string,
    password: t.string,
    name: t.string
});
exports.addUserEndpoint = '/user/add';
exports.DeleteUser = t.strict({
    userid: t.number,
    password: t.string
});
exports.deleteUserEndpoint = '/user/delete';
exports.GetTodos = t.strict({
    userid: t.number
});
exports.getTodosEndpoint = '/todo';
exports.ToggleTodoComplete = t.strict({
    todoid: t.number
});
exports.toggleCompleteEndpoint = '/todo/toggle-complete';
exports.AddTodo = t.strict({
    userid: t.number,
    text: t.string
});
exports.addTodoEndpoint = '/todo/add';
exports.DeleteTodo = t.strict({
    todoid: t.number
});
exports.deleteTodoEndpoint = '/todo/delete';
//# sourceMappingURL=endpoints.js.map