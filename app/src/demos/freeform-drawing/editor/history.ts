import {
    cloneDocument,
} from './model';

import type {
    RiplDocument,
} from './model';

const HISTORY_LIMIT = 200;

/** A bounded undo/redo stack of immutable document snapshots. */
export class History {

    #past: RiplDocument[] = [];
    #future: RiplDocument[] = [];

    /** Whether there is a prior snapshot to undo to. */
    public get canUndo(): boolean {
        return this.#past.length > 0;
    }

    /** Whether there is a snapshot to redo to. */
    public get canRedo(): boolean {
        return this.#future.length > 0;
    }

    /** Records the pre-change snapshot as an undo point and clears the redo stack. */
    public record(previous: RiplDocument): void {
        this.#past.push(cloneDocument(previous));

        if (this.#past.length > HISTORY_LIMIT) {
            this.#past.shift();
        }

        this.#future = [];
    }

    /** Moves `current` onto the redo stack and returns the previous snapshot, or `undefined`. */
    public undo(current: RiplDocument): RiplDocument | undefined {
        const previous = this.#past.pop();

        if (!previous) {
            return undefined;
        }

        this.#future.push(cloneDocument(current));

        return previous;
    }

    /** Moves `current` onto the undo stack and returns the next snapshot, or `undefined`. */
    public redo(current: RiplDocument): RiplDocument | undefined {
        const next = this.#future.pop();

        if (!next) {
            return undefined;
        }

        this.#past.push(cloneDocument(current));

        return next;
    }

    /** Clears all recorded history. */
    public clear(): void {
        this.#past = [];
        this.#future = [];
    }

}
