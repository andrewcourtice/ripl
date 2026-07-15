import {
    ContextPath,
    ContextText,
    createFrameBuffer,
    getThetaPoint,
    isGradientString,
    measureText,
    normaliseBorderRadius,
    parseColor,
    parseGradient,
    radiansToDegrees,
    serialiseRGBA,
} from '@ripl/core';

import type {
    BorderRadius,
    ContextElement,
    ContextExport,
    ContextOptions,
    FillRule,
    Gradient,
    GradientColorStop,
    Element as RiplElement,
    TextAlignment,
    TextBaseline,
    TextOptions,
} from '@ripl/core';

import {
    DOMContext,
} from '@ripl/dom';

import {
    objectForEach,
    objectMap,
    stringUniqueId,
} from '@ripl/utilities';

import type {
    AnyFunction,
    GetMutableKeys,
} from '@ripl/utilities';

import {
    reconcileNode,
} from '@ripl/dom';

import type {
    ReconcilerOptions,
    VNode,
} from '@ripl/dom';

type SVGVNode = VNode<SVGContextElement>;
type GradientElementFactory = (gradient: Gradient) => SVGElement;
type GradientElementUpdater = (element: SVGElement, gradient: Gradient) => void;

/** The mutable subset of `CSSStyleDeclaration` properties that can be assigned as inline SVG element styles. */
type Styles = {
    [TKey in GetMutableKeys<CSSStyleDeclaration>]: CSSStyleDeclaration[TKey];
};

/** Definition for an SVG context element, describing its tag, inline styles, and attributes. */
export interface SVGContextElementDefinition {
    /** The SVG element tag name to create. */
    tag: keyof SVGElementTagNameMap;
    /** Inline styles applied to the element. */
    styles: Partial<Styles>;
    /** Attributes set on the element. */
    attributes: Record<string, string>;
    /** Optional text content rendered inside the element. */
    textContent?: string;
}

/** An SVG-specific context element carrying its rendering definition. */
export interface SVGContextElement extends ContextElement {
    /** The rendering definition describing how to build this element's SVG node. */
    definition: SVGContextElementDefinition;
}

const SVG_STYLE_MAP = {
    textAnchor: {
        left: 'start',
        right: 'end',
        center: 'middle',
    } as Record<TextAlignment, string>,
    alignmentBaseline: {
        top: 'text-before-edge',
        middle: 'middle',
        bottom: 'text-after-edge',
    } as Record<TextBaseline, string>,
} as Record<keyof Styles, Record<string, string>>;

function createSVGElement<TTag extends keyof SVGElementTagNameMap>(tag: TTag) {
    return document.createElementNS('http://www.w3.org/2000/svg', tag);
}

function normaliseGradientColor(color: string): string {
    const rgba = parseColor(color);
    return rgba ? serialiseRGBA(...rgba) : color;
}

function applyGradientStops(gradientEl: SVGElement, stops: GradientColorStop[]) {
    gradientEl.replaceChildren();

    stops.forEach((stop) => {
        const stopEl = createSVGElement('stop');
        stopEl.setAttribute('offset', `${(stop.offset ?? 0) * 100}%`);
        stopEl.setAttribute('stop-color', normaliseGradientColor(stop.color));
        gradientEl.appendChild(stopEl);
    });
}

function applyLinearGradientAttributes(element: SVGElement, gradient: Gradient): void {
    const angleRad = ((gradient as { angle: number }).angle - 90) * (Math.PI / 180);
    const x1 = 0.5 - Math.cos(angleRad) * 0.5;
    const y1 = 0.5 - Math.sin(angleRad) * 0.5;
    const x2 = 0.5 + Math.cos(angleRad) * 0.5;
    const y2 = 0.5 + Math.sin(angleRad) * 0.5;

    element.setAttribute('x1', x1.toFixed(4));
    element.setAttribute('y1', y1.toFixed(4));
    element.setAttribute('x2', x2.toFixed(4));
    element.setAttribute('y2', y2.toFixed(4));
}

