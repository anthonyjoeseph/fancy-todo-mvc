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
router.post('/', util_1.parsedResponseSingleEndpoint(endpoints_1.LoginUser.decode, ({ email, password }) => db_1.default.one('select id, name, email from users where email = $1 and password = $2', [email, password]), model_1.User.decode));
router.post('/add', util_1.parsedResponseSingleEndpoint(endpoints_1.AddUser.decode, ({ email, password, name }) => db_1.default.one('INSERT INTO users (email, password, name) VALUES ($1, $2, $3) returning id', [email, password, name], event => event.id), io_ts_1.Int.decode));
router.post('/delete', util_1.emptyResponseEndpoint(endpoints_1.DeleteUser.decode, ({ userid, password }) => db_1.default.none('DELETE FROM users WHERE id = $1 AND password = $2', [userid, password])));
exports.default = router;
//# sourceMappingURL=User.js.map