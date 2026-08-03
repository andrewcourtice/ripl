import type {
    TerminalOutput,
} from '@ripl/terminal';

/**
 * Creates a `TerminalOutput` adapter backed by Node.js `process.stdout`.
 *
 * Resize subscribers are multiplexed behind a single `SIGWINCH` handler, registered on the first
 * subscription and removed with the last. One handler per subscriber tripped Node's
 * `MaxListenersExceededWarning` at ten scenes, and fired every handler on every resize.
 */
export function createTerminalOutput(): TerminalOutput {
    const listeners = new Set<(cols: number, rows: number) => void>();

    let handler: (() => void) | undefined;

    return {
        write(data: string) {
            process.stdout.write(data);
        },

        get columns() {
            return process.stdout.columns || 80;
        },

        get rows() {
            return process.stdout.rows || 24;
        },

        onResize(callback: (cols: number, rows: number) => void) {
            listeners.add(callback);

            if (!handler) {
                handler = () => listeners.forEach(listener => listener(
                    process.stdout.columns || 80,
                    process.stdout.rows || 24
                ));

                process.on('SIGWINCH', handler);
            }

            return () => {
                listeners.delete(callback);

                if (listeners.size === 0 && handler) {
                    process.off('SIGWINCH', handler);
                    handler = undefined;
                }
            };
        },
    };
}
