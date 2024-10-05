/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import cluster, { type Worker } from "cluster";
import { BehaviorSubject, fromEvent, Observable } from "rxjs";
import { filter, map, switchMap, take, tap } from "rxjs/operators";

import {
	IFormatResults,
	IInitializationMessage,
	IOptions,
	MessageType,
	WorkerMessage,
	WorkerMode,
} from "./protocol";

export class WorkerExitedError extends Error {
	constructor(codeOrSignal: number | string) {
		super(`Worker exited with unexpected ${codeOrSignal} code`);
	}
}

/**
 * Pool of workers.
 */
export class WorkerPool {
	private readonly workers: Array<{
		worker: Observable<Worker>;
		active: number;
	}> = [];
	private workIdCounter = 0;

	/**
	 * Maximum size of the worker pool.
	 */
	public get maxSize() {
		return this.options.concurrency;
	}

	constructor(private readonly options: IOptions) {}

	/**
	 * Schedules the given files to be formatted.
	 */
	public format(files: string[]): Observable<IFormatResults> {
		if (this.workers.length < this.options.concurrency) {
			this.spawnWorker();
		}

		const target = this.workers[0];
		const id = this.workIdCounter++;
		target.active++;
		this.sortWorkers();

		return target.worker.pipe(
			switchMap((worker) => {
				worker.send({ type: MessageType.WorkerFiles, files, id });
				return fromEvent<[WorkerMessage]>(worker, "message");
			}),
			map(([m]) => m),
			filter((m) => m.id === id),
			take(1),
			tap(() => {
				target.active--;
				this.sortWorkers();
			}),
		);
	}

	private sortWorkers() {
		this.workers.sort((a, b) => a.active - b.active);
	}

	private spawnWorker() {
		const worker = cluster.fork();
		const subject = new BehaviorSubject(worker);
		this.workers.unshift({ worker: subject, active: 0 });

		worker.on("exit", (code, signal) =>
			subject.error(new WorkerExitedError(code ?? signal)),
		);
		worker.on("error", (err) => subject.error(err));

		worker.send({
			mode: this.options.check
				? WorkerMode.Assert
				: this.options.write
					? WorkerMode.Write
					: WorkerMode.Print,
			type: MessageType.WorkerInitialization,
		} as IInitializationMessage);
	}
}
