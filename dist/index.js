#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
const cluster_1 = require("cluster");
const os_1 = require("os");
const commander = require("commander");
const prettier = require("prettier");
const { version } = require("../package.json");
function startMaster() {
    const Program = new commander.Command()
        .name("Prettier")
        .option("--check, --list-different", "Whether to list unformatted files, instead of writing them out")
        .option("--write", "Whether to write files to the output")
        .option("--concurrency [value]", "Maximum concurrency", String((0, os_1.cpus)().length))
        .option("-q, --quiet", "If set, pprettier will not output progress")
        .option("--ignore-path [value]", "Path to an ignore file", ".prettierignore")
        .version(`@playform/prettier version ${version} / prettier version ${prettier.version}`)
        .parse(process.argv);
    const opts = Program.opts();
    require("./master").spawnWorkers({
        check: opts.listDifferent,
        concurrency: opts.concurrency,
        files: Program.args,
        quiet: opts.quiet,
        write: opts.write,
        ignorePath: opts.ignorePath,
    });
}
if (module === require.main && cluster_1.default.isPrimary) {
    startMaster();
}
else if (cluster_1.default.isWorker) {
    require("./worker").startWorker();
}
//# sourceMappingURL=index.js.map