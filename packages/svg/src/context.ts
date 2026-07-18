import {
    createSVGClipPathElement,
    createSVGGradientElement,
    createSVGShadowFilterElement,
    createSVGTextPathDefElement,
    isSupportedSVGGradient,
    resolveConicGradientFallback,
    sweepDefsCache,
    updateSVGGradientElement,
} from './definitions';

import type {
    ClipCacheEntry,
    GradientCacheEntry,
    ShadowCacheEntry,
    TextPathCacheEntry,
} from './definitions';

import {
    updateSVGElement,
} from './diff';

import {
    SVGImage,
    SVGPath,
    SVGText,
    SVGTextPath,
} from './elements';

import {
    canvasImageSourceToDataURL,
    createSVGElement,
    getImageSourceSize,
    isTransparentColor,
    mapSVGStyles,
    normaliseGradientColor,
    svgMarkupToImageData,
} from './helpers';

import type {
    Styles,
    SVGContextElement,
} from './types';

import {
    createFrameBuffer,
    isGradientString,
    measureText,
    parseGradient,
    radiansToDegrees,
} from '@ripl/core';

import type {
    ContextExport,
    ContextFactory,
    ContextOptions,
    ContextText,
    FillRule,
    Element as RiplElement,
    TextOptions,
} from '@ripl/core';

import {
    DOMContext,
    reconcileNode,
} from '@ripl/dom';

import type {
    ReconcilerOptions,
    VNode,
} from '@ripl/dom';

import {
    stringUniqueId,
} from '@ripl/utilities';

import type {
    AnyFunction,
} from '@ripl/utilities';

type SVGVNode = VNode<SVGContextElement>;

/** SVG rendering context implementation, mapping the unified API to SVG DOM elements via virtual-DOM reconciliation. */
export class SVGContext extends DOMContext<SVGSVGElement> {

    private _vtree: SVGVNode;
    private _domCache: Map<string, Element>;
    private _reconcilerOptions: ReconcilerOptions<SVGContextElement>;
    private _requestFrame: (callback: AnyFunction) => void;
    private _defs: SVGDefsElement;
    private _gradientCache: Map<string, GradientCacheEntry>;
    private _textPathCache: Map<string, TextPathCacheEntry>;
    private _transformStack: string[][];
    private _currentTransforms: string[];
    private _clipCache: Map<string, ClipCacheEntry>;
    private _shadowCache: Map<string, ShadowCacheEntry>;
    private _usedDefs: Set<string>;
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
        this._shadowCache = new Map();
        this._usedDefs = new Set();
        this._clipStack = [];
        this._currentClipId = undefined;
        this._defs = createSVGElement('defs');
        this.element.appendChild(this._defs);
        this._requestFrame = createFrameBuffer();