function applyRadialGradientAttributes(element: SVGElement, gradient: Gradient): void {
    const cx = (gradient as { position: [number, number] }).position[0] / 100;
    const cy = (gradient as { position: [number, number] }).position[1] / 100;

    element.setAttribute('cx', cx.toFixed(4));
    element.setAttribute('cy', cy.toFixed(4));
    element.setAttribute('r', '0.5');
    element.setAttribute('fx', cx.toFixed(4));
    element.setAttribute('fy', cy.toFixed(4));
}

const GRADIENT_ELEMENT_FACTORIES: Record<string, GradientElementFactory> = {
    linear: () => createSVGElement('linearGradient'),
    radial: () => createSVGElement('radialGradient'),
};

const GRADIENT_ELEMENT_UPDATERS: Record<string, GradientElementUpdater> = {
    linear: applyLinearGradientAttributes,
    radial: applyRadialGradientAttributes,
};

function createSVGGradientElement(gradient: Gradient, gradientId: string): SVGElement | undefined {
    const factory = GRADIENT_ELEMENT_FACTORIES[gradient.type];

    if (!factory) {
        return undefined;
    }

    const element = factory(gradient);

    element.setAttribute('id', gradientId);
    element.setAttribute('gradientUnits', 'objectBoundingBox');

    if (gradient.repeating) {
        element.setAttribute('spreadMethod', 'repeat');
    }

    GRADIENT_ELEMENT_UPDATERS[gradient.type]?.(element, gradient);
    applyGradientStops(element, gradient.stops);

    return element;
}

function updateSVGGradientElement(element: SVGElement, gradient: Gradient): void {
    GRADIENT_ELEMENT_UPDATERS[gradient.type]?.(element, gradient);
    applyGradientStops(element, gradient.stops);
}

function updateSVGElement(svgElement: SVGElement, { id, definition }: SVGContextElement) {
    const {
        styles,
        attributes,
        textContent,
    } = definition;

    svgElement.setAttribute('id', id);
    Object.assign(svgElement.style, styles);
    objectForEach(attributes, (key, value) => svgElement.setAttribute(key.toString(), value));

    if (textContent !== undefined) {
        svgElement.textContent = textContent;
    }
}

function mapSVGStyles(styles: Partial<Styles>) {
    return objectMap(styles, (key, value) => {
        const mapped = SVG_STYLE_MAP[key];
        return mapped?.[value as string] ?? value;
    });
}

function getImageSourceSize(image: CanvasImageSource): [number, number] {
    if (image instanceof HTMLImageElement || image instanceof HTMLCanvasElement) {
        return [image.width, image.height];
    }

    if (image instanceof SVGImageElement) {
        return [image.width.baseVal.value, image.height.baseVal.value];
    }

    if (image instanceof HTMLVideoElement) {
        return [image.videoWidth, image.videoHeight];
    }

    if (image instanceof ImageBitmap) {
        return [image.width, image.height];
    }

    if (typeof OffscreenCanvas !== 'undefined' && image instanceof OffscreenCanvas) {
        return [image.width, image.height];
    }

    return [0, 0];
}

function canvasImageSourceToDataURL(image: CanvasImageSource, width?: number, height?: number): string {
    const [sourceWidth, sourceHeight] = getImageSourceSize(image);
    const imgWidth = width ?? sourceWidth;
    const imgHeight = height ?? sourceHeight;
    const canvas = document.createElement('canvas');

    canvas.width = imgWidth;
    canvas.height = imgHeight;

    const ctx = canvas.getContext('2d');

    if (ctx) {
        ctx.drawImage(image, 0, 0, imgWidth, imgHeight);
    }

    return canvas.toDataURL();
}

