/**
 * A utility class to throttle function execution to ensure a minimum interval between calls.
 * If a new call is made while another is waiting, the waiting call is cancelled/aborted.
 */
export class ThrottleQueue {
    private lastExecutionTime = 0;
    private pendingTimeout: NodeJS.Timeout | null = null;
    private pendingReject: ((err: any) => void) | null = null;

    constructor(private minIntervalMs: number) {}

    execute<T>(fn: () => Promise<T>): Promise<T> {
        // Cancel any pending execution
        if (this.pendingTimeout) {
            clearTimeout(this.pendingTimeout);
            this.pendingTimeout = null;
        }
        if (this.pendingReject) {
            this.pendingReject(
                new DOMException("Request superseded by a newer query.", "AbortError")
            );
            this.pendingReject = null;
        }

        return new Promise<T>((resolve, reject) => {
            const now = Date.now();
            const timeSinceLast = now - this.lastExecutionTime;
            const delay = Math.max(0, this.minIntervalMs - timeSinceLast);

            const run = async () => {
                this.pendingTimeout = null;
                this.pendingReject = null;
                this.lastExecutionTime = Date.now();
                try {
                    const res = await fn();
                    resolve(res);
                } catch (err) {
                    reject(err);
                }
            };

            if (delay === 0) {
                run();
            } else {
                this.pendingReject = reject;
                this.pendingTimeout = setTimeout(run, delay);
            }
        });
    }
}
