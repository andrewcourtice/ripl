/** Abstract terminal output interface — runtime-agnostic. */
export interface TerminalOutput {
    write(data: string): void;
    columns: number;
    rows: number;
    onResize?(callback: (cols: number, rows: number) => void): () => void;
}
