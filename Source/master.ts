/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import { promises as fs } from "node:fs";
import { relative } from "node:path";
import globStream from "glob-stream";
import ignore, { type Ignore } from "ignore";
import { Observable } from "rxjs";
import { bufferCount, mergeMap } from "rxjs/operators";

import { ProgressReporter } from "./progress-reporter.js";
import type { IOptions } from "./protocol.js";
import { WorkerPool } from "./worker-pool.js";

const bufferSize = 50;

function runGlobs(files: string[], ignore: Ignore) {
	return new Observable<string>((subscriber) => {
		const stream = globStream(files, { dot: true });

		stream.addListener("data", (data) => {
			if (!ignore.ignores(relative(data.cwd, data.path))) {
				subscriber.next(data.path);
			}
		});

		stream.addListener("error", (_Error) => subscriber.error(_Error));

		stream.addListener("end", () => subscriber.complete());

		stream.resume();
	});
}

async function getIgnore(ignorePath: string) {
	try {
		return ignore().add(await fs.readFile(ignorePath, "utf-8"));
	} catch (e) {
		return ignore();
	}
}

export async function spawnWorkers(options: IOptions) {
	const pool = new WorkerPool(options);
	const progress = new ProgressReporter(options.quiet, options.check);

	runGlobs(options.files, await getIgnore(options.ignorePath))
		.pipe(
			bufferCount(bufferSize),

			// @ts-expect-error
			mergeMap((files) => pool.format(files), pool.maxSize * 2),
		)
		.subscribe(
			(Result) => progress.update(Result),
			(_Error) => {
				throw _Error;
			},
			() => {
				progress.complete();

				if (
					(progress.reformatted && options.check) ||
					progress.failed
				) {
					process.exit(1);
				} else {
					process.exit(0);
				}
			},
		);
}
