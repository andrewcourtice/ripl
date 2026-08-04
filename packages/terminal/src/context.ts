import {
    Context,
    ContextText,
    scaleContinuous,
} from '@ripl/core';

import type {
    ContextElement,
    ContextExport,
    ContextFactory,
    ContextOptions,
    FillRule,
    TextOptions,
} from '@ripl/core';

import {
    ANSI_RESET,
    colorToAnsiFg,
} from './color';

import {
    TerminalPath,
} from './path';

import type {
    TerminalPathCommandType,
} from './path';

import {
    dashPixels,
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
    thickenPixels,
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
    /** Grid width in terminal columns. Defaults to the output adapter's `columns`. */
    width?: number;
    /** Grid height in terminal rows. Defaults to the output adapter's `rows`. */
    height?: number;
    /** Custom rasterizer to use instead of the default {@link BrailleRasterizer}. */
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

/** Coordinate mapping shared by both command passes: points via `sx`/`sy`, radii via `s`. */
interface TerminalCommandScale {
    sx(value: number): number;
    sy(value: number): number;
    s: number;
}

/** Contour-building state passed to a command's `toContour` handler. */
interface ContourContext extends TerminalCommandScale {
    contours: Vertex[][];
    flush(): void;
    append(point: Vertex): void;
}

/** Rasterization state passed to a command's `rasterize` handler. */
interface RasterContext extends TerminalCommandScale {
    plot: PixelCallback;
}

/** A path command's two rendering passes: contour flattening (for fills) and outline rasterization. */
interface TerminalCommandHandler {
    toContour(context: ContourContext, args: number[]): void;
    rasterize(context: RasterContext, args: number[]): void;
}

/**
 * Dispatch table keyed by path command type, replacing the parallel `switch` statements in
 * {@link TerminalContext.buildContours} and {@link TerminalContext.executeCommands}.
 */
const TERMINAL_COMMAND_HANDLERS: Record<TerminalPathCommandType, TerminalCommandHandler> = {
    moveTo: {
        toContour({ sx, sy, flush, append }, args) {
            flush();
            append({
                x: sx(args[0]),
                y: sy(args[1]),
            });
        },
        rasterize() {
            // No pixels to draw for moveTo.
        },
    },
    lineTo: {
        toContour({ sx, sy, append }, args) {
            append({
                x: sx(args[0]),
                y: sy(args[1]),
            });
            append({
                x: sx(args[2]),
                y: sy(args[3]),
            });
        },
        rasterize({ sx, sy, plot }, args) {
            rasterizeLine(sx(args[0]), sy(args[1]), sx(args[2]), sy(args[3]), plot);
        },
    },
    arc: {
        toContour({ sx, sy, s, append }, args) {
            flattenArc(sx(args[0]), sy(args[1]), args[2] * s, args[3], args[4], !!args[5]).forEach(append);
        },
        rasterize({ sx, sy, s, plot }, args) {
            if (Math.abs(args[4] - args[3]) >= Math.PI * 2 - 0.001) {
                rasterizeCircle(sx(args[0]), sy(args[1]), args[2] * s, plot);
            } else {
                rasterizeArc(sx(args[0]), sy(args[1]), args[2] * s, args[3], args[4], !!args[5], plot);
            }
        },
    },
    ellipse: {
        toContour({ sx, sy, s, contours, flush }, args) {
            flush();
            contours.push(flattenEllipse(sx(args[0]), sy(args[1]), args[2] * s, args[3] * s, args[4], args[5], args[6], !!args[7]));
        },
        rasterize({ sx, sy, s, plot }, args) {
            rasterizeEllipse(sx(args[0]), sy(args[1]), args[2] * s, args[3] * s, args[4], args[5], args[6], !!args[7], plot);
        },
    },
    bezierCurveTo: {
        toContour({ sx, sy, append }, args) {
            flattenCubicBezier(sx(args[0]), sy(args[1]), sx(args[2]), sy(args[3]), sx(args[4]), sy(args[5]), sx(args[6]), sy(args[7])).forEach(append);
        },
        rasterize({ sx, sy, plot }, args) {
            rasterizeCubicBezier(sx(args[0]), sy(args[1]), sx(args[2]), sy(args[3]), sx(args[4]), sy(args[5]), sx(args[6]), sy(args[7]), plot);
        },
    },
    quadraticCurveTo: {
        toContour({ sx, sy, append }, args) {
            flattenQuadBezier(sx(args[0]), sy(args[1]), sx(args[2]), sy(args[3]), sx(args[4]), sy(args[5])).forEach(append);
        },
        rasterize({ sx, sy, plot }, args) {
            rasterizeQuadBezier(sx(args[0]), sy(args[1]), sx(args[2]), sy(args[3]), sx(args[4]), sy(args[5]), plot);
        },
    },
    rect: {
        toContour({ sx, sy, s, contours, flush }, args) {
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
        },
        rasterize({ sx, sy, s, plot }, args) {
            rasterizeRect(sx(args[0]), sy(args[1]), args[2] * s, args[3] * s, plot);
        },
    },
    closePath: {
        toContour({ flush }) {
            flush();
        },
        rasterize({ sx, sy, plot }, args) {
            rasterizeLine(sx(args[0]), sy(args[1]), sx(args[2]), sy(args[3]), plot);
        },
    },
};

/**
 * Terminal rendering context that rasterizes Ripl elements into character-based output via a
 * `TerminalOutput` adapter.
 *
 * A character grid cannot honor the full canvas contract, so the following constraints apply:
 *
 * - **Text metrics are approximate**: every glyph occupies exactly one terminal cell, so
 *   `measureText` reports one cell of width per character regardless of font, and the `font`
 *   state (family, size, weight) has no visual effect.
 * - **Fills use the even-odd rule only**: the scanline rasterizer ignores a `nonzero` fill rule
 *   (see {@link TerminalContext.applyFill}).
 * - **No hit testing**: `isPointInPath`/`isPointInStroke` always return `false`, so pointer
 *   events never match elements.
 * - **Affine transforms are discarded**: `rotate`/`scale`/`translate`/`setTransform`/`transform`
 *   are inherited as no-ops from {@link Context}, so an element or group transform has *no* effect
 *   — it is dropped, not approximated. The context's own `scaleX`/`scaleY` mapping is a single
 *   global letterbox and cannot stand in for per-element placement. Concretely: a rotated axis
 *   title draws horizontally across the plot, a diamond marker rotated by π/4 draws as an
 *   unrotated square, and a translated element draws at its untranslated coordinates. A
 *   non-identity transform warns once per context.
 * - **Alpha is approximated by attenuation**: a cell is lit or unlit, so `opacity` and a paint's
 *   own alpha darken the emitted color toward an assumed dark background. Zero alpha draws
 *   nothing at all.
 * - **Stroke geometry is 1 pixel wide**: `lineWidth`, `lineCap`, `lineJoin` and `miterLimit` have
 *   no expressible form in a 1-bit raster and are ignored. `lineDash`/`lineDashOffset` *are*
 *   honored, with arc length approximated by plotted-pixel count.
 * - **No shadows, filters, or compositing**: `shadow*`, `filter` and `globalCompositeOperation`
 *   are ignored. `globalCompositeOperation: 'destination-out'` warns, because canvas *erases*
 *   where the terminal *draws* — the output is inverted rather than merely degraded.
 * - **Text on a path is drawn straight**: `ContextText.pathData`/`startOffset` are ignored and the
 *   run is laid out from its anchor along a straight line.
 * - **No clipping or images**: `applyClip` and `drawImage` are inherited as no-ops.
 */
export class TerminalContext extends Context<Element> {

    // Not a `#private` field: those throw when accessed through a Proxy, which breaks Vue's `reactive()`.
    private _warned = new Set<string>();

    private _output: TerminalOutput;
    private _rasterizer: Rasterizer;
    private _logicalWidth?: number;
    private _logicalHeight?: number;
    private _fixedCols?: number;
    private _fixedRows?: number;
    /** Uniform logical→raster scale factor (1 when no logical size is set). */
    private _rasterScale: number = 1;
    private _offsetX: number = 0;
    private _offsetY: number = 0;

    /**
     * The terminal applies no transform when drawing, so a hit point is already in the space the
     * element was drawn in and must not be mapped back through the element's world transform.
     */
    public hitTestHonorsTransform = true;

    /** Terminal paths are inert command recorders, so a cached path stays valid across frames. */
    public get supportsPathCaching(): boolean {
        return true;
    }

    constructor(output: TerminalOutput, options?: TerminalContextOptions) {
        const {
            width,
            height,
            rasterizer,
            logicalWidth,
            logicalHeight,
        } = options || {};

        // Pass a dummy element; terminal has no DOM element
        super('terminal', {} as Element, options);

        this._output = output;
        this._logicalWidth = logicalWidth;
        this._logicalHeight = logicalHeight;
        this._fixedCols = width;
        this._fixedRows = height;
        this._rasterizer = rasterizer || new BrailleRasterizer(
            width ?? output.columns,
            height ?? output.rows
        );

        this._applyScaling();

        if (output.onResize) {
            const dispose = output.onResize((cols, rows) => {
                this._rasterizer.resize(this._fixedCols ?? cols, this._fixedRows ?? rows);
                this._applyScaling();
            });

            this.retain({
                dispose,
            });
        }
    }

    /** Emits a one-off warning per context for a constraint a scene has just run into. */
    private _warnOnce(key: string, message: string): void {
        if (this._warned.has(key)) {
            return;
        }

        this._warned.add(key);
        console.warn(message);
    }

    /** Warns the first time a scene relies on a transform, which this backend discards entirely. */
    private _warnTransformDropped(): void {
        this._warnOnce('transform', 'TerminalContext: transforms are not supported and this one was discarded — the element renders untransformed. Position elements in absolute coordinates for terminal output.');
    }

    /**
     * Sizes the context's coordinate space against the rasterizer. Without a logical size the
     * space *is* the braille pixel grid (the historical behavior). With one, the context reports
     * the logical size and `scaleX`/`scaleY` uniformly scale + center (letterbox) it into the grid,
     * mirroring how the canvas context maps CSS pixels onto its device-pixel backing store.
     */
    private _applyScaling(): void {
        const pixelWidth = this._rasterizer.pixelWidth;
        const pixelHeight = this._rasterizer.pixelHeight;

        if (!this._logicalWidth || !this._logicalHeight) {
            this._rasterScale = 1;
            this._offsetX = 0;
            this._offsetY = 0;
            this.rescale(pixelWidth, pixelHeight);
            return;
        }

        const scale = Math.min(pixelWidth / this._logicalWidth, pixelHeight / this._logicalHeight);

        this._rasterScale = scale;
        this._offsetX = (pixelWidth - this._logicalWidth * scale) / 2;
        this._offsetY = (pixelHeight - this._logicalHeight * scale) / 2;

        this.rescale(this._logicalWidth, this._logicalHeight);
    }

    /**
     * Installs the letterbox mapping and reports the new size. The base implementation resets
     * `scaleX`/`scaleY` to identity and *then* emits `resize`, which a bound scene handles by
     * repainting synchronously — so the mapping has to be complete before the emit, or that repaint
     * places points with the old scales and extents with the new one.
     */
    protected rescale(width: number, height: number): void {
        this.width = width;
        this.height = height;
        this.scaleX = scaleContinuous([0, width], [this._offsetX, this._offsetX + width * this._rasterScale]);
        this.scaleY = scaleContinuous([0, height], [this._offsetY, this._offsetY + height * this._rasterScale]);

        this.emit('resize', null);
    }

    /** Homes the cursor and clears the rasterizer grid. */
    public clear(): void {
        this._output.write('\x1b[H');
        this._rasterizer.clear();
    }

    /** Resets the drawing state, the saved-state stack, and the character grid. */
    public reset(): void {
        super.reset();
        this._rasterizer.clear();
    }

    /** Applies a rotation transformation. Discarded by this backend; warns once per context. */
    public rotate(angle: number): void {
        if (angle) {
            this._warnTransformDropped();
        }
    }

    /** Applies a scale transformation. Discarded by this backend; warns once per context. */
    public scale(x: number, y: number): void {
        if (x !== 1 || y !== 1) {
            this._warnTransformDropped();
        }
    }

    /** Applies a translation transformation. Discarded by this backend; warns once per context. */
    public translate(x: number, y: number): void {
        if (x || y) {
            this._warnTransformDropped();
        }
    }

    /**
     * Replaces the current transformation matrix. Discarded by this backend; warns once per context.
     * @param a Horizontal scaling.
     * @param b Vertical skewing.
     * @param c Horizontal skewing.
     * @param d Vertical scaling.
     * @param e Horizontal translation.
     * @param f Vertical translation.
     */
    // eslint-disable-next-line id-length
    public setTransform(a: number, b: number, c: number, d: number, e: number, f: number): void {
        if (a !== 1 || b || c || d !== 1 || e || f) {
            this._warnTransformDropped();
        }
    }

    /**
     * Multiplies the current transformation matrix. Discarded by this backend; warns once per context.
     * @param a Horizontal scaling.
     * @param b Vertical skewing.
     * @param c Horizontal skewing.
     * @param d Vertical scaling.
     * @param e Horizontal translation.
     * @param f Vertical translation.
     */
    // eslint-disable-next-line id-length
    public transform(a: number, b: number, c: number, d: number, e: number, f: number): void {
        this.setTransform(a, b, c, d, e, f);
    }

    /** Ends the render pass and, at the outermost depth, flushes the rasterized output to the terminal. */
    public markRenderEnd(): void {
        super.markRenderEnd();

        if (this.renderDepth === 0) {
            this._flush();
        }
    }

    /** Creates a {@link TerminalPath} that records drawing commands for later rasterization. */
    public createPath(id?: string): TerminalPath {
        return new TerminalPath(id);
    }

    /** Creates a text element from the given options. */
    public createText(options: TextOptions): ContextText {
        return new ContextText(options);
    }

    /**
     * Rasterizes and fills the given path or text element using the current fill color, composited
     * with the current `opacity`. A paint that resolves to nothing (`none`, `transparent`, or zero
     * effective alpha) draws nothing at all.
     */
    // `fillRule` is ignored: the braille scanline rasterizer implements only the even-odd rule.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public applyFill(element: ContextElement, fillRule?: FillRule): void {
        const color = colorToAnsiFg(this.fill, this.opacity);

        if (color === undefined) {
            return;
        }

        this._warnUnsupportedComposite();

        if (element instanceof TerminalPath) {
            this._rasterizePath(element, color, true);
        } else if (element instanceof ContextText) {
            this._rasterizeText(element, color);
        }
    }

    /**
     * Rasterizes and strokes the given path or text element's outline using the current stroke
     * color, composited with the current `opacity`. Stroked text is drawn as its glyphs in the
     * stroke color, since a character cell has no outline to trace.
     */
    public applyStroke(element: ContextElement): void {
        const color = colorToAnsiFg(this.stroke, this.opacity);

        if (color === undefined) {
            return;
        }

        this._warnUnsupportedComposite();

        if (element instanceof TerminalPath) {
            this._rasterizePath(element, color, false);
        } else if (element instanceof ContextText) {
            this._rasterizeText(element, color);
        }
    }

    /** Measures text in logical units, sizing each glyph to one braille cell. */
    public measureText(text: string): TextMetrics {
        // Report metrics in logical units so layout code sizes text consistently with its space.
        const charWidth = BRAILLE_CELL_WIDTH / this._rasterScale;
        const charHeight = BRAILLE_CELL_HEIGHT / this._rasterScale;

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

    /**
     * Captures the current grid as a plain-text string, an openable URL, and RGBA image data. The
     * URL is minted once and reused, so `release()` has a single object URL to revoke.
     */
    public export(): ContextExport {
        const text = this._rasterizer.serialize({
            ansi: false,
        });
        const imageData = this._rasterizer.toImageData();

        let url: string | undefined;

        return {
            toString: () => text,
            toURL: () => (url ??= terminalSnapshotToURL(imageData, text)),
            toImage: () => Promise.resolve(imageData),
            release: () => {
                if (url?.startsWith('blob:')) {
                    URL.revokeObjectURL(url);
                }

                url = undefined;
            },
        };
    }

    /** Restores the terminal's SGR and cursor state before tearing the context down. */
    public destroy(): void {
        const rows = this._rasterizer.pixelHeight / BRAILLE_CELL_HEIGHT;

        this._output.write(`${ANSI_RESET}\x1b[?25h\x1b[${rows + 1};1H`);

        super.destroy();
    }

    private _flush(): void {
        const data = this._rasterizer.serialize();
        this._output.write(data);
    }

    private _rasterizeText(text: ContextText, color: string): void {
        const rasterizer = this._rasterizer;
        const content = text.maxWidth
            ? text.content.slice(0, Math.floor((text.maxWidth * this._rasterScale) / BRAILLE_CELL_WIDTH))
            : text.content;

        // Glyphs stay cell-sized, so approximate `textAlign`/`textBaseline` by shifting the anchor cell.
        const alignFactor = TEXT_ALIGN_FACTORS[this.textAlign] ?? 0;
        const baselineFactor = TEXT_BASELINE_FACTORS[this.textBaseline] ?? 1;

        const col = Math.round(this.scaleX(text.x) / BRAILLE_CELL_WIDTH - content.length * alignFactor);
        const row = Math.round(this.scaleY(text.y) / BRAILLE_CELL_HEIGHT - baselineFactor);

        for (let i = 0; i < content.length; i++) {
            rasterizer.setChar(col + i, row, content[i], color);
        }
    }

    private _rasterizePath(path: TerminalPath, color: string, fill: boolean): void {
        const rasterizer = this._rasterizer;

        const plot: PixelCallback = (x, y) => {
            rasterizer.setPixel(x, y, color);
        };

        if (fill) {
            fillPolygon(this._buildContours(path), plot);
            return;
        }

        this._executeCommands(path, this._dashPlot(this._thickPlot(plot)));
    }

    /**
     * Widens a plot callback to the current stroke width, mapped from logical units into raster
     * pixels. Nested inside {@link TerminalContext._dashPlot} so the dash pattern still measures
     * arc length along the centreline rather than across the brush.
     */
    private _thickPlot(plot: PixelCallback): PixelCallback {
        // A brush wider than the grid is stamped entirely out of bounds, so cap the wasted work.
        const limit = Math.max(this._rasterizer.pixelWidth, this._rasterizer.pixelHeight);
        const width = Math.min(this.lineWidth * this._rasterScale, limit);

        return thickenPixels(width, plot);
    }

    /** Gates a plot callback on the current dash pattern, mapped from logical units into raster pixels. */
    private _dashPlot(plot: PixelCallback): PixelCallback {
        const pattern = this.lineDash;

        if (!pattern.length) {
            return plot;
        }

        return dashPixels(
            pattern.map(length => length * this._rasterScale),
            this.lineDashOffset * this._rasterScale,
            plot
        );
    }

    /** Warns the first time a scene asks for compositing that inverts, rather than merely degrades, the output. */
    private _warnUnsupportedComposite(): void {
        if (this.globalCompositeOperation !== 'destination-out') {
            return;
        }

        this._warnOnce('composite', 'TerminalContext: globalCompositeOperation "destination-out" is not supported — canvas erases where the terminal draws, so this geometry renders inverted.');
    }

    /**
     * Flattens the path's commands into closed contours in raster space (following canvas subpath
     * semantics) so the interior can be filled with the even-odd rule. Mirrors the coordinate mapping
     * used by {@link executeCommands}: points via `scaleX`/`scaleY`, radii via `rasterScale`.
     */
    private _buildContours(path: TerminalPath): Vertex[][] {
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

        const context: ContourContext = {
            sx: this.scaleX,
            sy: this.scaleY,
            s: this._rasterScale,
            contours,
            flush,
            append,
        };

        for (const cmd of path.commands) {
            TERMINAL_COMMAND_HANDLERS[cmd.type].toContour(context, cmd.args);
        }

        flush();

        return contours;
    }

    private _executeCommands(path: TerminalPath, plot: PixelCallback): void {
        // Map logical coordinates into the raster (identity when no logical size is configured).
        const context: RasterContext = {
            sx: this.scaleX,
            sy: this.scaleY,
            s: this._rasterScale,
            plot,
        };

        for (const cmd of path.commands) {
            TERMINAL_COMMAND_HANDLERS[cmd.type].rasterize(context, cmd.args);
        }
    }

}

/** Creates a terminal rendering context bound to the given output adapter. */
export function createContext(output: TerminalOutput, options?: TerminalContextOptions): TerminalContext {
    return new TerminalContext(output, options);
}

// Compile-time conformance: the terminal backend factory matches the shared `ContextFactory` contract.
createContext satisfies ContextFactory<TerminalOutput, TerminalContextOptions, TerminalContext>;
