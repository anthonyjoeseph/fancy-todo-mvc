"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const App_1 = tslib_1.__importDefault(require("./App"));
const port = Number(process.env.PORT || 4000);
App_1.default.listen(port, () => {
    console.log('Express server started on port: ' + port);
});
//# sourceMappingURL=index.js.map