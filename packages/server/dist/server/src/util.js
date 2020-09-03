"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emptyResponseEndpoint = exports.parsedResponseSingleEndpoint = exports.parsedResponseArrayEndpoint = void 0;
const tslib_1 = require("tslib");
const pipeable_1 = require("fp-ts/pipeable");
const function_1 = require("fp-ts/function");
const E = tslib_1.__importStar(require("fp-ts/Either"));
const A = tslib_1.__importStar(require("fp-ts/Array"));
const H = tslib_1.__importStar(require("hyper-ts"));
const express_1 = require("hyper-ts/lib/express");
const TE = tslib_1.__importStar(require("fp-ts/TaskEither"));
const adt_1 = require("@morphic-ts/adt");
const PathReporter_1 = require("io-ts/lib/PathReporter");
const APIResponseError = adt_1.makeADT('tag')({
    APIRequestBody: adt_1.ofType(),
    DatabaseRequest: adt_1.ofType(),
    DatabaseResponse: adt_1.ofType(),
    JSONFormatError: adt_1.ofType()
});
const iotsErrorsToString = function_1.flow(PathReporter_1.failure, a => a.join(' '));
exports.parsedResponseArrayEndpoint = (decodeReqBody, dbRequest, decodeDBResp) => pipeable_1.pipe(H.decodeBody(decodeReqBody), H.mapLeft(errors => APIResponseError.of.APIRequestBody({ errors })), H.ichain((reqBody) => pipeable_1.pipe(TE.tryCatch(() => dbRequest(reqBody), E.toError), TE.mapLeft(error => APIResponseError.of.DatabaseRequest({ error })), TE.chain(function_1.flow(A.map(decodeDBResp), A.sequence(E.either), E.mapLeft(errors => APIResponseError.of.DatabaseResponse({ errors })), TE.fromEither)), H.fromTaskEither)), H.ichain((parsedResp) => pipeable_1.pipe(H.status(H.Status.OK), H.ichain(() => H.json(parsedResp, () => APIResponseError.of.JSONFormatError({}))))), H.orElse((error) => pipeable_1.pipe(H.status(H.Status.BadRequest), H.ichain(() => H.closeHeaders()), H.ichain(() => pipeable_1.pipe(error, APIResponseError.matchStrict({
    APIRequestBody: ({ errors }) => `Request body parse error:\n${iotsErrorsToString(errors)}`,
    DatabaseRequest: ({ error: { message } }) => `Database request error:\n${message}`,
    DatabaseResponse: ({ errors }) => `Database response parse error:\n${iotsErrorsToString(errors)}`,
    JSONFormatError: () => 'JSON formatting error',
}), H.send)))), express_1.toRequestHandler);
exports.parsedResponseSingleEndpoint = (decodeReqBody, dbRequest, decodeDBResp) => pipeable_1.pipe(H.decodeBody(decodeReqBody), H.mapLeft(errors => APIResponseError.of.APIRequestBody({ errors })), H.ichain((reqBody) => pipeable_1.pipe(TE.tryCatch(() => dbRequest(reqBody), E.toError), TE.mapLeft(error => APIResponseError.of.DatabaseRequest({ error })), TE.chain(function_1.flow(decodeDBResp, E.mapLeft(errors => APIResponseError.of.DatabaseResponse({ errors })), TE.fromEither)), H.fromTaskEither)), H.ichain((parsedResp) => pipeable_1.pipe(H.status(H.Status.OK), H.ichain(() => H.json(parsedResp, () => APIResponseError.of.JSONFormatError({}))))), H.orElse((error) => pipeable_1.pipe(H.status(H.Status.BadRequest), H.ichain(() => H.closeHeaders()), H.ichain(() => pipeable_1.pipe(error, APIResponseError.matchStrict({
    APIRequestBody: ({ errors }) => `Request body parse error:\n${iotsErrorsToString(errors)}`,
    DatabaseRequest: ({ error: { message } }) => `Database request error:\n${message}`,
    DatabaseResponse: ({ errors }) => `Database response parse error:\n${iotsErrorsToString(errors)}`,
    JSONFormatError: () => 'JSON formatting error',
}), H.send)))), express_1.toRequestHandler);
const InsertError = APIResponseError.exclude(['DatabaseResponse']);
exports.emptyResponseEndpoint = (decodeReqBody, dbRequest) => pipeable_1.pipe(H.decodeBody(decodeReqBody), H.mapLeft(errors => InsertError.of.APIRequestBody({ errors })), H.ichain((reqBody) => pipeable_1.pipe(TE.tryCatch(() => dbRequest(reqBody), E.toError), TE.mapLeft(error => InsertError.of.DatabaseRequest({ error })), H.fromTaskEither)), H.ichain(() => pipeable_1.pipe(H.status(H.Status.OK), H.ichain(() => H.closeHeaders()), H.ichain(() => H.send('')))), H.orElse((error) => pipeable_1.pipe(H.status(H.Status.BadRequest), H.ichain(() => H.closeHeaders()), H.ichain(() => pipeable_1.pipe(error, InsertError.matchStrict({
    APIRequestBody: ({ errors }) => `Request body parse error:\n${iotsErrorsToString(errors)}`,
    DatabaseRequest: ({ error: { message } }) => `Database request error:\n${message}`,
    JSONFormatError: () => 'JSON formatting error',
}), H.send)))), express_1.toRequestHandler);
//# sourceMappingURL=util.js.map