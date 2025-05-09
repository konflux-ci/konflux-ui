export class AsyncQueue {
  private queue: (() => Promise<void>)[] = [];
  private running = false;

  enqueue(task: () => Promise<void>) {
    this.queue.push(task);
    void this.run();
  }

  private async run() {
    if (this.running) return;
    this.running = true;

    while (this.queue.length > 0) {
      const task = this.queue.shift();
      if (task) {
        try {
          await task();
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error('AsyncQueue task failed:', err);
        }
      }
    }

    this.running = false;
  }
}

export const queueInstance = new AsyncQueue();