        this.init();
    }

    private _resolveGradientStyle(value: string, cacheKey: string): string {
        if (!isGradientString(value)) {
            return value;
        }

        const gradient = parseGradient(value);

        if (!gradient) {
            return value;
        }

        if (!isSupportedSVGGradient(gradient)) {
            // SVG has no native conic gradient primitive, so conic gradients degrade to a
            // solid paint using the color stop nearest the middle of the gradient rather
            // than leaking the raw CSS gradient string through as an invalid paint value.
            return resolveConicGradientFallback(gradient);
        }

        this._usedDefs.add(`gradient:${cacheKey}`);

        const cached = this._gradientCache.get(cacheKey);

        if (cached) {
            updateSVGGradientElement(cached.element, gradient);
            return `url(#${cached.gradientId})`;
        }

        const gradientId = `gradient-${stringUniqueId()}`;
        const gradientEl = createSVGGradientElement(gradient, gradientId);

        if (!gradientEl) {
            return value;
        }

        this._defs.appendChild(gradientEl);
        this._gradientCache.set(cacheKey, {
            gradientId,
            element: gradientEl,
        });

        return `url(#${gradientId})`;
    }

    private _resolveShadowFilter(element: SVGContextElement): string | undefined {
        const {
            shadowBlur,
            shadowColor,
            shadowOffsetX,
            shadowOffsetY,
        } = this.currentState;

        if (shadowBlur <= 0 && shadowOffsetX === 0 && shadowOffsetY === 0) {
            return;
        }

        if (isTransparentColor(shadowColor)) {
            return;
        }

        const cacheKey = element.id;

        this._usedDefs.add(`shadow:${cacheKey}`);

        let cached = this._shadowCache.get(cacheKey);

        if (!cached) {
            cached = createSVGShadowFilterElement(`shadow-${stringUniqueId()}`);
            this._defs.appendChild(cached.filterElement);
            this._shadowCache.set(cacheKey, cached);
        }

        cached.shadowElement.setAttribute('dx', shadowOffsetX.toString());
        cached.shadowElement.setAttribute('dy', shadowOffsetY.toString());
        // stdDeviation of blur/2 closely matches canvas shadow rendering.
        cached.shadowElement.setAttribute('stdDeviation', (shadowBlur / 2).toString());
        cached.shadowElement.setAttribute('flood-color', normaliseGradientColor(shadowColor));

        return `url(#${cached.filterId})`;
    }

    private _resolveElementFilter(element: SVGContextElement): string | undefined {
        const cssFilter = this.currentState.filter;
        const shadowFilter = this._resolveShadowFilter(element);
        const parts: string[] = [];

        if (shadowFilter) {
            parts.push(shadowFilter);
        }

        if (cssFilter && cssFilter !== 'none') {
            parts.push(cssFilter);
        }

        if (parts.length > 0) {
            return parts.join(' ');
        }
    }

    private _sweepDefs(): void {
        sweepDefsCache(this._gradientCache, 'gradient', this._usedDefs, entry => entry.element);
        sweepDefsCache(this._clipCache, 'clip', this._usedDefs, entry => entry.clipPathElement);
        sweepDefsCache(this._textPathCache, 'textpath', this._usedDefs, entry => entry.element);
        sweepDefsCache(this._shadowCache, 'shadow', this._usedDefs, entry => entry.filterElement);
    }

    protected rescale(width: number, height: number) {
        this.element.setAttribute('viewBox', `0 0 ${width} ${height}`);
        super.rescale(width, height);
    }

    private _setElementStyles(element: SVGContextElement, styles: Partial<Styles>) {
        Object.assign(element.definition.styles, mapSVGStyles({
            direction: this.currentState.direction,
            font: this.currentState.font,
            fontKerning: this.currentState.fontKerning,
            textAnchor: this.currentState.textAlign,
            alignmentBaseline: this.currentState.textBaseline,
            dominantBaseline: this.currentState.textBaseline,
            opacity: this.currentState.opacity.toString(),
            zIndex: (this.currentState.zIndex || '').toString(),
            ...styles,
        }));

        // Filter, transform, and clip-path are stamped onto the definition only when they carry
        // a value; omitted members are removed from the live DOM node by the write-through diff
        // in updateSVGElement, so no stale attribute survives a state change between frames.
        const filter = this._resolveElementFilter(element);
        const transformStr = this._currentTransforms.join(' ');

        if (filter) {
            element.definition.attributes.filter = filter;
        }

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

    /** Signals the start of a render pass; resets the virtual DOM tree, group-nesting pointer, and `<defs>` usage tracking at the outermost depth. */
    public markRenderStart(): void {
        if (this.renderDepth === 0) {
            this._vtree = {
                id: '__root__',
                tag: 'svg',
                children: [],
            };
            this._currentParentVNode = this._vtree;
            this._vnodeStack = [];
            this._usedDefs.clear();
        }

        super.markRenderStart();
    }

    /** Signals the end of a render pass, sweeping `<defs>` entries unused during the pass and reconciling the virtual DOM tree to the SVG surface at the outermost depth. */
    public markRenderEnd(): void {
        super.markRenderEnd();

        if (this.renderDepth !== 0) {
            return;
        }

        this._sweepDefs();

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

            this._usedDefs.add(`textpath:${cacheKey}`);

            let cached = this._textPathCache.get(cacheKey);

            if (!cached) {
                cached = createSVGTextPathDefElement(`textpath-${stringUniqueId()}`);
                this._defs.appendChild(cached.element);
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

        // Opacity composites the subtree as a unit: stamp it on the <g> and reset the inheritable
        // state so descendants don't also stamp it (which would double-apply). Paint (fill, stroke,
        // …) stays in the state so leaves inherit and stamp their resolved value.
        const opacity = this.currentState.opacity;

        if (opacity !== 1) {
            groupElement.definition.styles.opacity = opacity.toString();
        }

        this.currentState.opacity = 1;

        // Children carry only their own transform; the native <g> supplies the group transform once.
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

    /** Clips subsequent drawing operations to the given path. The backing `<clipPath>` def is swept once no render pass uses it. */
    public applyClip(path: SVGPath, fillRule?: FillRule): void {
        const cacheKey = path.id;

        this._usedDefs.add(`clip:${cacheKey}`);

        let cached = this._clipCache.get(cacheKey);

        if (!cached) {
            cached = createSVGClipPathElement(`clip-${stringUniqueId()}`);
            this._defs.appendChild(cached.clipPathElement);
            this._clipCache.set(cacheKey, cached);
        }

        cached.pathElement.setAttribute('d', path.definition.attributes.d);

        if (this._currentTransforms.length > 0) {
            cached.pathElement.setAttribute('transform', this._currentTransforms.join(' '));
        } else {
            cached.pathElement.removeAttribute('transform');
        }

        if (fillRule) {
            cached.pathElement.setAttribute('clip-rule', fillRule);
        }

        this._removeFromVTree(path.id);
        this._currentClipId = cached.clipId;
    }

    /**
     * Fills the given element using the current fill style, resolving linear and radial
     * gradients into `<defs>`. Conic gradients have no SVG equivalent and degrade to a solid
     * fill using the color stop nearest the middle of the gradient.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public applyFill(element: SVGContextElement, fillRule?: FillRule): void {
        this._setElementStyles(element, {
            fill: this._resolveGradientStyle(this.currentState.fill, `${element.id}:fill`),
        });
    }

    /**
     * Strokes the given element using the current stroke style and line properties, resolving
     * linear and radial gradients into `<defs>`. Conic gradients have no SVG equivalent and
     * degrade to a solid stroke using the color stop nearest the middle of the gradient.
     */
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

// Compile-time conformance: the SVG backend factory matches the shared `ContextFactory` contract.
createContext satisfies ContextFactory<string | HTMLElement, ContextOptions, SVGContext>;
