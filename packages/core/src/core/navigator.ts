import {
    EventBus,
} from './event-bus';

import type {
    EventMap,
} from './event-bus';

import {
    clamp,
} from '../math';

import type {
    Point,
} from '../math';

/** A 2D affine view transform: uniform scale `k` plus translation `[x, y]` (screen pixels). */
export interface NavigatorTransform {
    /** Uniform scale (zoom) factor. */
    k: number;
    /** Horizontal translation, in screen pixels. */
    x: number;
    /** Vertical translation, in screen pixels. */
    y: number;
}

/** A rectangular brush selection in the navigator's pixel space. */
export interface NavigatorBrush {
    /** X coordinate of the selection's first corner, in pixels. */
    x0: number;
    /** Y coordinate of the selection's first corner, in pixels. */
    y0: number;
    /** X coordinate of the selection's opposite corner, in pixels. */
    x1: number;
    /** Y coordinate of the selection's opposite corner, in pixels. */
    y1: number;
}

/** The pixel dimensions of the surface the navigator drives (used to centre/fit content). */
export interface NavigatorViewport {
    /** Width of the surface, in pixels. */
    width: number;
    /** Height of the surface, in pixels. */
    height: number;
}

/** Enable/disable a single interaction, optionally with a sensitivity multiplier. */
export type NavigatorInteractionOption = boolean | {
    /** Whether the interaction is enabled. */
    enabled?: boolean;
    /** Multiplier applied to the interaction's input, scaling its responsiveness. */
    sensitivity?: number;
};

/** Configures which navigator interactions (zoom, pan, brush) are enabled. */
export interface NavigatorInteractions {
    /** Configuration for wheel/pinch zoom. */
    zoom?: NavigatorInteractionOption;
    /** Configuration for drag panning. */
    pan?: NavigatorInteractionOption;
    /** Configuration for rectangular brush selection. */
    brush?: NavigatorInteractionOption;
}

/** Options for constructing a {@link Navigator}. */
export interface NavigatorOptions {
    /** Minimum and maximum zoom factor `k`. Defaults to `[0.001, 1000]`. */
    scaleExtent?: [number, number];
    /** Initial viewport dimensions used by {@link Navigator.centerOn}/{@link Navigator.fitBounds}. */
    viewport?: NavigatorViewport;
}

/** Options for {@link Navigator.fitBounds}. */
export interface NavigatorFitOptions {
    /** Viewport to fit into (defaults to the navigator's current viewport). */
    viewport?: NavigatorViewport;
    /** Padding in pixels kept between the fitted content and the viewport edges. */
    padding?: number;
}

/** Events emitted by a {@link Navigator}. */
export interface NavigatorEventMap extends EventMap {
    /** Emitted when the zoom factor changes, carrying the new transform. */
    zoom: NavigatorTransform;
    /** Emitted when the view is panned, carrying the new transform. */
    pan: NavigatorTransform;
    /** Emitted whenever the transform changes for any reason (zoom or pan), carrying the new transform. */
    change: NavigatorTransform;
    /** Emitted as the brush selection changes, carrying the normalised selection. */
    brush: NavigatorBrush;
    /** Emitted when a brush gesture ends, carrying the final selection or `null` when cleared. */
    brushend: NavigatorBrush | null;
}

const DEFAULT_SCALE_EXTENT: [number, number] = [0.001, 1000];

/**
 * Rescales a scale's domain to the window currently visible under a navigator transform. The scale
 * maps data → the given pixel `range`; inverting the transformed range endpoints back through the
 * scale yields the zoomed/panned data domain. This is how a cartesian chart turns navigator gestures
 * into axis rescaling (`scale.inverse`) without transforming the rendered geometry.
 */
export function rescaleDomain<TDomain>(
    scale: { inverse(value: number): TDomain },
    transform: NavigatorTransform,
    range: [number, number]
): [TDomain, TDomain] {
    const [
        rangeMin,
        rangeMax,
    ] = range;

    return [
        scale.inverse((rangeMin - transform.x) / transform.k),
        scale.inverse((rangeMax - transform.x) / transform.k),
    ];
}

/**
 * An interactive 2D pan/zoom/brush controller — the flat-scene analogue of the 3D `Camera`. This
 * base class is deliberately **context-agnostic**: it owns the view model (a `{ k, x, y }` transform
 * plus an optional brush selection) and the imperative commands that mutate it, but it attaches no
 * input listeners of its own. That mirrors the `Context`/`DOMContext` split — the DOM-bound
 * `DOMNavigator` in `@ripl/dom` extends this class to translate real wheel/pointer/touch gestures
 * into these commands, while non-DOM environments can drive the same view model programmatically (or
 * subclass it with their own input source).
 *
 * The navigator does not itself repaint; consumers react to the emitted `zoom`/`pan`/`change`/
 * `brush`/`brushend` events (e.g. rescaling axis domains via {@link rescaleDomain}, or applying the
 * transform to a context). Translation is unbounded, so a consumer can pan and zoom to content that
 * currently sits outside the viewport — the Figma-style "navigate anywhere" behaviour.
 */
export class Navigator extends EventBus<NavigatorEventMap> {

    protected _transform: NavigatorTransform = {
        k: 1,
        x: 0,
        y: 0,
    };

    protected _brush: NavigatorBrush | null = null;
    protected _scaleExtent: [number, number];
    protected _viewport: NavigatorViewport;

    constructor(options?: NavigatorOptions) {
        super();

        this._scaleExtent = options?.scaleExtent ?? [...DEFAULT_SCALE_EXTENT];
        this._viewport = {
            width: options?.viewport?.width ?? 0,
            height: options?.viewport?.height ?? 0,
        };
    }

