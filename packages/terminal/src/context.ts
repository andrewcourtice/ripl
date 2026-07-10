import {
    Context,
    ContextText,
    scaleContinuous,
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
    /**
     * Author the scene in this logical width (e.g. CSS pixels) instead of raw braille pixels.
     * Rendering uniformly scales and letterboxes the logical space into the character grid, so a
     * scene written for a canvas-sized viewport renders proportionally in any terminal. Requires
     * `logicalHeight`. Text glyphs remain cell-sized (inherent to terminals); only their position
     * (and `maxWidth` clipping) follows the logical space.
     */
    logicalWidth?: number;
    /** Logical height counterpart to {@link TerminalContextOptions.logicalWidth}. */
    logicalHeight?: number;
}

/** Terminal rendering context that rasterizes Ripl elements into character-based output via a `TerminalOutput` adapter. */
export class TerminalContext extends Context<Element> {

    private output: TerminalOutput;
    private rasterizer: Rasterizer;
    private logicalWidth?: number;
    private logicalHeight?: number;
    /** Uniform logical→raster scale factor (1 when no logical size is set). */
    private rasterScale: number = 1;

    constructor(output: TerminalOutput, options?: TerminalContextOptions) {
        const {
            width,
            height,
            rasterizer,
            logicalWidth,
            logicalHeight,
        } = options || {};

        // Pass a dummy element — terminal has no DOM element
        super('terminal', {} as Element, options);

        this.output = output;
        this.logicalWidth = logicalWidth;
        this.logicalHeight = logicalHeight;
        this.rasterizer = rasterizer || new BrailleRasterizer(
            width ?? output.columns,
            height ?? output.rows
        );

        this.applyScaling();

        if (output.onResize) {
            const dispose = output.onResize((cols, rows) => {
                this.rasterizer.resize(cols, rows);
                this.applyScaling();
            });

            this.retain({
                dispose,
            });
        }
    }

    /**
     * Sizes the context's coordinate space against the rasterizer. Without a logical size the
     * space *is* the braille pixel grid (the historical behaviour). With one, the context reports
     * the logical size and `scaleX`/`scaleY` uniformly scale + centre (letterbox) it into the grid,
     * mirroring how the canvas context maps CSS pixels onto its device-pixel backing store.
     */
    private applyScaling(): void {
        const pixelWidth = this.rasterizer.pixelWidth;
        const pixelHeight = this.rasterizer.pixelHeight;

        if (!this.logicalWidth || !this.logicalHeight) {
            this.rasterScale = 1;
            this.rescale(pixelWidth, pixelHeight);
            return;
        }

        const scale = Math.min(pixelWidth / this.logicalWidth, pixelHeight / this.logicalHeight);
        const offsetX = (pixelWidth - this.logicalWidth * scale) / 2;
        const offsetY = (pixelHeight - this.logicalHeight * scale) / 2;

        this.rasterScale = scale;

        // `rescale` resets scaleX/scaleY to identity (and emits `resize`), so set the letterbox
        // mapping immediately after it.
        this.rescale(this.logicalWidth, this.logicalHeight);
        this.scaleX = scaleContinuous([0, this.logicalWidth], [offsetX, offsetX + this.logicalWidth * scale]);
        this.scaleY = scaleContinuous([0, this.logicalHeight], [offsetY, offsetY + this.logicalHeight * scale]);
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
        // Report metrics in logical units so layout code sizes text consistently with its space.
        const charWidth = BRAILLE_CELL_WIDTH / this.rasterScale;
        const charHeight = BRAILLE_CELL_HEIGHT / this.rasterScale;

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
        // Position follows the logical space; glyphs themselves stay cell-sized.
        const col = Math.round(this.scaleX(text.x) / BRAILLE_CELL_WIDTH);
        const row = Math.round(this.scaleY(text.y) / BRAILLE_CELL_HEIGHT);
        const content = text.maxWidth
            ? text.content.slice(0, Math.floor((text.maxWidth * this.rasterScale) / BRAILLE_CELL_WIDTH))
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
        // Map logical coordinates into the raster (identity when no logical size is configured).
        const sx = this.scaleX;
        const sy = this.scaleY;
        const s = this.rasterScale;

        for (const cmd of path.commands) {
            const args = cmd.args;

            switch (cmd.type) {
                case 'moveTo':
                    // No pixels to draw for moveTo
                    break;

                case 'lineTo':
                    rasterizeLine(sx(args[0]), sy(args[1]), sx(args[2]), sy(args[3]), plot);
                    break;

                case 'arc':
                    if (Math.abs(args[4] - args[3]) >= Math.PI * 2 - 0.001) {
                        rasterizeCircle(sx(args[0]), sy(args[1]), args[2] * s, plot);
                    } else {
                        rasterizeArc(sx(args[0]), sy(args[1]), args[2] * s, args[3], args[4], !!args[5], plot);
                    }
                    break;

                case 'ellipse':
                    rasterizeEllipse(sx(args[0]), sy(args[1]), args[2] * s, args[3] * s, plot);
                    break;

                case 'bezierCurveTo':
                    rasterizeCubicBezier(sx(args[0]), sy(args[1]), sx(args[2]), sy(args[3]), sx(args[4]), sy(args[5]), sx(args[6]), sy(args[7]), plot);
                    break;

                case 'quadraticCurveTo':
                    rasterizeQuadBezier(sx(args[0]), sy(args[1]), sx(args[2]), sy(args[3]), sx(args[4]), sy(args[5]), plot);
                    break;

                case 'rect':
                    rasterizeRect(sx(args[0]), sy(args[1]), args[2] * s, args[3] * s, plot);
                    break;

                case 'closePath':
                    rasterizeLine(sx(args[0]), sy(args[1]), sx(args[2]), sy(args[3]), plot);
                    break;
            }
        }
    }

}

/** Creates a terminal rendering context bound to the given output adapter. */
export function createContext(output: TerminalOutput, options?: TerminalContextOptions): TerminalContext {
    return new TerminalContext(output, options);
}
