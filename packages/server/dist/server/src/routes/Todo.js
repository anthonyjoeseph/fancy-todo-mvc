"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const io_ts_1 = require("io-ts");
const express_1 = require("express");
const util_1 = require("../util");
const db_1 = tslib_1.__importDefault(require("../db"));
const model_1 = require("../../../shared/model");
const endpoints_1 = require("../../../shared/endpoints");
const router = express_1.Router();
router.post('/', util_1.parsedResponseArrayEndpoint(endpoints_1.GetTodos.decode, ({ userid }) => db_1.default.any('select * from todos where user_id = $1', [userid]), model_1.Todo.decode));
router.post('/toggle-complete', util_1.emptyResponseEndpoint(endpoints_1.ToggleTodoComplete.decode, ({ todoid }) => db_1.default.none('UPDATE todos SET completed = NOT completed WHERE id = $1', [todoid])));
router.post('/add', util_1.parsedResponseSingleEndpoint(endpoints_1.AddTodo.decode, ({ userid, text }) => db_1.default.one('INSERT INTO todos (user_id, text) VALUES ($1, $2) returning id', [userid, text], event => event.id), io_ts_1.Int.decode));
router.post('/delete', util_1.emptyResponseEndpoint(endpoints_1.DeleteTodo.decode, ({ todoid }) => db_1.default.none('DELETE FROM todos WHERE id = $1', [todoid])));
exports.default = router;
//# sourceMappingURL=Todo.js.map