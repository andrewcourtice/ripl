import {
    Context,
    ContextText,
    scaleContinuous,
} from '@ripl/core';

import type {
    ContextElement,
    ContextExport,
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
    fillPolygon,
    flattenArc,
    flattenCubicBezier,
    flattenEllipse,
    flattenQuadBezier,
    rasterizeArc,
    rasterizeCircle,
    rasterizeCubicBezier,
    rasterizeEllipse,
    rasterizeLine,
    rasterizeQuadBezier,
    rasterizeRect,
} from './algorithms';

import type {
    PixelCallback,
    Vertex,
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

/** Converts a base64 data URL into a `Blob` synchronously. */
function dataURLToBlob(dataURL: string): Blob {
    const [header, data] = dataURL.split(',');
    const mimeMatch = /:(.*?);/.exec(header);
    const mime = mimeMatch ? mimeMatch[1] : 'image/png';
    const binary = atob(data);
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }

    return new Blob([bytes], {
        type: mime,
    });
}

/**
 * Produces an openable URL for a rasterized terminal snapshot. In a browser this is a PNG `Blob`
 * object URL; in a headless environment it falls back to a `text/plain` data URL of the braille art.
 */
function terminalSnapshotToURL(imageData: ImageData, text: string): string {
    if (typeof document !== 'undefined' && imageData.width > 0 && imageData.height > 0) {
        const canvas = document.createElement('canvas');

        canvas.width = imageData.width;
        canvas.height = imageData.height;

        const context = canvas.getContext('2d');

        if (context) {
            context.putImageData(imageData, 0, 0);

            const dataURL = canvas.toDataURL('image/png');

            if (dataURL?.startsWith('data:image')) {
                return URL.createObjectURL(dataURLToBlob(dataURL));
            }
        }
    }

    return `data:text/plain;charset=utf-8,${encodeURIComponent(text)}`;
}

/** Fraction of the text width to shift the anchor left by, per `textAlign` (LTR). */
const TEXT_ALIGN_FACTORS: Record<string, number> = {
    left: 0,
    start: 0,
    center: 0.5,
    right: 1,
    end: 1,
};

/** Number of cells to shift the anchor up by, per `textBaseline` (glyphs are one cell tall). */
const TEXT_BASELINE_FACTORS: Record<string, number> = {
    top: 0,
    hanging: 0,
    middle: 0.5,
    alphabetic: 1,
    ideographic: 1,
    bottom: 1,
};

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

    public export(): ContextExport {
        const text = this.rasterizer.serialize({
            ansi: false,
        });
        const imageData = this.rasterizer.toImageData();

        return {
            toString: () => text,
            toURL: () => terminalSnapshotToURL(imageData, text),
            toImage: () => Promise.resolve(imageData),
        };
    }

    private flush(): void {
        const data = this.rasterizer.serialize();
        this.output.write(data);
    }

    private rasterizeText(text: ContextText, color: string): void {
        const rasterizer = this.rasterizer;
        const content = text.maxWidth
            ? text.content.slice(0, Math.floor((text.maxWidth * this.rasterScale) / BRAILLE_CELL_WIDTH))
            : text.content;

        // Position follows the logical space; glyphs stay cell-sized. Approximate textAlign/
        // textBaseline by shifting the anchor cell (each glyph is one cell wide and tall).
        const alignFactor = TEXT_ALIGN_FACTORS[this.textAlign] ?? 0;
        const baselineFactor = TEXT_BASELINE_FACTORS[this.textBaseline] ?? 1;

        const col = Math.round(this.scaleX(text.x) / BRAILLE_CELL_WIDTH - content.length * alignFactor);
        const row = Math.round(this.scaleY(text.y) / BRAILLE_CELL_HEIGHT - baselineFactor);

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
            fillPolygon(this.buildContours(path), plot);
        }

        // Always draw the outline
        this.executeCommands(path, plot);
    }

    /**
     * Flattens the path's commands into closed contours in raster space (following canvas subpath
     * semantics) so the interior can be filled with the even-odd rule. Mirrors the coordinate mapping
     * used by {@link executeCommands}: points via `scaleX`/`scaleY`, radii via `rasterScale`.
     */
    private buildContours(path: TerminalPath): Vertex[][] {
        const sx = this.scaleX;
        const sy = this.scaleY;
        const s = this.rasterScale;
        const contours: Vertex[][] = [];

        let current: Vertex[] = [];

        const flush = () => {
            if (current.length > 1) {
                contours.push(current);
            }

            current = [];
        };

        const append = (point: Vertex) => {
            const last = current[current.length - 1];

            if (!last || last.x !== point.x || last.y !== point.y) {
                current.push(point);
            }
        };

        for (const cmd of path.commands) {
            const args = cmd.args;

            switch (cmd.type) {
                case 'moveTo':
                    flush();
                    append({
                        x: sx(args[0]),
                        y: sy(args[1]),
                    });
                    break;

                case 'lineTo':
                    append({
                        x: sx(args[0]),
                        y: sy(args[1]),
                    });
                    append({
                        x: sx(args[2]),
                        y: sy(args[3]),
                    });
                    break;

                case 'arc':
                    flattenArc(sx(args[0]), sy(args[1]), args[2] * s, args[3], args[4], !!args[5]).forEach(append);
                    break;

                case 'ellipse':
                    flush();
                    contours.push(flattenEllipse(sx(args[0]), sy(args[1]), args[2] * s, args[3] * s));
                    break;

                case 'bezierCurveTo':
                    flattenCubicBezier(sx(args[0]), sy(args[1]), sx(args[2]), sy(args[3]), sx(args[4]), sy(args[5]), sx(args[6]), sy(args[7])).forEach(append);
                    break;

                case 'quadraticCurveTo':
                    flattenQuadBezier(sx(args[0]), sy(args[1]), sx(args[2]), sy(args[3]), sx(args[4]), sy(args[5])).forEach(append);
                    break;

                case 'rect':
                    flush();
                    contours.push([
                        {
                            x: sx(args[0]),
                            y: sy(args[1]),
                        },
                        {
                            x: sx(args[0]) + args[2] * s,
                            y: sy(args[1]),
                        },
                        {
                            x: sx(args[0]) + args[2] * s,
                            y: sy(args[1]) + args[3] * s,
                        },
                        {
                            x: sx(args[0]),
                            y: sy(args[1]) + args[3] * s,
                        },
                    ]);
                    break;

                case 'closePath':
                    flush();
                    break;
            }
        }

        flush();

        return contours;
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
