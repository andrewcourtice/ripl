import {
    Context,
    ContextText,
    dataURLToBlob,
    matrixIdentity,
    matrixMultiply,
    matrixRotate,
    matrixScale,
    matrixTranslate,
    scaleContinuous,
} from '@ripl/core';

import type {
    ContextElement,
    ContextExport,
    ContextFactory,
    ContextOptions,
    ContextPath,
    FillRule,
    Matrix,
    TextOptions,
} from '@ripl/core';

import {
    ANSI_RESET,
    resolveTerminalPaint,
} from './color';

import type {
    TerminalColor,
} from './color';

import {
    TerminalPath,
} from './path';

import {
    dashPixels,
    fillPolygon,
    thickenPixels,
} from './algorithms';

import type {
    PixelCallback,
    Vertex,
} from './algorithms';

import {
    TERMINAL_COMMAND_HANDLERS,
} from './commands';

import type {
    ContourContext,
    RasterContext,
} from './commands';

import {
    createTerminalTransform,
    letterboxMatrix,
} from './transform';

import type {
    TerminalTransform,
} from './transform';

import {
    layoutGlyphRun,
} from './text';

import {
    clipPixels,
    createClipMask,
} from './clip';

import type {
    ClipMask,
} from './clip';

import {
    isPointInContours,
    isPointOnContours,
} from './hit';

import type {
    Rasterizer,
} from './rasterizer';

import {
    BrailleRasterizer,
} from './rasterizer';

import type {
    TerminalOutput,
} from './output';

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

/** Maps logical coordinates onto themselves, for the passes that stay in logical space. */
const IDENTITY_TRANSFORM = createTerminalTransform(matrixIdentity());

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

