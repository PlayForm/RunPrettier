#!/usr/bin/env node

/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
import cluster from "cluster";
import { cpus } from "os";
import * as commander from "commander";
import * as prettier from "prettier";

const { version } = require("../package.json");

function startMaster() {
	const Program = new commander.Command()
		.name("Prettier")
		.option(
			"--check, --list-different",
			"Whether to list unformatted files, instead of writing them out",
		)
		.option("--write", "Whether to write files to the output")
		.option(
			"--concurrency [value]",
			"Maximum concurrency",
			String(cpus().length),
		)
		.option("-q, --quiet", "If set, pprettier will not output progress")
		.option(
			"--ignore-path [value]",
			"Path to an ignore file",
			".prettierignore",
		)
		.version(
			`@playform/prettier version ${version} / prettier version ${prettier.version}`,
		)
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

if (module === require.main && cluster.isPrimary) {
	startMaster();
} else if (cluster.isWorker) {
	require("./worker").startWorker();
}
