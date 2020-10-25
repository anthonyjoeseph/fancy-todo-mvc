"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const t = tslib_1.__importStar(require("io-ts"));
exports.User = t.strict({
    id: t.number,
    email: t.string,
    name: t.string
});
exports.Todo = t.strict({
    id: t.number,
    text: t.string,
    completed: t.boolean
});
//# sourceMappingURL=model.js.map