/** Rasterizes serialized SVG markup to `ImageData` by decoding it through an `Image` onto a canvas. */
function svgMarkupToImageData(markup: string, width: number, height: number): Promise<ImageData> {
    const imgWidth = Math.max(1, Math.round(width));
    const imgHeight = Math.max(1, Math.round(height));
    const url = URL.createObjectURL(new Blob([markup], {
        type: 'image/svg+xml',
    }));

    return new Promise((resolve, reject) => {
        const image = new Image();

        image.onload = () => {
            URL.revokeObjectURL(url);

            const canvas = document.createElement('canvas');

            canvas.width = imgWidth;
            canvas.height = imgHeight;

            const context = canvas.getContext('2d');

            if (!context) {
                reject(new Error('Unable to acquire a 2D context for SVG export'));
                return;
            }

            context.drawImage(image, 0, 0, imgWidth, imgHeight);
            resolve(context.getImageData(0, 0, imgWidth, imgHeight));
        };

        image.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to rasterize SVG for export'));
        };

        image.src = url;
    });
}

/** SVG-specific path implementation that builds an SVG `d` attribute string from drawing commands. */
export class SVGPath extends ContextPath implements SVGContextElement {

    /** The rendering definition describing this path's SVG `<path>` node. */
    public definition: SVGContextElementDefinition;

    constructor(id?: string) {
        super(id);

        this.definition = {
            tag: 'path',
            attributes: {
                d: '',
            },
            styles: {
                stroke: 'none',
                fill: 'none',
            },
        };
    }

    private _appendElementData(data: string) {
        this.definition.attributes.d = `${this.definition.attributes.d} ${data}`.trim();
    }

