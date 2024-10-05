#!/usr/bin/env node

/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
import cluster from "node:cluster";
import { cpus } from "node:os";
import * as prettier from "prettier";

const startMaster = async () => {
	const Program = new (await import("commander")).Command()
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
			`@playform/prettier version ${process.env["VERSION_PACKAGE"] ?? "0.0.1"} / prettier version ${prettier.version}`,
		)
		.parse(process.argv);

	const opts = Program.opts();

	(await import("./master.js")).spawnWorkers({
		check: opts["listDifferent"],
		concurrency: opts["concurrency"],
		files: Program.args,
		quiet: opts["quiet"],
		write: opts["write"],
		ignorePath: opts["ignorePath"],
	});
};

if (cluster.isPrimary) {
	await startMaster();
} else if (cluster.isWorker) {
	(await import("./worker.js")).startWorker();
}