    /** The current view transform (a copy — mutating it does not affect the navigator). */
    public get transform(): NavigatorTransform {
        return {
            ...this._transform,
        };
    }

    /** The current brush selection, or `null` when nothing is selected. */
    public get brush(): NavigatorBrush | null {
        return this._brush && {
            ...this._brush,
        };
    }

    /** The minimum/maximum zoom factor the transform is clamped to. */
    public get scaleExtent(): [number, number] {
        return [
            ...this._scaleExtent,
        ];
    }

    /** The viewport dimensions used by {@link centerOn}/{@link fitBounds}. */
    public get viewport(): NavigatorViewport {
        return {
            ...this._viewport,
        };
    }

    public set viewport(viewport: NavigatorViewport) {
        this._viewport = {
            ...viewport,
        };
    }

    protected _commit(event: 'zoom' | 'pan'): void {
        const transform = this.transform;

        this.emit(event, transform);
        this.emit('change', transform);
    }

    /** Applies the transform to a point in content space, returning its on-screen position. */
    public applyPoint(point: Point): Point {
        return [
            this._transform.k * point[0] + this._transform.x,
            this._transform.k * point[1] + this._transform.y,
        ];
    }

    /** Inverts a screen-space point back to content space. */
    public invertPoint(point: Point): Point {
        return [
            (point[0] - this._transform.x) / this._transform.k,
            (point[1] - this._transform.y) / this._transform.k,
        ];
    }

    /** Replaces the view transform outright (clamping `k` to the scale extent). */
    public setTransform(transform: NavigatorTransform): void {
        this._transform = {
            k: clamp(transform.k, this._scaleExtent[0], this._scaleExtent[1]),
            x: transform.x,
            y: transform.y,
        };

        this._commit('zoom');
    }

    /** Pans the view by a pixel delta. */
    public panBy(dx: number, dy: number): void {
        this._transform = {
            k: this._transform.k,
            x: this._transform.x + dx,
            y: this._transform.y + dy,
        };

        this._commit('pan');
    }

    /** Pans the view to an absolute translation. */
    public panTo(x: number, y: number): void {
        this._transform = {
            k: this._transform.k,
            x,
            y,
        };

        this._commit('pan');
    }

    /** Multiplies the zoom by `factor`, keeping `center` (screen pixels, defaults to the origin) fixed. */
    public zoomBy(factor: number, center: Point = [0, 0]): void {
        const nextK = clamp(this._transform.k * factor, this._scaleExtent[0], this._scaleExtent[1]);
        const ratio = nextK / this._transform.k;

        this._transform = {
            k: nextK,
            x: center[0] - ratio * (center[0] - this._transform.x),
            y: center[1] - ratio * (center[1] - this._transform.y),
        };

        this._commit('zoom');
    }

    /** Sets the absolute zoom factor, keeping `center` fixed. */
    public zoomTo(k: number, center: Point = [0, 0]): void {
        this.zoomBy(k / this._transform.k, center);
    }

    /**
     * Centres a content-space point within the viewport, keeping the current zoom. Useful for
     * bringing an off-screen element into view without changing scale.
     */
    public centerOn(point: Point, viewport: NavigatorViewport = this._viewport): void {
        const k = this._transform.k;

        this._transform = {
            k,
            x: viewport.width / 2 - k * point[0],
            y: viewport.height / 2 - k * point[1],
        };

        this._commit('pan');
    }

    /**
     * Zooms and pans so a content-space box fills the viewport (respecting the scale extent and an
     * optional padding). This is the primary way to jump the view to content — including content that
     * currently lies entirely outside the viewport.
     */
    public fitBounds(bounds: NavigatorBrush, options?: NavigatorFitOptions): void {
        const viewport = options?.viewport ?? this._viewport;
        const padding = options?.padding ?? 0;

        const boxWidth = Math.max(1e-6, Math.abs(bounds.x1 - bounds.x0));
        const boxHeight = Math.max(1e-6, Math.abs(bounds.y1 - bounds.y0));
        const availableWidth = Math.max(0, viewport.width - padding * 2);
        const availableHeight = Math.max(0, viewport.height - padding * 2);

        const k = clamp(
            Math.min(availableWidth / boxWidth, availableHeight / boxHeight),
            this._scaleExtent[0],
            this._scaleExtent[1]
        );

        const centreX = (bounds.x0 + bounds.x1) / 2;
        const centreY = (bounds.y0 + bounds.y1) / 2;

        this._transform = {
            k,
            x: viewport.width / 2 - k * centreX,
            y: viewport.height / 2 - k * centreY,
        };

        this._commit('zoom');
    }

    /** Resets the transform to the identity (no zoom, no pan). */
    public reset(): void {
        this._transform = {
            k: 1,
            x: 0,
            y: 0,
        };

        this._commit('zoom');
    }

    /** Sets the brush selection, normalising the extent, and emits a `brush` event. */
    public setBrush(brush: NavigatorBrush): void {
        this._brush = {
            x0: Math.min(brush.x0, brush.x1),
            y0: Math.min(brush.y0, brush.y1),
            x1: Math.max(brush.x0, brush.x1),
            y1: Math.max(brush.y0, brush.y1),
        };

        this.emit('brush', this._brush);
    }

    /** Clears the brush selection and emits a `brushend` event with `null`. */
    public clearBrush(): void {
        this._brush = null;
        this.emit('brushend', null);
    }

}