    /** Adds an arc centred at `(x, y)` with the given radius to the path. */
    public arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, counterclockwise?: boolean): void {
        const [x1, y1] = getThetaPoint(startAngle, radius, x, y);
        const [x2, y2] = getThetaPoint(endAngle, radius, x, y);
        const largeArcFlag = +(Math.abs(endAngle - startAngle) > Math.PI);
        const clockwiseFlag = +!counterclockwise;

        this.moveTo(x1, y1);
        this._appendElementData(`A ${radius} ${radius} 0 ${largeArcFlag} ${clockwiseFlag} ${x2},${y2}`);
    }

    /** Adds an arc connecting two tangents defined by the given points to the path. */
    public arcTo(x1: number, y1: number, x2: number, y2: number, radius: number): void {
        this.moveTo(x1, y1);
        this._appendElementData(`A ${radius} ${radius} 0 0 1 ${x2},${y2}`);
    }

    /** Adds a full circle centred at `(x, y)` to the path. */
    public circle(x: number, y: number, radius: number): void {
        this.moveTo(x + radius, y);
        this._appendElementData(`a ${radius} ${radius} 0 1 0 ${radius * -2},0`);
        this._appendElementData(`a ${radius} ${radius} 0 1 0 ${radius * 2},0`);
    }

    /** Adds a cubic Bézier curve to the path. */
    public bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): void {
        this._appendElementData(`C ${cp1x},${cp1y} ${cp2x},${cp2y} ${x},${y}`);
    }

    /** Closes the current sub-path with a straight line back to its start. */
    public closePath(): void {
        this._appendElementData('Z');
    }

    /** Adds an elliptical arc centred at `(x, y)` to the path. */
    public ellipse(x: number, y: number, radiusX: number, radiusY: number, rotation: number, startAngle: number, endAngle: number, counterclockwise?: boolean): void {
        const rotDeg = rotation * 180 / Math.PI;
        const cos = Math.cos(rotation);
        const sin = Math.sin(rotation);

        const pointOnEllipse = (angle: number): [number, number] => {
            const ex = radiusX * Math.cos(angle);
            const ey = radiusY * Math.sin(angle);
            return [
                x + ex * cos - ey * sin,
                y + ex * sin + ey * cos,
            ];
        };

        const isFull = Math.abs(endAngle - startAngle) >= Math.PI * 2;

        if (isFull) {
            const [mx, my] = pointOnEllipse(startAngle);
            const [ox, oy] = pointOnEllipse(startAngle + Math.PI);
            this.moveTo(mx, my);
            this._appendElementData(`A ${radiusX} ${radiusY} ${rotDeg} 1 ${+!counterclockwise} ${ox},${oy}`);
            this._appendElementData(`A ${radiusX} ${radiusY} ${rotDeg} 1 ${+!counterclockwise} ${mx},${my}`);
        } else {
            const [x1, y1] = pointOnEllipse(startAngle);
            const [x2, y2] = pointOnEllipse(endAngle);
            let sweep = counterclockwise
                ? startAngle - endAngle
                : endAngle - startAngle;

            if (sweep < 0) sweep += Math.PI * 2;
            const largeArc = +(sweep > Math.PI);

            this.moveTo(x1, y1);
            this._appendElementData(`A ${radiusX} ${radiusY} ${rotDeg} ${largeArc} ${+!counterclockwise} ${x2},${y2}`);
        }
    }

    /** Adds a straight line from the current point to `(x, y)`. */
    public lineTo(x: number, y: number): void {
        this._appendElementData(`L ${x},${y}`);
    }

    /** Moves the current point to `(x, y)` without adding a line. */
    public moveTo(x: number, y: number): void {
        this._appendElementData(`M ${x},${y}`);
    }

    /** Adds a quadratic Bézier curve to the path. */
    public quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void {
        this._appendElementData(`Q ${cpx},${cpy} ${x},${y}`);
    }

    /** Adds a rectangle to the path. */
    public rect(x: number, y: number, width: number, height: number): void {
        this.moveTo(x, y);
        this.lineTo(x + width, y);
        this.lineTo(x + width, y + height);
        this.lineTo(x, y + height);
        this.lineTo(x, y);
    }

    /** Adds a rounded rectangle to the path, using the given corner radii. */
    public roundRect(x: number, y: number, width: number, height: number, radii?: BorderRadius): void {
        if (!radii) {
            return this.rect(x, y, width, height);
        }

        const [
            borderTopLeft,
            borderTopRight,
            borderBottomRight,
            borderBottomLeft,
        ] = normaliseBorderRadius(radii);

        this.moveTo(x + borderTopLeft, y);
        this.lineTo(x + width - borderTopRight, y);
        this._appendElementData(`A ${borderTopRight} ${borderTopRight} 0 0 1 ${x + width},${y + borderTopRight}`);
        this.lineTo(x + width, y + height - borderBottomRight);
        this._appendElementData(`A ${borderBottomRight} ${borderBottomRight} 0 0 1 ${x + width - borderBottomRight},${y + height}`);
        this.lineTo(x + borderBottomLeft, y + height);
        this._appendElementData(`A ${borderBottomLeft} ${borderBottomLeft} 0 0 1 ${x},${y + height - borderBottomLeft}`);
        this.lineTo(x, y + borderTopLeft);
        this._appendElementData(`A ${borderTopLeft} ${borderTopLeft} 0 0 1 ${x + borderTopLeft},${y}`);
        this.closePath();
    }

}

/** SVG-specific text element mapping position and content to SVG `<text>` attributes. */
export class SVGText extends ContextText implements SVGContextElement {

    /** The rendering definition describing this text's SVG `<text>` node. */
    public definition: SVGContextElementDefinition;

    constructor(options: TextOptions) {
        super(options);

        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const _this = this;

        this.definition = {
            tag: 'text',
            styles: {
                fill: 'none',
            },
            attributes: {
                get x() {
                    return _this.x.toString();
                },
                get y() {
                    return _this.y.toString();
                },
            },
            get textContent() {
                return _this.pathData ? undefined : _this.content;
            },
        };
    }
}

/** SVG-specific image element wrapping a `CanvasImageSource` as an SVG `<image>` tag. */
export class SVGImage implements SVGContextElement {

    /** Unique identifier for this element. */
    public readonly id: string;
    /** The rendering definition describing this image's SVG `<image>` node. */
    public definition: SVGContextElementDefinition;

    constructor(id: string, href: string, x: number, y: number, width: number, height: number) {
        this.id = id;

        this.definition = {
            tag: 'image',
            styles: {},
            attributes: {
                href,
                x: x.toString(),
                y: y.toString(),
                width: width.toString(),
                height: height.toString(),
                preserveAspectRatio: 'none',
            },
        };
    }
}

