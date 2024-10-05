"use strict";
/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgressReporter = void 0;
const path_1 = require("path");
const ora_1 = require("ora");
/**
 * Handles reporting progress of the formatting to the console.
 */
class ProgressReporter {
    constructor(quiet, check) {
        this.check = check;
        this.total = 0;
        this.reformatted = 0;
        this.failed = 0;
        if (!quiet) {
            this.spinner = (0, ora_1.default)("Starting...").start();
        }
    }
    /**
     * Increments the count of the total and reformatted files.
     */
    update(results) {
        this.total += results.files;
        this.reformatted += results.formatted.length;
        this.failed += results.failed.length;
        if (results.formatted.length) {
            if (this.spinner) {
                this.spinner.stop();
            }
            for (const file of results.formatted) {
                process.stdout.write(`${(0, path_1.relative)(file.base, file.path)}\r\n`);
            }
            if (this.spinner) {
                this.spinner.text = this.getMessage();
                this.spinner.start();
            }
        }
        else if (this.spinner) {
            this.spinner.text = this.getMessage();
        }
    }
    /**
     * Prints a completion message.
     */
    complete() {
        if (!this.spinner) {
            return;
        }
        if (this.check && this.reformatted) {
            this.spinner.fail(`${this.reformatted} files were not formatted`);
        }
        else {
            this.spinner.succeed(this.getMessage());
        }
    }
    getMessage() {
        return this.check
            ? `Checked ${this.total} files`
            : `Reformatted ${this.reformatted} / ${this.total} files...`;
    }
}
exports.ProgressReporter = ProgressReporter;
//# sourceMappingURL=progress-reporter.js.map