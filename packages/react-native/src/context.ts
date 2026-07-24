import {
    Context,
    ContextText,
    radiansToDegrees,
} from '@ripl/core';

import type {
    ContextElement,
    ContextExport,
    ContextPath,
    FillRule,
    RenderElement,
} from '@ripl/core';

import type {
    Disposable,
} from '@ripl/utilities';

import {
    ClipOp,
    FillType,
    Skia,
} from '@shopify/react-native-skia';

import type {
    SkCanvas,
    SkImage,
    SkPicture,
} from '@shopify/react-native-skia';

import {
    buildPaint,
} from './paint';

import {
    ReactNativeSkiaPath,
} from './path';

import {
    drawSkiaText,
    measureSkiaText,
} from './font';

import {
    resolveGradientBounds,
} from './shader';

import type {
    GradientBounds,
} from './shader';

import {
    riplMatrixToSkia,
} from './transform';

import type {
    PresentListener,
    ReactNativeSkiaContextOptions,
} from './types';

function toFillType(fillRule?: FillRule): FillType {
    return fillRule === 'evenodd' ? FillType.EvenOdd : FillType.Winding;
}

/**
 * A Ripl rendering {@link Context} that draws onto a React Native Skia canvas. It subclasses the
 * abstract `Context` directly (like `@ripl/terminal`) rather than the DOM base, since React Native
 * has no DOM: each render pass records into a fresh Skia `SkPicture` (see {@link ReactNativeSkiaContext.batch})
 * that is handed to registered {@link ReactNativeSkiaContext.onPresent} listeners to paint via a Skia
 * `<Picture>`.
 *
 * All coordinates are logical (device-independent) pixels — Skia's `<Canvas>` maps them to device
 * pixels itself — so `devicePixelRatio` is fixed at `1` and the coordinate scales stay identity, which
 * keeps element hit testing correct through transforms.
 *
 * @example
 * ```ts
 * const context = new ReactNativeSkiaContext({ width: 320, height: 240 });
 * const dispose = context.onPresent(picture => setPicture(picture));
 * const scene = createScene(context);
 * // ... add elements to the scene, then render/animate via a Renderer.
 * ```
 */
export class ReactNativeSkiaContext extends Context<Element> {

    /** Skia records geometry with no per-frame side effects, so cached paths may be reused across frames. */
    public override get supportsPathCaching(): boolean {
        return true;
    }

    private _canvas?: SkCanvas;
    private _lastPicture?: SkPicture;
    private readonly _presentListeners = new Set<PresentListener>();

    constructor(options?: ReactNativeSkiaContextOptions) {
        // React Native has no DOM element; pass a dummy element like the terminal backend.
        super('react-native-skia', {} as Element, options);

        const {
            width = 0,
            height = 0,
        } = options || {};

        if (width || height) {
            this.rescale(width, height);
        }
    }

    private _cullRect() {
        return Skia.XYWHRect(0, 0, this.width, this.height);
    }

    private _gradientBounds(): GradientBounds {
        return resolveGradientBounds(this.currentRenderElement?.getBoundingBox?.(true), this.width, this.height);
    }

    private _present(picture: SkPicture): void {
        this._lastPicture = picture;
        this._presentListeners.forEach(listener => listener(picture));
    }

    /**
     * Registers a listener notified with the freshly recorded {@link SkPicture} after every render
     * pass. Returns a {@link Disposable} that removes the listener.
     *
     * @param listener - The listener to invoke with each recorded picture.
     * @returns A disposable that unregisters the listener.
     */
    public onPresent(listener: PresentListener): Disposable {
        this._presentListeners.add(listener);

        return {
            dispose: () => {
                this._presentListeners.delete(listener);
            },
        };
    }

    /**
     * Resizes the surface (typically from a React Native `onLayout`), emitting `resize` so the bound
     * scene repaints. No-ops when the dimensions are unchanged.
     *
     * @param width - The new surface width in logical pixels.
     * @param height - The new surface height in logical pixels.
     */
    public resize(width: number, height: number): void {
        if (width === this.width && height === this.height) {
            return;
        }

        this.rescale(width, height);
    }

    /**
     * Records the render pass into a fresh Skia picture. The base `batch` runs
     * `clear → save → markRenderStart → body → markRenderEnd → restore` against the recording canvas,
     * then the finished picture is presented to listeners.
     */
    public override batch<TResult = void>(body: () => TResult): TResult {
        const recorder = Skia.PictureRecorder();

        this._canvas = recorder.beginRecording(this._cullRect());

        try {
            return super.batch(body);
        } finally {
            const picture = recorder.finishRecordingAsPicture();

            this._canvas = undefined;
            this._present(picture);
        }
    }

    /** Clears the recording canvas for the current frame. */
    public override clear(): void {
        this._canvas?.clear(Skia.Color('transparent'));
    }

    /** Pushes drawing state (base) and mirrors the save onto the Skia canvas so transforms and clips scope correctly. */
    public override save(): void {
        super.save();
        this._canvas?.save();
    }

    /** Restores drawing state (base) and mirrors the restore onto the Skia canvas, staying balanced with {@link ReactNativeSkiaContext.save}. */
    public override restore(): void {
        if (this.saveDepth === 0) {
            return;
        }

        super.restore();
        this._canvas?.restore();
    }

    /** Rotates the canvas by `angle` radians (converted to the degrees Skia expects). */
    public override rotate(angle: number): void {
        this._canvas?.rotate(radiansToDegrees(angle), 0, 0);
    }

    /** Scales the canvas by (`x`, `y`). */
    public override scale(x: number, y: number): void {
        this._canvas?.scale(x, y);
    }

