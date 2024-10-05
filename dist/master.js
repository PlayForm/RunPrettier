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
exports.spawnWorkers = spawnWorkers;
const fs_1 = require("fs");
const path_1 = require("path");
const globStream = require("glob-stream");
const ignore_1 = require("ignore");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const progress_reporter_1 = require("./progress-reporter");
const worker_pool_1 = require("./worker-pool");
const bufferSize = 50;
function runGlobs(files, ignore) {
    return new rxjs_1.Observable((subscriber) => {
        const stream = globStream(files, { dot: true });
        stream.addListener("data", (data) => {
            if (!ignore.ignores((0, path_1.relative)(data.cwd, data.path))) {
                subscriber.next(data.path);
            }
        });
        stream.addListener("error", (err) => subscriber.error(err));
        stream.addListener("end", () => subscriber.complete());
        stream.resume();
    });
}
function getIgnore(ignorePath) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            return (0, ignore_1.default)().add(yield fs_1.promises.readFile(ignorePath, "utf-8"));
        }
        catch (e) {
            return (0, ignore_1.default)();
        }
    });
}
function spawnWorkers(options) {
    return __awaiter(this, void 0, void 0, function* () {
        const pool = new worker_pool_1.WorkerPool(options);
        const progress = new progress_reporter_1.ProgressReporter(options.quiet, options.check);
        runGlobs(options.files, yield getIgnore(options.ignorePath))
            .pipe((0, operators_1.bufferCount)(bufferSize), (0, operators_1.mergeMap)((files) => pool.format(files), pool.maxSize * 2))
            .subscribe((result) => progress.update(result), (err) => {
            throw err;
        }, () => {
            progress.complete();
            if ((progress.reformatted && options.check) ||
                progress.failed) {
                process.exit(1);
            }
            else {
                process.exit(0);
            }
        });
    });
}
//# sourceMappingURL=master.js.map