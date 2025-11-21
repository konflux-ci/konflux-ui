/**
 * WorkerPool: Manages a pool of Web Workers for CPU-intensive tasks
 *
 * Features:
 * - Reusable worker instances
 * - Task queuing when all workers are busy
 * - Automatic worker lifecycle management
 * - Type-safe task/result handling
 */

export interface WorkerTask<T = unknown> {
  type: string;
  payload: T;
  id: string;
}

export interface WorkerResult<R = unknown> {
  type: 'SUCCESS' | 'ERROR';
  id: string;
  payload: R;
  error?: string;
}

interface PendingTask {
  task: WorkerTask;
  resolve: (result: unknown) => void;
  reject: (error: Error) => void;
}

export class WorkerPool {
  private workers: Worker[] = [];
  private availableWorkers: Worker[] = [];
  private pendingTasks: PendingTask[] = [];
  private taskCallbacks: Map<string, { resolve: (result: unknown) => void; reject: (error: Error) => void }> = new Map();

  constructor(
    private workerFactory: () => Worker,
    private poolSize: number = navigator.hardwareConcurrency || 2,
  ) {
    this.initializePool();
  }

  private initializePool() {
    for (let i = 0; i < this.poolSize; i++) {
      try {
        const worker = this.workerFactory();
        worker.addEventListener('message', this.handleWorkerMessage.bind(this));
        worker.addEventListener('error', this.handleWorkerError.bind(this));
        // Add message error handler
        worker.addEventListener('messageerror', (event) => {
          console.error('Worker message error:', event);
        });
        this.workers.push(worker);
        this.availableWorkers.push(worker);
      } catch (error) {
        console.error('Failed to create worker:', error);
      }
    }
  }

  private handleWorkerMessage(event: MessageEvent) {
    const result = event.data as WorkerResult;
    const callbacks = this.taskCallbacks.get(result.id);

    if (!callbacks) {
      console.warn(`No callback found for task ${result.id}`);
      return;
    }

    this.taskCallbacks.delete(result.id);

    if (result.type === 'SUCCESS') {
      callbacks.resolve(result.payload);
    } else {
      callbacks.reject(new Error(result.error || 'Worker task failed'));
    }

    // Mark worker as available and process next task
    const worker = event.target as Worker;
    this.availableWorkers.push(worker);
    this.processNextTask();
  }

  private handleWorkerError(event: ErrorEvent) {
    console.error('Worker error:', event);
    // Worker errors are also handled via message events
  }

  private processNextTask() {
    if (this.pendingTasks.length === 0 || this.availableWorkers.length === 0) {
      return;
    }

    const worker = this.availableWorkers.pop();
    const pending = this.pendingTasks.shift();

    if (worker && pending) {
      this.taskCallbacks.set(pending.task.id, {
        resolve: pending.resolve,
        reject: pending.reject,
      });
      worker.postMessage(pending.task);
    }
  }

  /**
   * Execute a task in the worker pool
   * @param type - Task type identifier
   * @param payload - Task data
   * @returns Promise that resolves with the task result
   */
  async execute<T = unknown, R = unknown>(type: string, payload: T): Promise<R> {
    const task: WorkerTask<T> = {
      type,
      payload,
      id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    return new Promise<R>((resolve, reject) => {
      if (this.availableWorkers.length > 0) {
        const worker = this.availableWorkers.pop();
        if (worker) {
          this.taskCallbacks.set(task.id, { resolve, reject });
          worker.postMessage(task);
        }
      } else {
        this.pendingTasks.push({ task, resolve, reject });
      }
    });
  }

  /**
   * Terminate all workers and clean up resources
   */
  terminate() {
    this.workers.forEach(worker => worker.terminate());
    this.workers = [];
    this.availableWorkers = [];
    this.pendingTasks = [];
    this.taskCallbacks.clear();
  }
}
