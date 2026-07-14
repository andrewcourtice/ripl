import {
    ContextPath,
    TAU,
} from '@ripl/core';

import type {
    BorderRadius,
} from '@ripl/core';

/** Types of drawing commands recorded by a terminal path. */
export type TerminalPathCommandType =
    | 'moveTo'
    | 'lineTo'
    | 'arc'
    | 'ellipse'
    | 'bezierCurveTo'
    | 'quadraticCurveTo'
    | 'rect'
    | 'closePath';

/** A recorded drawing command with its type and parameters. */
export interface TerminalPathCommand {
    /** The kind of drawing operation this command represents. */
    type: TerminalPathCommandType;
    /** Numeric arguments for the command (coordinates, radii, and angles). */
    args: number[];
}

/** Terminal path implementation that records drawing commands for later rasterization. */
export class TerminalPath extends ContextPath {

    /** Ordered list of recorded drawing commands, replayed during rasterization. */
    public readonly commands: TerminalPathCommand[] = [];

    private _cursorX = 0;
    private _cursorY = 0;
    private _startX = 0;
    private _startY = 0;

    constructor(id?: string) {
        super(id);
    }

    /** Records an arc centered at (x, y) sweeping from `startAngle` to `endAngle`. */
    public arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, counterclockwise?: boolean): void {
        this.commands.push({
            type: 'arc',
            args: [x, y, radius, startAngle, endAngle, counterclockwise ? 1 : 0],
        });

        this._cursorX = x + radius * Math.cos(endAngle);
        this._cursorY = y + radius * Math.sin(endAngle);
    }

    /** Records a full circle centered at (x, y) as a complete arc. */
    public circle(x: number, y: number, radius: number): void {
        this.arc(x, y, radius, 0, TAU);
    }

    /** Records an arc approximated as two line segments to the tangent points. */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public arcTo(x1: number, y1: number, x2: number, y2: number, radius: number): void {
        // Approximate arcTo as two line segments to the tangent points
        this.lineTo(x1, y1);
        this.lineTo(x2, y2);
    }

    /** Records a cubic bezier curve from the current point to (x, y). */
    public bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): void {
        this.commands.push({
            type: 'bezierCurveTo',
            args: [this._cursorX, this._cursorY, cp1x, cp1y, cp2x, cp2y, x, y],
        });

        this._cursorX = x;
        this._cursorY = y;
    }

    /** Closes the current subpath with a line back to its start point. */
    public closePath(): void {
        this.commands.push({
            type: 'closePath',
            args: [this._cursorX, this._cursorY, this._startX, this._startY],
        });

        this._cursorX = this._startX;
        this._cursorY = this._startY;
    }

    /** Records an ellipse centered at (x, y) with the given radii. */
    public ellipse(x: number, y: number, radiusX: number, radiusY: number, rotation: number, startAngle: number, endAngle: number, counterclockwise?: boolean): void {
        this.commands.push({
            type: 'ellipse',
            args: [x, y, radiusX, radiusY, rotation, startAngle, endAngle, counterclockwise ? 1 : 0],
        });

        this._cursorX = x + radiusX * Math.cos(endAngle);
        this._cursorY = y + radiusY * Math.sin(endAngle);
    }

    /** Records a straight line from the current point to (x, y). */
    public lineTo(x: number, y: number): void {
        this.commands.push({
            type: 'lineTo',
            args: [this._cursorX, this._cursorY, x, y],
        });

        this._cursorX = x;
        this._cursorY = y;
    }

    /** Moves the cursor to (x, y), starting a new subpath. */
    public moveTo(x: number, y: number): void {
        this.commands.push({
            type: 'moveTo',
            args: [x, y],
        });

        this._cursorX = x;
        this._cursorY = y;
        this._startX = x;
        this._startY = y;
    }

    /** Records a quadratic bezier curve from the current point to (x, y). */
    public quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void {
        this.commands.push({
            type: 'quadraticCurveTo',
            args: [this._cursorX, this._cursorY, cpx, cpy, x, y],
        });

        this._cursorX = x;
        this._cursorY = y;
    }

    /** Records an axis-aligned rectangle with its top-left corner at (x, y). */
    public rect(x: number, y: number, width: number, height: number): void {
        this.commands.push({
            type: 'rect',
            args: [x, y, width, height],
        });

        this._cursorX = x;
        this._cursorY = y;
        this._startX = x;
        this._startY = y;
    }

    /** Records a rounded rectangle, approximated as a plain rectangle for terminal rendering. */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public roundRect(x: number, y: number, width: number, height: number, radii?: BorderRadius): void {
        // Approximate as a plain rect for terminal rendering
        this.rect(x, y, width, height);
    }

    /** Appends the recorded commands of another {@link TerminalPath} to this path. */
    public addPath(path: ContextPath): void {
        if (path instanceof TerminalPath) {
            this.commands.push(...path.commands);
        }
    }

}