    /** Translates the canvas by (`x`, `y`). */
    public override translate(x: number, y: number): void {
        this._canvas?.translate(x, y);
    }

    /** Multiplies the current transform by the affine matrix `[a, b, c, d, e, f]`. */
    // eslint-disable-next-line id-length
    public override transform(a: number, b: number, c: number, d: number, e: number, f: number): void {
        this._canvas?.concat(riplMatrixToSkia([a, b, c, d, e, f]));
    }

    /** Creates a {@link ReactNativeSkiaPath} that records geometry into a native Skia path. */
    public override createPath(id?: string): ReactNativeSkiaPath {
        return new ReactNativeSkiaPath(id);
    }

    /** Clips subsequent drawing to the given path, honoring the fill rule. */
    public override applyClip(path: ContextPath, fillRule?: FillRule): void {
        const skiaPath = (path as ReactNativeSkiaPath).skia;

        skiaPath.setFillType(toFillType(fillRule));
        this._canvas?.clipPath(skiaPath, ClipOp.Intersect, true);
    }

    /** Fills the given path or text element using the current fill state. */
    public override applyFill(element: ContextElement, fillRule?: FillRule): void {
        if (!this._canvas) {
            return;
        }

        const paint = buildPaint(this.currentState, 'fill', this._gradientBounds());

        if (element instanceof ReactNativeSkiaPath) {
            element.skia.setFillType(toFillType(fillRule));
            this._canvas.drawPath(element.skia, paint);
            return;
        }

        if (element instanceof ContextText) {
            drawSkiaText(this._canvas, element, paint, this.font, this.textAlign, this.textBaseline);
        }
    }

    /** Strokes the given path or text element using the current stroke state. */
    public override applyStroke(element: ContextElement): void {
        if (!this._canvas) {
            return;
        }

        const paint = buildPaint(this.currentState, 'stroke', this._gradientBounds());

        if (element instanceof ReactNativeSkiaPath) {
            this._canvas.drawPath(element.skia, paint);
            return;
        }

        if (element instanceof ContextText) {
            drawSkiaText(this._canvas, element, paint, this.font, this.textAlign, this.textBaseline);
        }
    }

    /** Draws a Skia image at (`x`, `y`) with an optional destination size. In React Native the `image` must be a Skia `SkImage`. */
    public override drawImage(image: CanvasImageSource, x: number, y: number, width?: number, height?: number): void {
        if (!this._canvas) {
            return;
        }

        const skiaImage = image as unknown as SkImage;
        const source = Skia.XYWHRect(0, 0, skiaImage.width(), skiaImage.height());
        const destination = Skia.XYWHRect(x, y, width ?? skiaImage.width(), height ?? skiaImage.height());

        this._canvas.drawImageRect(skiaImage, source, destination, Skia.Paint());
    }

    /** Tests whether (`x`, `y`) — in logical pixels — is inside the filled region of a path. */
    public override isPointInPath(path: ContextPath, x: number, y: number, fillRule?: FillRule): boolean {
        const skiaPath = (path as ReactNativeSkiaPath).skia;

        skiaPath.setFillType(toFillType(fillRule));

        return skiaPath.contains(x, y);
    }

    /** Tests whether (`x`, `y`) — in logical pixels — is on the stroked outline of a path. */
    public override isPointInStroke(path: ContextPath, x: number, y: number): boolean {
        const outline = (path as ReactNativeSkiaPath).skia.copy();

        outline.stroke({
            width: this.lineWidth,
        });

        return outline.contains(x, y);
    }

    /** Measures text synchronously using Skia font metrics (see {@link measureSkiaText}). */
    public override measureText(text: string, font?: string): TextMetrics {
        return measureSkiaText(text, {
            font: font ?? this.font,
        });
    }

    /**
     * Hit-tests the elements rendered in the last frame for the given event types at the logical
     * point (`x`, `y`), returning them topmost-first. Exposes the protected base `hitTest` so the
     * gesture/interaction layer can drive pointer events.
     *
     * @param events - The event types an element must listen for to be considered.
     * @param x - The x coordinate in logical pixels.
     * @param y - The y coordinate in logical pixels.
     * @returns The intersecting elements, sorted topmost-first.
     */
    public queryHits(events: string[], x: number, y: number): RenderElement[] {
        return this.hitTest(events, x, y);
    }

    /**
     * Exports the most recently presented frame as a PNG. `toString`/`toURL` return a base64 PNG
     * data URL; `toImage` resolves to the decoded RGBA pixels.
     *
     * @returns Format-specific exporters for the last rendered frame.
     */
    public override export(): ContextExport {
        const picture = this._lastPicture;
        const width = Math.max(1, Math.floor(this.width));
        const height = Math.max(1, Math.floor(this.height));
        const surface = picture ? Skia.Surface.MakeOffscreen(width, height) : null;

        if (!picture || !surface) {
            throw new Error('export() requires a rendered frame and an available Skia surface');
        }

        surface.getCanvas().drawPicture(picture);

        const image = surface.makeImageSnapshot();
        const dataURL = `data:image/png;base64,${image.encodeToBase64()}`;

        return {
            toString: () => dataURL,
            toURL: () => dataURL,
            toImage: () => {
                const pixels = image.readPixels();

                if (!pixels) {
                    return Promise.reject(new Error('Failed to read pixels from the exported image'));
                }

                return Promise.resolve({
                    data: new Uint8ClampedArray(pixels as ArrayLike<number>),
                    width,
                    height,
                    colorSpace: 'srgb',
                } as unknown as ImageData);
            },
        };
    }

    /** Clears present listeners and disposes the context. */
    public override destroy(): void {
        this._presentListeners.clear();
        this._lastPicture = undefined;
        super.destroy();
    }

}
