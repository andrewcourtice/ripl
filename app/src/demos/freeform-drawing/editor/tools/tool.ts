import type {
    ToolId,
} from '../constants';

import type {
    Point,
} from '@ripl/web';

/** Normalised pointer input passed to a tool, carrying modifier keys and the raw screen position. */
export interface PointerInput {
    /** The pointer position in screen (canvas-local CSS pixel) space. */
    screen: Point;
    /** Whether the shift key was held. */
    shiftKey: boolean;
    /** Whether the alt/option key was held. */
    altKey: boolean;
    /** The mouse button that triggered the event (`0` = primary). */
    button: number;
}

/**
 * A drawing/editing tool. The editor routes captured pointer and key events (already converted to
 * world coordinates) to the active tool. Every handler is optional; a tool implements only the
 * gestures it needs.
 */
export interface Tool {
    /** The tool's identifier. */
    id: ToolId;
    /** The CSS cursor shown while the tool is active. */
    cursor: string;
    /** Handles a pointer press at the given world point. */
    onPointerDown?(world: Point, input: PointerInput): void;
    /** Handles pointer movement at the given world point. */
    onPointerMove?(world: Point, input: PointerInput): void;
    /** Handles a pointer release at the given world point. */
    onPointerUp?(world: Point, input: PointerInput): void;
    /** Handles a double-click at the given world point. */
    onDoubleClick?(world: Point, input: PointerInput): void;
    /** Handles a key press while the tool is active. */
    onKeyDown?(event: KeyboardEvent): void;
    /** Called when the tool becomes active. */
    onActivate?(): void;
    /** Called when the tool is deactivated, so it can abort any in-progress gesture. */
    onDeactivate?(): void;
}
