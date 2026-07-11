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
    type: TerminalPathCommandType;
    args: number[];
}

/** Terminal path implementation that records drawing commands for later rasterization. */
export class TerminalPath extends ContextPath {

    public readonly commands: TerminalPathCommand[] = [];

    private cursorX = 0;
    private cursorY = 0;
    private startX = 0;
    private startY = 0;

    constructor(id?: string) {
        super(id);
    }

    public arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, counterclockwise?: boolean): void {
        this.commands.push({
            type: 'arc',
            args: [x, y, radius, startAngle, endAngle, counterclockwise ? 1 : 0],
        });

        this.cursorX = x + radius * Math.cos(endAngle);
        this.cursorY = y + radius * Math.sin(endAngle);
    }

    public circle(x: number, y: number, radius: number): void {
        this.arc(x, y, radius, 0, TAU);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public arcTo(x1: number, y1: number, x2: number, y2: number, radius: number): void {
        // Approximate arcTo as two line segments to the tangent points
        this.lineTo(x1, y1);
        this.lineTo(x2, y2);
    }

    public bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): void {
        this.commands.push({
            type: 'bezierCurveTo',
            args: [this.cursorX, this.cursorY, cp1x, cp1y, cp2x, cp2y, x, y],
        });

        this.cursorX = x;
        this.cursorY = y;
    }

    public closePath(): void {
        this.commands.push({
            type: 'closePath',
            args: [this.cursorX, this.cursorY, this.startX, this.startY],
        });

        this.cursorX = this.startX;
        this.cursorY = this.startY;
    }

    public ellipse(x: number, y: number, radiusX: number, radiusY: number, rotation: number, startAngle: number, endAngle: number, counterclockwise?: boolean): void {
        this.commands.push({
            type: 'ellipse',
            args: [x, y, radiusX, radiusY, rotation, startAngle, endAngle, counterclockwise ? 1 : 0],
        });

        this.cursorX = x + radiusX * Math.cos(endAngle);
        this.cursorY = y + radiusY * Math.sin(endAngle);
    }

    public lineTo(x: number, y: number): void {
        this.commands.push({
            type: 'lineTo',
            args: [this.cursorX, this.cursorY, x, y],
        });

        this.cursorX = x;
        this.cursorY = y;
    }

    public moveTo(x: number, y: number): void {
        this.commands.push({
            type: 'moveTo',
            args: [x, y],
        });

        this.cursorX = x;
        this.cursorY = y;
        this.startX = x;
        this.startY = y;
    }

    public quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void {
        this.commands.push({
            type: 'quadraticCurveTo',
            args: [this.cursorX, this.cursorY, cpx, cpy, x, y],
        });

        this.cursorX = x;
        this.cursorY = y;
    }

    public rect(x: number, y: number, width: number, height: number): void {
        this.commands.push({
            type: 'rect',
            args: [x, y, width, height],
        });

        this.cursorX = x;
        this.cursorY = y;
        this.startX = x;
        this.startY = y;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public roundRect(x: number, y: number, width: number, height: number, radii?: BorderRadius): void {
        // Approximate as a plain rect for terminal rendering
        this.rect(x, y, width, height);
    }

    public addPath(path: ContextPath): void {
        if (path instanceof TerminalPath) {
            this.commands.push(...path.commands);
        }
    }

}
