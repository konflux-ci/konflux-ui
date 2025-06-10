// AsyncQueue: Runs async tasks one by one, in order.
// Used for I/O-heavy tasks like API calls.

// ✅ Each task is async (e.g., fetch), so it doesn't block the main thread.
// ✅ Tasks run sequentially — next one starts only after the previous one finishes.
// ✅ Keeps UI responsive even when running many network requests.
// ⚠️ Do not use it for CPU-heavy tasks (e.g., big loops), those will block the UI.
// Example: Used to link secrets to components without blocking UI.
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
