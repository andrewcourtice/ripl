/** Abstract terminal output interface — runtime-agnostic. */
export interface TerminalOutput {
    /** Writes raw data (including ANSI escape sequences) to the terminal. */
    write(data: string): void;
    /** Number of character columns currently available in the terminal. */
    columns: number;
    /** Number of character rows currently available in the terminal. */
    rows: number;
    /** Subscribes to terminal resize events, returning a disposer that removes the listener. */
    onResize?(callback: (cols: number, rows: number) => void): () => void;
}
