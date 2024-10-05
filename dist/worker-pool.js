"use strict";
/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkerPool = exports.WorkerExitedError = void 0;
const cluster_1 = require("cluster");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
class WorkerExitedError extends Error {
    constructor(codeOrSignal) {
        super(`Worker exited with unexpected ${codeOrSignal} code`);
    }
}
exports.WorkerExitedError = WorkerExitedError;
/**
 * Pool of workers.
 */
class WorkerPool {
    /**
     * Maximum size of the worker pool.
     */
    get maxSize() {
        return this.options.concurrency;
    }
    constructor(options) {
        this.options = options;
        this.workers = [];
        this.workIdCounter = 0;
    }
    /**
     * Schedules the given files to be formatted.
     */
    format(files) {
        if (this.workers.length < this.options.concurrency) {
            this.spawnWorker();
        }
        const target = this.workers[0];
        const id = this.workIdCounter++;
        target.active++;
        this.sortWorkers();
        return target.worker.pipe((0, operators_1.switchMap)((worker) => {
            worker.send({ type: 1 /* MessageType.WorkerFiles */, files, id });
            return (0, rxjs_1.fromEvent)(worker, "message");
        }), (0, operators_1.map)(([m]) => m), (0, operators_1.filter)((m) => m.id === id), (0, operators_1.take)(1), (0, operators_1.tap)(() => {
            target.active--;
            this.sortWorkers();
        }));
    }
    sortWorkers() {
        this.workers.sort((a, b) => a.active - b.active);
    }
    spawnWorker() {
        const worker = cluster_1.default.fork();
        const subject = new rxjs_1.BehaviorSubject(worker);
        this.workers.unshift({ worker: subject, active: 0 });
        worker.on("exit", (code, signal) => subject.error(new WorkerExitedError(code !== null && code !== void 0 ? code : signal)));
        worker.on("error", (err) => subject.error(err));
        worker.send({
            mode: this.options.check
                ? 2 /* WorkerMode.Assert */
                : this.options.write
                    ? 0 /* WorkerMode.Write */
                    : 1 /* WorkerMode.Print */,
            type: 0 /* MessageType.WorkerInitialization */,
        });
    }
}
exports.WorkerPool = WorkerPool;
//# sourceMappingURL=worker-pool.js.map