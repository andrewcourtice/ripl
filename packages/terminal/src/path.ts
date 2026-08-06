import {
    ContextPath,
    getThetaPoint,
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
    private _hasSubpath = false;

    constructor(id?: string) {
        super(id);
    }

    /** Anchors the subpath start at the given point unless one is already open. */
    private _openSubpath(x: number, y: number): void {
        if (this._hasSubpath) {
            return;
        }

        this._startX = x;
        this._startY = y;
        this._hasSubpath = true;
    }

    /** Records an arc centered at (x, y) sweeping from `startAngle` to `endAngle`. */
    public arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, counterclockwise?: boolean): void {
        this.commands.push({
            type: 'arc',
            args: [x, y, radius, startAngle, endAngle, counterclockwise ? 1 : 0],
        });

        this._openSubpath(...getThetaPoint(startAngle, radius, x, y));

        [this._cursorX, this._cursorY] = getThetaPoint(endAngle, radius, x, y);
    }

    /** Records a full circle centered at (x, y) as a complete arc. */
    public circle(x: number, y: number, radius: number): void {
        this.arc(x, y, radius, 0, TAU);
    }

    /**
     * Records the arc of the given radius tangent to both the line from the current point to
     * (x1, y1) and the line from (x1, y1) to (x2, y2), preceded by a line to the first tangent
     * point — the same construction canvas performs, so the corner point itself is not visited.
     * Degenerate cases (a zero radius, or three collinear points) fall back to a line to (x1, y1).
     */
    public arcTo(x1: number, y1: number, x2: number, y2: number, radius: number): void {
        const fromX = this._cursorX - x1;
        const fromY = this._cursorY - y1;
        const toX = x2 - x1;
        const toY = y2 - y1;
        const fromLength = Math.hypot(fromX, fromY);
        const toLength = Math.hypot(toX, toY);
        const cross = fromX * toY - fromY * toX;

        if (radius <= 0 || !fromLength || !toLength || !cross) {
            this.lineTo(x1, y1);
            return;
        }

        const fromAngle = Math.atan2(fromY, fromX);
        const toAngle = Math.atan2(toY, toX);
        const half = Math.abs(Math.atan2(cross, fromX * toX + fromY * toY)) / 2;
        const tangent = radius / Math.tan(half);
        const bisector = fromAngle + (cross < 0 ? -half : half);
        const centerX = x1 + (radius / Math.sin(half)) * Math.cos(bisector);
        const centerY = y1 + (radius / Math.sin(half)) * Math.sin(bisector);
        const enterX = x1 + tangent * Math.cos(fromAngle);
        const enterY = y1 + tangent * Math.sin(fromAngle);
        const exitX = x1 + tangent * Math.cos(toAngle);
        const exitY = y1 + tangent * Math.sin(toAngle);

        this.lineTo(enterX, enterY);
        this.arc(
            centerX,
            centerY,
            radius,
            Math.atan2(enterY - centerY, enterX - centerX),
            Math.atan2(exitY - centerY, exitX - centerX),
            cross > 0
        );
    }

    /** Records a cubic bezier curve from the current point to (x, y). */
    public bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): void {
        this.commands.push({
            type: 'bezierCurveTo',
            args: [this._cursorX, this._cursorY, cp1x, cp1y, cp2x, cp2y, x, y],
        });

        this._openSubpath(this._cursorX, this._cursorY);

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
        this._hasSubpath = false;
    }

    /** Records an ellipse centered at (x, y) with the given radii, sweep, and rotation. */
    public ellipse(x: number, y: number, radiusX: number, radiusY: number, rotation: number, startAngle: number, endAngle: number, counterclockwise?: boolean): void {
        this.commands.push({
            type: 'ellipse',
            args: [x, y, radiusX, radiusY, rotation, startAngle, endAngle, counterclockwise ? 1 : 0],
        });

        this._openSubpath(x + radiusX * Math.cos(startAngle), y + radiusY * Math.sin(startAngle));

        this._cursorX = x + radiusX * Math.cos(endAngle);
        this._cursorY = y + radiusY * Math.sin(endAngle);
    }

    /** Records a straight line from the current point to (x, y). */
    public lineTo(x: number, y: number): void {
        this.commands.push({
            type: 'lineTo',
            args: [this._cursorX, this._cursorY, x, y],
        });

        this._openSubpath(this._cursorX, this._cursorY);

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
        this._hasSubpath = true;
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
        this._hasSubpath = true;
    }

    /** Records a quadratic bezier curve from the current point to (x, y). */
    public quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void {
        this.commands.push({
            type: 'quadraticCurveTo',
            args: [this._cursorX, this._cursorY, cpx, cpy, x, y],
        });

        this._openSubpath(this._cursorX, this._cursorY);

        this._cursorX = x;
        this._cursorY = y;
    }

    /** Records a rounded rectangle, approximated as a plain rectangle for terminal rendering. */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public roundRect(x: number, y: number, width: number, height: number, radii?: BorderRadius): void {
        // Approximate as a plain rect for terminal rendering
        this.rect(x, y, width, height);
    }

    /**
     * Appends the recorded commands of another {@link TerminalPath} to this path. A path from
     * another backend carries no terminal commands to replay, so it is skipped with a warning
     * rather than composing into a silently empty result.
     */
    public addPath(path: ContextPath): void {
        if (!(path instanceof TerminalPath)) {
            console.warn('TerminalPath.addPath: ignoring a path created by another rendering context; only a TerminalPath can be composed.');
            return;
        }

        this.commands.push(...path.commands);
    }

}
