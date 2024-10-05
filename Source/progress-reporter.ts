/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import { relative } from "node:path";
import ora, { type Ora } from "ora";

import { type IFormatResults } from "./protocol.js";

/**
 * Handles reporting progress of the formatting to the console.
 */
export class ProgressReporter {
	public total = 0;

	public reformatted = 0;

	public failed = 0;

	private spinner?: Ora;

	constructor(
		quiet: boolean,
		private readonly check: boolean,
	) {
		if (!quiet) {
			this.spinner = ora("Starting...").start();
		}
	}

	/**
	 * Increments the count of the total and reformatted files.
	 */
	public update(results: IFormatResults) {
		this.total += results.files;

		this.reformatted += results.formatted.length;

		this.failed += results.failed.length;

		if (results.formatted.length > 0) {
			if (this.spinner) {
				this.spinner.stop();
			}

			for (const file of results.formatted) {
				process.stdout.write(`${relative(file.base, file.path)}\r\n`);
			}

			if (this.spinner) {
				this.spinner.text = this.getMessage();

				this.spinner.start();
			}
		} else if (this.spinner) {
			this.spinner.text = this.getMessage();
		}
	}

	/**
	 * Prints a completion message.
	 */
	public complete() {
		if (!this.spinner) {
			return;
		}

		if (this.check && this.reformatted) {
			this.spinner.fail(`${this.reformatted} files were not formatted`);
		} else {
			this.spinner.succeed(this.getMessage());
		}
	}

	private getMessage() {
		return this.check
			? `Checked ${this.total} files`
			: `Reformatted ${this.reformatted} / ${this.total} files...`;
	}
}
