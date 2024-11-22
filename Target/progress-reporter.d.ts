import { type IFormatResults } from "./protocol.js";

/**
 * Handles reporting progress of the formatting to the console.
 */
export declare class ProgressReporter {
	private readonly check;
	total: number;
	reformatted: number;
	failed: number;
	private spinner?;
	constructor(quiet: boolean, check: boolean);
	/**
	 * Increments the count of the total and reformatted files.
	 */
	update(results: IFormatResults): void;
	/**
	 * Prints a completion message.
	 */
	complete(): void;
	private getMessage;
}