/** SVG `<textPath>` element for rendering text along a path defined in `<defs>`. */
export class SVGTextPath implements SVGContextElement {

    /** Unique identifier for this element, derived from the owning text element's id. */
    public readonly id: string;
    /** The rendering definition describing this element's SVG `<textPath>` node. */
    public definition: SVGContextElementDefinition;

    constructor(textId: string, pathId: string, content: string, startOffset?: number) {
        this.id = `${textId}:textpath`;

        this.definition = {
            tag: 'textPath',
            styles: {},
            attributes: {
                href: `#${pathId}`,
                ...(startOffset !== undefined ? { startOffset: `${startOffset * 100}%` } : {}),
            },
            textContent: content,
        };
    }
}

/** SVG rendering context implementation, mapping the unified API to SVG DOM elements via virtual-DOM reconciliation. */
export class SVGContext extends DOMContext<SVGSVGElement> {

    private _vtree: SVGVNode;
    private _domCache: Map<string, Element>;
    private _reconcilerOptions: ReconcilerOptions<SVGContextElement>;
    private _requestFrame: (callback: AnyFunction) => void;
    private _defs: SVGDefsElement;
    private _gradientCache: Map<string, { gradientId: string;
        element: SVGElement; }>;
    private _textPathCache: Map<string, { pathId: string;
        element: SVGElement; }>;
    private _transformStack: string[][];
    private _currentTransforms: string[];
    private _clipCache: Map<string, { clipId: string;
        element: SVGElement; }>;
    private _clipStack: (string | undefined)[];
    private _currentClipId: string | undefined;
    private _currentParentVNode: SVGVNode;
    private _vnodeStack: SVGVNode[];

    constructor(target: string | HTMLElement, options?: ContextOptions) {
        const svg = createSVGElement('svg');

        svg.style.display = 'block';
        svg.style.width = '100%';
        svg.style.height = '100%';

        super('svg', target, svg, options);

        this.buffer = true;
        // SVG hit testing runs against the live DOM geometry, which already composes ancestor
        // <g> transforms, so no manual local-space point mapping is needed.
        this.hitTestHonoursTransform = true;
        this._vtree = {
            id: '__root__',
            tag: 'svg',
            children: [],
        };
        this._currentParentVNode = this._vtree;
        this._vnodeStack = [];

        this._reconcilerOptions = {
            createElement: (tag, id) => {
                const el = createSVGElement(tag as keyof SVGElementTagNameMap);
                el.setAttribute('id', id);
                return el;
            },
            updateElement: (domNode, element) => {
                updateSVGElement(domNode as SVGElement, element);
            },
            getElementTag: (element) => element.definition.tag,
            excludeSelectors: ['defs'],
        };

        this._domCache = new Map();
        this._gradientCache = new Map();
        this._textPathCache = new Map();
        this._transformStack = [];
        this._currentTransforms = [];
        this._clipCache = new Map();
        this._clipStack = [];
        this._currentClipId = undefined;
        this._defs = createSVGElement('defs');
        this.element.appendChild(this._defs);
        this._requestFrame = createFrameBuffer();

        this.init();
    }

    private _removeGradientDef(cacheKey: string): void {
        const existing = this._gradientCache.get(cacheKey);

        if (!existing) {
            return;
        }

        this._defs.removeChild(existing.element);
        this._gradientCache.delete(cacheKey);
    }

    private _resolveGradientStyle(value: string, cacheKey: string): string {
        if (!isGradientString(value)) {
            this._removeGradientDef(cacheKey);
            return value;
        }

        const gradient = parseGradient(value);

        if (!gradient) {
            return value;
        }

        const cached = this._gradientCache.get(cacheKey);

        if (cached) {
            updateSVGGradientElement(cached.element, gradient);
            return `url(#${cached.gradientId})`;
        }

        const gradientId = `gradient-${stringUniqueId()}`;
        const gradientEl = createSVGGradientElement(gradient, gradientId);

        if (!gradientEl) {
            // Conic gradients fall back to CSS string
            return value;
        }

        this._defs.appendChild(gradientEl);
        this._gradientCache.set(cacheKey, {
            gradientId,
            element: gradientEl,
        });

        return `url(#${gradientId})`;
    }