/**
 * Terminal rendering context that rasterizes Ripl elements into character-based output via a
 * `TerminalOutput` adapter.
 *
 * Affine transforms, clipping and hit testing are all honored. A character grid still cannot honor
 * the whole canvas contract, so the following constraints apply:
 *
 * - **Text metrics are approximate**: every glyph occupies exactly one terminal cell, so
 *   `measureText` reports one cell of width per character regardless of font, and the `font`
 *   state (family, size, weight) has no visual effect.
 * - **Rotated text runs along the grid**: a glyph fills a whole cell and cannot itself be rotated,
 *   so a rotated run advances along whichever of eight compass directions the transform is nearest.
 *   A quarter-turn axis title reads down the side of a chart; it is not drawn sideways.
 * - **Stroke width approximates a non-uniform scale**: a round pen is genuinely elliptical under
 *   one, so `lineWidth` maps through the geometric mean of the transform's scale factors.
 * - **Fills use the even-odd rule only**: the scanline rasterizer ignores a `nonzero` fill rule
 *   (see {@link TerminalContext.applyFill}). Hit testing honors both.
 * - **Stroke joins and caps are always round**: `lineWidth` is honored by stamping a round brush
 *   along the path, so `lineCap`, `lineJoin` and `miterLimit` have no effect.
 *   `lineDash`/`lineDashOffset` *are* honored, with arc length approximated by plotted-pixel count.
 * - **Gradients and patterns resolve to one color**: a cell cannot interpolate, so a multi-color
 *   paint paints as its first non-transparent color.
 * - **No shadows, filters, or compositing**: `shadow*`, `filter` and `globalCompositeOperation`
 *   are ignored. `globalCompositeOperation: 'destination-out'` warns, because canvas *erases*
 *   where the terminal *draws* — the output is inverted rather than merely degraded.
 * - **Text on a path is drawn straight**: `ContextText.pathData`/`startOffset` are ignored and the
 *   run is laid out from its anchor along a straight line.
 * - **No images**: `drawImage` is inherited as a no-op.
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
    private _matrix: Matrix = matrixIdentity();
    private _matrixStack: Matrix[] = [];
    private _clip: ClipMask | null = null;
    private _clipStack: (ClipMask | null)[] = [];

    /**
     * A hit point arrives in logical space while a path's recorded commands are in the element's own
     * local space, and no transform is in force by the time a hit test runs — so the point has to be
     * mapped back through the element's world transform, as it is on canvas.
     */
    public hitTestHonorsTransform = false;

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

    /**
     * The mapping every drawing path goes through: the context's letterbox composed with whatever
     * transform is currently in force.
     */
    private _renderTransform(): TerminalTransform {
        return createTerminalTransform(letterboxMatrix(this._rasterScale, this._offsetX, this._offsetY), this._matrix);
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

    /**
     * Maps a point from the braille raster grid back into the logical space elements are authored
     * in, undoing the letterbox mapping {@link TerminalContext.rescale} installs.
     *
     * The base implementation reads only the slope of `scaleX`/`scaleY` and so would drop the
     * centring offset, placing a hit test on the non-limiting axis by the letterbox margin.
     *
     * @param x - X coordinate in raster space.
     * @param y - Y coordinate in raster space.
     * @returns The `[x, y]` pair in logical space.
     */
    public toLogicalPoint(x: number, y: number): [number, number] {
        return [(x - this._offsetX) / this._rasterScale, (y - this._offsetY) / this._rasterScale];
    }

    /**
     * Maps a point from logical space into the braille raster grid, matching what `scaleX`/`scaleY`
     * do when drawing. The inverse of {@link TerminalContext.toLogicalPoint}.
     *
     * @param x - X coordinate in logical space.
     * @param y - Y coordinate in logical space.
     * @returns The `[x, y]` pair in raster space.
     */
    public toSurfacePoint(x: number, y: number): [number, number] {
        return [x * this._rasterScale + this._offsetX, y * this._rasterScale + this._offsetY];
    }

    /** Homes the cursor and clears the rasterizer grid. */
    public clear(): void {
        this._output.write('\x1b[H');
        this._rasterizer.clear();
    }

    /** Pushes the drawing state, the current transform, and the clip region onto the saved-state stack. */
    public save(): void {
        super.save();
        this._matrixStack.push(this._matrix);
        this._clipStack.push(this._clip);
    }

    /** Restores the drawing state, the transform, and the clip region saved most recently. */
    public restore(): void {
        // The base restore no-ops at depth zero, so popping unconditionally would discard live state.
        if (this.saveDepth === 0) {
            return;
        }

        super.restore();
        this._matrix = this._matrixStack.pop() ?? matrixIdentity();
        this._clip = this._clipStack.pop() ?? null;
    }

    /** Resets the drawing state, the saved-state stack, the transform, the clip region, and the character grid. */
    public reset(): void {
        super.reset();

        this._matrix = matrixIdentity();
        this._matrixStack = [];
        this._clip = null;
        this._clipStack = [];

        this._rasterizer.clear();
    }

    /** Applies a rotation transformation, in radians. */
    public rotate(angle: number): void {
        this._matrix = matrixMultiply(this._matrix, matrixRotate(angle));
    }

    /** Applies a scale transformation with the given horizontal and vertical factors. */
    public scale(x: number, y: number): void {
        this._matrix = matrixMultiply(this._matrix, matrixScale(x, y));
    }

    /** Applies a translation transformation, in logical units. */
    public translate(x: number, y: number): void {
        this._matrix = matrixMultiply(this._matrix, matrixTranslate(x, y));
    }

    /**
     * Replaces the current transformation matrix.
     *
     * The matrix is in logical space, and this backend keeps its letterbox outside the transform, so
     * the identity restores the context's own baseline with nothing to recompose underneath.
     *
     * @param a Horizontal scaling.
     * @param b Vertical skewing.
     * @param c Horizontal skewing.
     * @param d Vertical scaling.
     * @param e Horizontal translation, in logical units.
     * @param f Vertical translation, in logical units.
     */
    // eslint-disable-next-line id-length
    public setTransform(a: number, b: number, c: number, d: number, e: number, f: number): void {
        this._matrix = [a, b, c, d, e, f];
    }

    /**
     * Multiplies the current transformation matrix by the given one.
     * @param a Horizontal scaling.
     * @param b Vertical skewing.
     * @param c Horizontal skewing.
     * @param d Vertical scaling.
     * @param e Horizontal translation, in logical units.
     * @param f Vertical translation, in logical units.
     */
    // eslint-disable-next-line id-length
    public transform(a: number, b: number, c: number, d: number, e: number, f: number): void {
        this._matrix = matrixMultiply(this._matrix, [a, b, c, d, e, f]);
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
        const color = resolveTerminalPaint(this.fill, this.opacity);

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
        const color = resolveTerminalPaint(this.stroke, this.opacity);

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

    /**
     * Confines subsequent drawing to the given path, intersected with any clip already in force.
     *
     * @param path - The clip geometry.
     * @param fillRule - Accepted for signature compatibility; the scanline rasterizer implements
     * only the even-odd rule.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public applyClip(path: ContextPath, fillRule?: FillRule): void {
        if (!(path instanceof TerminalPath)) {
            return;
        }

        this._clip = createClipMask(
            this._buildContours(path, this._renderTransform()),
            this._rasterizer.pixelWidth,
            this._rasterizer.pixelHeight,
            this._clip
        );
    }

    /**
     * Tests whether a logical-space point falls inside the given path.
     *
     * @param path - The path to test against.
     * @param x - X coordinate in logical space.
     * @param y - Y coordinate in logical space.
     * @param fillRule - The fill rule to apply. Defaults to `nonzero`, as canvas does.
     * @returns `true` when the point is inside the path.
     */
    public isPointInPath(path: ContextPath, x: number, y: number, fillRule?: FillRule): boolean {
        if (!(path instanceof TerminalPath)) {
            return false;
        }

        return isPointInContours(this._buildContours(path, IDENTITY_TRANSFORM), x, y, fillRule);
    }

    /**
     * Tests whether a logical-space point falls on the given path's stroke.
     *
     * @param path - The path to test against.
     * @param x - X coordinate in logical space.
     * @param y - Y coordinate in logical space.
     * @returns `true` when the point is on the stroke.
     */
    public isPointInStroke(path: ContextPath, x: number, y: number): boolean {
        if (!(path instanceof TerminalPath)) {
            return false;
        }

        return isPointOnContours(this._buildContours(path, IDENTITY_TRANSFORM), x, y, this.lineWidth);
    }

    /** Measures text in logical units, sizing each glyph to one character cell. */
    public measureText(text: string): TextMetrics {
        // Report metrics in logical units so layout code sizes text consistently with its space.
        const charWidth = this._rasterizer.cellWidth / this._rasterScale;
        const charHeight = this._rasterizer.cellHeight / this._rasterScale;

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
        const rows = this._rasterizer.pixelHeight / this._rasterizer.cellHeight;

        this._output.write(`${ANSI_RESET}\x1b[?25h\x1b[${rows + 1};1H`);

        super.destroy();
    }

    private _flush(): void {
        const data = this._rasterizer.serialize();
        this._output.write(data);
    }

    private _rasterizeText(text: ContextText, color: TerminalColor): void {
        const rasterizer = this._rasterizer;

        const run = layoutGlyphRun({
            content: text.content,
            x: text.x,
            y: text.y,
            maxWidth: text.maxWidth,
            transform: this._renderTransform(),
            cellWidth: rasterizer.cellWidth,
            cellHeight: rasterizer.cellHeight,
            textAlign: this.textAlign,
            textBaseline: this.textBaseline,
        });

        if (!run) {
            return;
        }

        for (let i = 0; i < run.content.length; i++) {
            const col = run.col + run.stepCol * i;
            const row = run.row + run.stepRow * i;

            // A glyph fills a whole cell, so it is clipped on the cell's centre rather than per dot.
            if (this._clip && !this._clip.contains(col * rasterizer.cellWidth + rasterizer.cellWidth / 2, row * rasterizer.cellHeight + rasterizer.cellHeight / 2)) {
                continue;
            }

            rasterizer.setChar(col, row, run.content[i], color);
        }
    }

    private _rasterizePath(path: TerminalPath, color: TerminalColor, fill: boolean): void {
        const rasterizer = this._rasterizer;
        const transform = this._renderTransform();

        const plot = clipPixels(this._clip, (x, y) => {
            rasterizer.setPixel(x, y, color);
        });

        if (fill) {
            fillPolygon(this._buildContours(path, transform), plot);
            return;
        }

        this._executeCommands(path, this._dashPlot(this._thickPlot(plot, transform), transform), transform);
    }

    /**
     * Widens a plot callback to the current stroke width, mapped from logical units into raster
     * pixels. Nested inside {@link TerminalContext._dashPlot} so the dash pattern still measures
     * arc length along the centreline rather than across the brush.
     */
    private _thickPlot(plot: PixelCallback, transform: TerminalTransform): PixelCallback {
        // A brush wider than the grid is stamped entirely out of bounds, so cap the wasted work.
        const limit = Math.max(this._rasterizer.pixelWidth, this._rasterizer.pixelHeight);
        const width = Math.min(transform.scalar(this.lineWidth), limit);

        return thickenPixels(width, plot);
    }

    /** Gates a plot callback on the current dash pattern, mapped from logical units into raster pixels. */
    private _dashPlot(plot: PixelCallback, transform: TerminalTransform): PixelCallback {
        const pattern = this.lineDash;

        if (!pattern.length) {
            return plot;
        }

        return dashPixels(
            pattern.map(length => transform.scalar(length)),
            transform.scalar(this.lineDashOffset),
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
     * Flattens the path's commands into closed contours (following canvas subpath semantics) so the
     * interior can be filled with the even-odd rule.
     *
     * The mapping is a parameter rather than the context's own, because hit testing flattens the
     * same path in logical space while drawing flattens it into the raster.
     */
    private _buildContours(path: TerminalPath, transform: TerminalTransform): Vertex[][] {
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
            transform,
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

    private _executeCommands(path: TerminalPath, plot: PixelCallback, transform: TerminalTransform): void {
        const context: RasterContext = {
            transform,
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
