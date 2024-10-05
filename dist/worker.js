"use strict";
/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startWorker = startWorker;
const fs_1 = require("fs");
const util_1 = require("util");
const prettier = require("prettier");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
/**
 * Reads the files from the observable stream and, with the specified
 * concurrency, formats them. Returns a stream of results to send back
 * to the master.
 */
function runFormatting(settings, files) {
    const output = {
        files: files.files.length,
        formatted: [],
        failed: [],
        id: files.id,
        type: 2 /* MessageType.Formatted */,
    };
    return (0, rxjs_1.of)(...files.files).pipe((0, operators_1.mergeMap)((file) => __awaiter(this, void 0, void 0, function* () {
        const contents = yield fs_1.promises.readFile(file.path, "utf-8");
        let formatted;
        try {
            formatted = yield prettier.format(contents, Object.assign(Object.assign({}, (yield prettier.resolveConfig(file.path))), { filepath: file.path }));
        }
        catch (e) {
            process.stderr.write("\r\n" + (0, util_1.inspect)(e) + "\r\n");
            output.failed.push(file);
            return output;
        }
        if (formatted === contents) {
            return output;
        }
        if (settings.mode === 0 /* WorkerMode.Write */) {
            yield fs_1.promises.writeFile(file.path, formatted);
        }
        else if (settings.mode === 1 /* WorkerMode.Print */) {
            process.stdout.write(formatted);
        }
        output.formatted.push(file);
        return output;
    })), (0, operators_1.last)());
}
function startWorker() {
    const settings = new rxjs_1.Subject();
    const files = new rxjs_1.Subject();
    process.on("message", (data) => {
        switch (data.type) {
            case 0 /* MessageType.WorkerInitialization */:
                settings.next(data);
                break;
            case 1 /* MessageType.WorkerFiles */:
                files.next(data);
                break;
        }
    });
    (0, rxjs_1.combineLatest)([settings, files])
        .pipe((0, operators_1.mergeMap)(([s, f]) => runFormatting(s, f)))
        .subscribe(
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    (message) => process.send(message), (err) => {
        throw err;
    });
}
//# sourceMappingURL=worker.js.map