    protected rescale(width: number, height: number) {
        this.element.setAttribute('viewBox', `0 0 ${width} ${height}`);
        super.rescale(width, height);
    }

    private _setElementStyles(element: SVGContextElement, styles: Partial<Styles>) {
        Object.assign(element.definition.styles, mapSVGStyles({
            filter: this.currentState.filter,
            direction: this.currentState.direction,
            font: this.currentState.font,
            fontKerning: this.currentState.fontKerning,
            textAnchor: this.currentState.textAlign,
            alignmentBaseline: this.currentState.textBaseline,
            opacity: this.currentState.opacity.toString(),
            zIndex: (this.currentState.zIndex || '').toString(),
            // Shadow properties (shadowBlur/Color/OffsetX/OffsetY) are intentionally not mapped: SVG
            // has no direct equivalent (it needs an <feDropShadow> filter in <defs>), so they are
            // silently dropped rather than approximated.
            ...styles,
        }));

        const transformStr = this._currentTransforms.join(' ');

        if (transformStr) {
            element.definition.attributes.transform = transformStr;
        }

        if (this._currentClipId) {
            element.definition.attributes['clip-path'] = `url(#${this._currentClipId})`;
        }
    }

    private _isPointIn(method: 'stroke' | 'fill', path: SVGPath, x: number, y: number) {
        const element = this.element.getElementById(path.id);
        const point = this.element.createSVGPoint();

        point.x = x;
        point.y = y;

        return element instanceof SVGGeometryElement && (method === 'stroke'
            ? element.isPointInStroke(point)
            : element.isPointInFill(point)
        );
    }

    private _addToVTree(contextElement: SVGContextElement): void {
        this._currentParentVNode.children.push({
            id: contextElement.id,
            tag: contextElement.definition.tag,
            element: contextElement,
            children: [],
        });
    }

    private _removeFromVTree(id: string): void {
        const index = this._currentParentVNode.children.findIndex(c => c.id === id);

        if (index !== -1) {
            this._currentParentVNode.children.splice(index, 1);
        }
    }

    private _render() {
        reconcileNode(this.element, this._vtree, this._domCache, this._reconcilerOptions);
    }

    /** Signals the start of a render pass; resets the virtual DOM tree and group-nesting pointer at the outermost depth. */
    public markRenderStart(): void {
        if (this.renderDepth === 0) {
            this._vtree = {
                id: '__root__',
                tag: 'svg',
                children: [],
            };
            this._currentParentVNode = this._vtree;
            this._vnodeStack = [];
        }

        super.markRenderStart();
    }

    /** Signals the end of a render pass, reconciling the virtual DOM tree to the SVG surface at the outermost depth. */
    public markRenderEnd(): void {
        super.markRenderEnd();

        if (this.renderDepth !== 0) {
            return;
        }

        if (this.buffer) {
            this._requestFrame(() => this._render());
        } else {
            this._render();
        }
    }

    /** Captures a snapshot of the SVG surface and returns format-specific exporters (see {@link ContextExport}). */
    public export(): ContextExport {
        // Rendering is deferred to rAF when buffering is enabled, so force a synchronous reconcile
        // to ensure the serialized markup reflects the latest scene.
        this._render();

        const markup = new XMLSerializer().serializeToString(this.element);
        const width = this.width;
        const height = this.height;

        return {
            toString: () => markup,
            toURL: () => URL.createObjectURL(new Blob([markup], {
                type: 'image/svg+xml',
            })),
            toImage: () => svgMarkupToImageData(markup, width, height),
        };
    }

    /** Creates a new {@link SVGPath} and adds it to the virtual DOM tree. */
    public createPath(id?: string): SVGPath {
        const path = new SVGPath(id);
        this._addToVTree(path);

        return path;
    }

