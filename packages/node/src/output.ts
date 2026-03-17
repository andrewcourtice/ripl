import type {
    TerminalOutput,
} from '@ripl/terminal';

/** Creates a `TerminalOutput` adapter backed by Node.js `process.stdout`. */
export function createTerminalOutput(): TerminalOutput {
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
            const handler = () => callback(
                process.stdout.columns || 80,
                process.stdout.rows || 24
            );

            process.on('SIGWINCH', handler);

            return () => {
                process.off('SIGWINCH', handler);
            };
        },
    };
}
