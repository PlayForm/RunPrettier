import { Observable } from "rxjs";

import { type IFormatResults, type IOptions } from "./protocol.js";

export declare class WorkerExitedError extends Error {
	constructor(codeOrSignal: number | string);
}
/**
 * Pool of workers.
 */
export declare class WorkerPool {
	private readonly options;
	private readonly workers;
	private workIdCounter;
	/**
	 * Maximum size of the worker pool.
	 */
	get maxSize(): number;
	constructor(options: IOptions);
	/**
	 * Schedules the given files to be formatted.
	 */
	format(files: string[]): Observable<IFormatResults> | void;
	private sortWorkers;
	private spawnWorker;
}