    /** Creates a new {@link SVGText} element from the given options, wiring up text-on-a-path when path data is supplied. */
    public createText(options: TextOptions): ContextText {
        const text = new SVGText(options);
        const parent = this._currentParentVNode;

        const textNode: SVGVNode = {
            id: text.id,
            tag: text.definition.tag,
            element: text,
            children: [],
        };

        if (options.pathData) {
            const cacheKey = text.id;
            let cached = this._textPathCache.get(cacheKey);

            if (!cached) {
                const pathId = `textpath-${stringUniqueId()}`;
                const pathEl = createSVGElement('path');
                pathEl.setAttribute('id', pathId);
                this._defs.appendChild(pathEl);
                cached = {
                    pathId,
                    element: pathEl,
                };
                this._textPathCache.set(cacheKey, cached);
            }

            cached.element.setAttribute('d', options.pathData);

            const textPathEl = new SVGTextPath(text.id, cached.pathId, options.content, options.startOffset);

            textNode.children.push({
                id: textPathEl.id,
                tag: textPathEl.definition.tag,
                element: textPathEl,
                children: [],
            });
        } else {
            const cacheKey = text.id;
            const cached = this._textPathCache.get(cacheKey);

            if (cached) {
                this._defs.removeChild(cached.element);
                this._textPathCache.delete(cacheKey);
            }
        }

        parent.children.push(textNode);

        return text;
    }

    /** Draws an image onto the SVG surface at the given position and optional size. */
    public drawImage(image: CanvasImageSource, x: number, y: number, width?: number, height?: number): void {
        const [sourceWidth, sourceHeight] = getImageSourceSize(image);
        const imgWidth = width ?? sourceWidth;
        const imgHeight = height ?? sourceHeight;
        const renderElement = this.currentRenderElement;
        const id = renderElement?.id ?? `image-${stringUniqueId()}`;
        const href = canvasImageSourceToDataURL(image, imgWidth, imgHeight);
        const svgImage = new SVGImage(id, href, x, y, imgWidth, imgHeight);

        this._setElementStyles(svgImage, {
            opacity: this.currentState.opacity.toString(),
        });

        this._addToVTree(svgImage);
    }

    /**
     * Opens a group boundary as a nested `<g>` element: descends the reconciliation pointer
     * into a `<g>` keyed by the group's id and stamps the group's own transform onto it, so
     * descendants nest under the `<g>` and inherit the group transform via SVG's native
     * cascade. Resets the accumulated transform afterwards so leaves carry only their own
     * transform (avoiding a double application of the group transform).
     */
    public pushGroup(group: RiplElement): void {
        const groupElement: SVGContextElement = {
            id: group.id,
            definition: {
                tag: 'g',
                styles: {},
                attributes: {},
            },
        };

        const groupVNode: SVGVNode = {
            id: group.id,
            tag: 'g',
            element: groupElement,
            children: [],
        };

        this._currentParentVNode.children.push(groupVNode);
        this._vnodeStack.push(this._currentParentVNode);
        this._currentParentVNode = groupVNode;

        super.pushGroup(group);

        const transform = this._currentTransforms.join(' ');

        if (transform) {
            groupElement.definition.attributes.transform = transform;
        }

        this._currentTransforms = [];
    }

    /** Closes the most recently opened group boundary, restoring state and ascending the `<g>` pointer. */
    public popGroup(): void {
        super.popGroup();
        this._currentParentVNode = this._vnodeStack.pop() ?? this._vtree;
    }

    /** Saves the current drawing state, transform, and clip onto their stacks. */
    public save(): void {
        this._transformStack.push([...this._currentTransforms]);
        this._clipStack.push(this._currentClipId);
        super.save();
    }

    /** Restores the most recently saved drawing state, transform, and clip from their stacks. */
    public restore(): void {
        this._currentTransforms = this._transformStack.pop() || [];
        this._currentClipId = this._clipStack.pop();
        super.restore();
    }

    /** Applies a rotation transformation, in radians. */
    public rotate(angle: number): void {
        this._currentTransforms.push(`rotate(${radiansToDegrees(angle)})`);
    }

