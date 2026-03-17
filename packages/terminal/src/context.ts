import {
    Context,
    ContextText,
} from '@ripl/core';

import type {
    ContextElement,
    ContextOptions,
    FillRule,
    TextOptions,
} from '@ripl/core';

import {
    colorToAnsiFg,
} from './color';

import {
    TerminalPath,
} from './path';

import {
    rasterizeArc,
    rasterizeCircle,
    rasterizeCubicBezier,
    rasterizeEllipse,
    rasterizeLine,
    rasterizeQuadBezier,
    rasterizeRect,
    scanlineFill,
} from './algorithms';

import type {
    PixelCallback,
} from './algorithms';

import type {
    Rasterizer,
} from './rasterizer';

import {
    BRAILLE_CELL_HEIGHT,
    BRAILLE_CELL_WIDTH,
    BrailleRasterizer,
} from './rasterizer';

import type {
    TerminalOutput,
} from './output';

/** Options for constructing a terminal rendering context. */
export interface TerminalContextOptions extends ContextOptions {
    width?: number;
    height?: number;
    rasterizer?: Rasterizer;
}

/** Terminal rendering context that rasterizes Ripl elements into character-based output via a `TerminalOutput` adapter. */
export class TerminalContext extends Context<Element> {

    private output: TerminalOutput;
    private rasterizer: Rasterizer;

    constructor(output: TerminalOutput, options?: TerminalContextOptions) {
        const {
            width,
            height,
            rasterizer,
        } = options || {};

        // Pass a dummy element — terminal has no DOM element
        super('terminal', {} as Element, options);

        this.output = output;
        this.rasterizer = rasterizer || new BrailleRasterizer(
            width ?? output.columns,
            height ?? output.rows
        );

        this.rescale(this.rasterizer.pixelWidth, this.rasterizer.pixelHeight);

        if (output.onResize) {
            const dispose = output.onResize((cols, rows) => {
                this.rasterizer.resize(cols, rows);
                this.rescale(this.rasterizer.pixelWidth, this.rasterizer.pixelHeight);
            });

            this.retain({
                dispose,
            });
        }
    }

    public clear(): void {
        this.output.write('\x1b[H');
        this.rasterizer.clear();
    }

    public markRenderEnd(): void {
        super.markRenderEnd();

        if (this.renderDepth === 0) {
            this.flush();
        }
    }

    public createPath(id?: string): TerminalPath {
        return new TerminalPath(id);
    }

    public createText(options: TextOptions): ContextText {
        return new ContextText(options);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public applyFill(element: ContextElement, fillRule?: FillRule): void {
        const color = colorToAnsiFg(this.fill);

        if (element instanceof TerminalPath) {
            this.rasterizePath(element, color, true);
        } else if (element instanceof ContextText) {
            this.rasterizeText(element, color);
        }
    }

    public applyStroke(element: ContextElement): void {
        const color = colorToAnsiFg(this.stroke);

        if (element instanceof TerminalPath) {
            this.rasterizePath(element, color, false);
        }
    }

    public measureText(text: string): TextMetrics {
        const charWidth = BRAILLE_CELL_WIDTH;
        const charHeight = BRAILLE_CELL_HEIGHT;

        return {
            width: text.length * charWidth,
            actualBoundingBoxAscent: charHeight,
            actualBoundingBoxDescent: 0,
            actualBoundingBoxLeft: 0,
            actualBoundingBoxRight: text.length * charWidth,
            fontBoundingBoxAscent: charHeight,
            fontBoundingBoxDescent: 0,
            alphabeticBaseline: 0,
            emHeightAscent: charHeight,
            emHeightDescent: 0,
            hangingBaseline: charHeight,
            ideographicBaseline: 0,
        } as TextMetrics;
    }

    private flush(): void {
        const data = this.rasterizer.serialize();
        this.output.write(data);
    }

    private rasterizeText(text: ContextText, color: string): void {
        const rasterizer = this.rasterizer;
        const col = Math.round(text.x / BRAILLE_CELL_WIDTH);
        const row = Math.round(text.y / BRAILLE_CELL_HEIGHT);
        const content = text.maxWidth
            ? text.content.slice(0, Math.floor(text.maxWidth / BRAILLE_CELL_WIDTH))
            : text.content;

        for (let i = 0; i < content.length; i++) {
            rasterizer.setChar(col + i, row, content[i], color);
        }
    }

    private rasterizePath(path: TerminalPath, color: string, fill: boolean): void {
        const rasterizer = this.rasterizer;

        const plot: PixelCallback = (x, y) => {
            rasterizer.setPixel(x, y, color);
        };

        if (fill) {
            const edges = new Map<number, number[]>();

            const collectEdge: PixelCallback = (x, y) => {
                const iy = Math.round(y);
                const row = edges.get(iy);

                if (row) {
                    row.push(Math.round(x));
                } else {
                    edges.set(iy, [Math.round(x)]);
                }
            };

            this.executeCommands(path, collectEdge);
            scanlineFill(edges, plot);
        }

        // Always draw the outline
        this.executeCommands(path, plot);
    }

    private executeCommands(path: TerminalPath, plot: PixelCallback): void {
        for (const cmd of path.commands) {
            const args = cmd.args;

            switch (cmd.type) {
                case 'moveTo':
                    // No pixels to draw for moveTo
                    break;

                case 'lineTo':
                    rasterizeLine(args[0], args[1], args[2], args[3], plot);
                    break;

                case 'arc':
                    if (Math.abs(args[4] - args[3]) >= Math.PI * 2 - 0.001) {
                        rasterizeCircle(args[0], args[1], args[2], plot);
                    } else {
                        rasterizeArc(args[0], args[1], args[2], args[3], args[4], !!args[5], plot);
                    }
                    break;

                case 'ellipse':
                    rasterizeEllipse(args[0], args[1], args[2], args[3], plot);
                    break;

                case 'bezierCurveTo':
                    rasterizeCubicBezier(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], plot);
                    break;

                case 'quadraticCurveTo':
                    rasterizeQuadBezier(args[0], args[1], args[2], args[3], args[4], args[5], plot);
                    break;

                case 'rect':
                    rasterizeRect(args[0], args[1], args[2], args[3], plot);
                    break;

                case 'closePath':
                    rasterizeLine(args[0], args[1], args[2], args[3], plot);
                    break;
            }
        }
    }

}

/** Creates a terminal rendering context bound to the given output adapter. */
export function createContext(output: TerminalOutput, options?: TerminalContextOptions): TerminalContext {
    return new TerminalContext(output, options);
}
