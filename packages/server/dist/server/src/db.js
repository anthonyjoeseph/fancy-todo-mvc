"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const pg_promise_1 = tslib_1.__importDefault(require("pg-promise"));
require('dotenv').config();
const pgp = pg_promise_1.default();
const config = {
    host: process.env.HOST,
    port: Number(process.env.PORT),
    database: process.env.DATABASE,
    user: process.env.USER,
    password: process.env.PASSWORD
};
const db = pgp(config);
exports.default = db;
//# sourceMappingURL=db.js.map