    /** Applies a scale transformation. */
    public scale(x: number, y: number): void {
        this._currentTransforms.push(`scale(${x},${y})`);
    }

    /** Applies a translation transformation. */
    public translate(x: number, y: number): void {
        this._currentTransforms.push(`translate(${x},${y})`);
    }

    /** Replaces the current transformation with the given matrix values. */
    // eslint-disable-next-line id-length
    public setTransform(a: number, b: number, c: number, d: number, e: number, f: number): void {
        this._currentTransforms = [`matrix(${a},${b},${c},${d},${e},${f})`];
    }

    /** Multiplies the current transformation by the given matrix values. */
    // eslint-disable-next-line id-length
    public transform(a: number, b: number, c: number, d: number, e: number, f: number): void {
        this._currentTransforms.push(`matrix(${a},${b},${c},${d},${e},${f})`);
    }

    /** Clips subsequent drawing operations to the given path. */
    public applyClip(path: SVGPath, fillRule?: FillRule): void {
        const cacheKey = path.id;
        let cached = this._clipCache.get(cacheKey);

        if (!cached) {
            const clipId = `clip-${stringUniqueId()}`;
            const clipPathEl = createSVGElement('clipPath');
            clipPathEl.setAttribute('id', clipId);

            const useEl = createSVGElement('path');
            clipPathEl.appendChild(useEl);
            this._defs.appendChild(clipPathEl);

            cached = {
                clipId,
                element: useEl,
            };
            this._clipCache.set(cacheKey, cached);
        }

        cached.element.setAttribute('d', path.definition.attributes.d);

        if (this._currentTransforms.length > 0) {
            cached.element.setAttribute('transform', this._currentTransforms.join(' '));
        } else {
            cached.element.removeAttribute('transform');
        }

        if (fillRule) {
            cached.element.setAttribute('clip-rule', fillRule);
        }

        this._removeFromVTree(path.id);
        this._currentClipId = cached.clipId;
    }

    /** Fills the given element using the current fill style, resolving gradients into `<defs>`. */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public applyFill(element: SVGContextElement, fillRule?: FillRule): void {
        this._setElementStyles(element, {
            fill: this._resolveGradientStyle(this.currentState.fill, `${element.id}:fill`),
        });
    }

    /** Strokes the given element using the current stroke style and line properties. */
    public applyStroke(element: SVGContextElement): void {
        this._setElementStyles(element, {
            stroke: this._resolveGradientStyle(this.currentState.stroke, `${element.id}:stroke`),
            strokeLinecap: this.currentState.lineCap,
            strokeDasharray: this.currentState.lineDash.join(' '),
            strokeDashoffset: this.currentState.lineDashOffset.toString(),
            strokeLinejoin: this.currentState.lineJoin,
            strokeWidth: this.currentState.lineWidth.toString(),
            strokeMiterlimit: this.currentState.miterLimit.toString(),
        });
    }

    /** Measures text dimensions using the context's current font or an optional override. */
    public measureText(text: string, font?: string): TextMetrics {
        return measureText(text, {
            font: font ?? this.currentState.font,
        });
    }

    /** Tests whether a point lies inside the filled region of a path. */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public isPointInPath(path: SVGPath, x: number, y: number, fillRule?: FillRule): boolean {
        return this._isPointIn('fill', path, x, y);
    }

    /** Tests whether a point lies on the stroked outline of a path. */
    public isPointInStroke(path: SVGPath, x: number, y: number): boolean {
        return this._isPointIn('stroke', path, x, y);
    }

}

/**
 * Creates an SVG rendering context (a concrete `Context`) attached to the given DOM target.
 *
 * @param target - A DOM element or CSS selector identifying the element to mount the SVG into.
 * @param options - Optional context configuration such as interactivity and metadata.
 * @returns The constructed {@link SVGContext}.
 * @example
 * const context = createContext(target);
 */
export function createContext(target: string | HTMLElement, options?: ContextOptions): SVGContext {
    return new SVGContext(target, options);
}
