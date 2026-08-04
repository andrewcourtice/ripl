import {
    SVG_BLEND_MODES,
} from './constants';

import {
    createSVGClipPathElement,
    createSVGGradientElement,
    createSVGPatternElement,
    createSVGShadowFilterElement,
    createSVGTextPathDefElement,
    isSupportedSVGGradient,
    resolveConicGradientFallback,
    sweepDefsCache,
    updateSVGGradientElement,
    updateSVGPatternElement,
} from './definitions';

import type {
    ClipCacheEntry,
    GradientCacheEntry,
    PatternCacheEntry,
    ShadowCacheEntry,
    TextPathCacheEntry,
} from './definitions';

import {
    updateSVGElement,
} from './diff';

import {
    SVGImage,
} from './image';

import {
    SVGPath,
} from './path';

import {
    SVGText,
    SVGTextPath,
} from './text';

import {
    canvasImageSourceToDataURL,
    createSVGElement,
    getImageSourceSize,
    mapSVGStyles,
    normalizeGradientColor,
    svgMarkupToImageData,
} from './utilities';

import type {
    Styles,
    SVGContextElement,
} from './types';

import {
    getGradientBounds,
    isGradientString,
    isPatternString,
    isTransparentColor,
    measureText,
    parseGradientCached,
    parsePatternCached,
    radiansToDegrees,
} from '@ripl/core';

import type {
    ContextExport,
    ContextFactory,
    ContextOptions,
    ContextText,
    FillRule,
    GradientBounds,
    RenderElement,
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
    typeIsFunction,
} from '@ripl/utilities';

type SVGVNode = VNode<SVGContextElement>;

/** SVG rendering context implementation, mapping the unified API to SVG DOM elements via virtual-DOM reconciliation. */
export class SVGContext extends DOMContext<SVGSVGElement> {

    private _vtree: SVGVNode;
    private _domCache: Map<string, Element>;
    private _reconcilerOptions: ReconcilerOptions<SVGContextElement>;
    private _defs: SVGDefsElement;
    private _gradientCache: Map<string, GradientCacheEntry>;
    private _patternCache: Map<string, PatternCacheEntry>;
    private _textPathCache: Map<string, TextPathCacheEntry>;
    private _transformStack: string[][];
    private _currentTransforms: string[];
    private _clipCache: Map<string, ClipCacheEntry>;
    private _shadowCache: Map<string, ShadowCacheEntry>;
    private _usedDefs: Set<string>;
    private _clipScopeStack: SVGVNode[];
    private _currentParentVNode: SVGVNode;
    private _vnodeStack: SVGVNode[];
    private _inverseCTMCache: Map<Element, DOMMatrix | null>;
    private _gradientBounds?: {
        element: RenderElement;
        bounds: GradientBounds;
    };

    constructor(target: string | HTMLElement, options?: ContextOptions) {
        const svg = createSVGElement('svg');

        svg.style.display = 'block';
        svg.style.width = '100%';
        svg.style.height = '100%';

        // Unlike a canvas, SVG `<text>` is selectable: a drag to pan or brush would sweep a selection over labels.
        svg.style.userSelect = 'none';

        // Canvas composites against its own pixels only; without this a `mix-blend-mode` leaf would blend with the page behind the surface.
        svg.style.setProperty('isolation', 'isolate');

        super('svg', target, svg, options);

        // `_isPointIn` maps the hit point through the live DOM's own CTM, so callers must not pre-map it.
        this.hitTestHonorsTransform = true;
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
        this._patternCache = new Map();
        this._textPathCache = new Map();
        this._transformStack = [];
        this._currentTransforms = [];
        this._clipCache = new Map();
        this._shadowCache = new Map();
        this._usedDefs = new Set();
        this._clipScopeStack = [];
        this._inverseCTMCache = new Map();
        this._defs = createSVGElement('defs');
        this.element.appendChild(this._defs);

        this.init();
    }

    private _resolvePatternStyle(value: string, cacheKey: string): string {
        const pattern = parsePatternCached(value);

        if (!pattern) {
            return value;
        }

        this._usedDefs.add(`pattern:${cacheKey}`);

        const cached = this._patternCache.get(cacheKey);

        if (cached) {
            updateSVGPatternElement(cached.element, pattern);
            return `url(#${cached.patternId})`;
        }

        const patternId = `pattern-${stringUniqueId()}`;
        const patternEl = createSVGPatternElement(pattern, patternId);

        this._defs.appendChild(patternEl);
        this._patternCache.set(cacheKey, {
            patternId,
            element: patternEl,
        });

        return `url(#${patternId})`;
    }

    /**
     * The box a gradient on the current render element resolves against, memoized for the element's
     * paint so a fill and a stroke sharing it resolve one box — which for a group means one subtree
     * walk per frame rather than one per paint, since group boxes are never cached.
     */
    private _resolveGradientBounds(): GradientBounds {
        const element = this.currentRenderElement;
        const cached = this._gradientBounds;

        if (cached && cached.element === element) {
            return cached.bounds;
        }

        // The element's own box, not the path node's, so a multi-path element ramps once across all of them.
        const bounds = getGradientBounds(element?.getBoundingBox?.(true), this.width, this.height);

        this._gradientBounds = element && {
            element,
            bounds,
        };

        return bounds;
    }

    private _resolveGradientStyle(value: string, cacheKey: string): string {
        if (isPatternString(value)) {
            return this._resolvePatternStyle(value, cacheKey);
        }

        if (!isGradientString(value)) {
            return value;
        }

        const gradient = parseGradientCached(value);

        if (!gradient) {
            return value;
        }

        if (!isSupportedSVGGradient(gradient)) {
            // SVG has no conic gradient primitive, so degrade to the color stop nearest the gradient's middle.
            return resolveConicGradientFallback(gradient);
        }

        this._usedDefs.add(`gradient:${cacheKey}`);

        const bounds = this._resolveGradientBounds();
        const cached = this._gradientCache.get(cacheKey);

        if (cached) {
            updateSVGGradientElement(cached.element, gradient, bounds);
            return `url(#${cached.gradientId})`;
        }

        const gradientId = `gradient-${stringUniqueId()}`;
        const gradientEl = createSVGGradientElement(gradient, gradientId, bounds);

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
        cached.shadowElement.setAttribute('flood-color', normalizeGradientColor(shadowColor));

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
        sweepDefsCache(this._patternCache, 'pattern', this._usedDefs, entry => entry.element);
    }

    // `width`/`height` are the exported document's only intrinsic size: the inline `100%` has no containing block once the markup stands alone.
    protected rescale(width: number, height: number) {
        this.element.setAttribute('viewBox', `0 0 ${width} ${height}`);
        this.element.setAttribute('width', width.toString());
        this.element.setAttribute('height', height.toString());
        super.rescale(width, height);
    }

    private _setElementStyles(element: SVGContextElement, styles: Partial<Styles>) {
        const blendMode = SVG_BLEND_MODES[this.currentState.globalCompositeOperation as string];

        Object.assign(element.definition.styles, mapSVGStyles({
            direction: this.currentState.direction,
            font: this.currentState.font,
            fontKerning: this.currentState.fontKerning,
            textAnchor: this.currentState.textAlign,
            dominantBaseline: this.currentState.textBaseline,
            opacity: this.currentState.opacity.toString(),
            zIndex: (this.currentState.zIndex || '').toString(),
            ...(blendMode ? { mixBlendMode: blendMode } : {}),
            ...styles,
        }));

        // Omitted attributes are removed from the live node by the write-through diff, so nothing goes stale.
        const filter = this._resolveElementFilter(element);
        const transformStr = this._currentTransforms.join(' ');

        if (filter) {
            element.definition.attributes.filter = filter;
        }

        if (transformStr) {
            element.definition.attributes.transform = transformStr;
        }
    }

    // The reconciler already holds every node it created, so prefer it over a document-scoped id lookup.
    private _resolveHitNode(id: string): Element | null {
        const cached = this._domCache.get(id);

        return cached && this.element.contains(cached)
            ? cached
            : this.element.getElementById(id);
    }

    // `getCTM` flushes layout, and a hit test runs against every rendered element on each pointer move.
    private _resolveInverseCTM(element: SVGGraphicsElement): DOMMatrix | null {
        if (this._inverseCTMCache.has(element)) {
            return this._inverseCTMCache.get(element) ?? null;
        }

        // A partial DOM declares neither `getCTM` nor a transform to map through, so the raw point stands.
        const ctm = typeIsFunction(element.getCTM) ? element.getCTM() : null;
        const inverse = ctm ? ctm.inverse() : null;

        this._inverseCTMCache.set(element, inverse);

        return inverse;
    }

    private _isPointIn(method: 'stroke' | 'fill', path: SVGPath, x: number, y: number) {
        const element = this._resolveHitNode(path.id);

        if (!(element instanceof SVGGeometryElement)) {
            return false;
        }

        const point = this.element.createSVGPoint();

        point.x = x;
        point.y = y;

        // SVG 2 reads this point in the element's own space, but a hit arrives in the root's.
        const inverse = this._resolveInverseCTM(element);
        const local = inverse ? point.matrixTransform(inverse) : point;

        return method === 'stroke'
            ? element.isPointInStroke(local)
            : element.isPointInFill(local);
    }

    private _addToVTree(contextElement: SVGContextElement): void {
        this._currentParentVNode.children.push({
            id: contextElement.id,
            tag: contextElement.definition.tag,
            element: contextElement,
            children: [],
        });
    }

    // A multi-path element (a segmented `Polyline`) mints run paths keyed `${id}:${index}`, which leak as stray nodes if only the primary is dropped.
    private _removeFromVTree(id: string): void {
        const prefix = `${id}:`;

        this._currentParentVNode.children = this._currentParentVNode.children.filter(child => child.id !== id && !child.id.startsWith(prefix));
    }

    private _openClipScope(pathId: string, clipId: string): void {
        const scopeElement: SVGContextElement = {
            id: `${pathId}:clip`,
            definition: {
                tag: 'g',
                styles: {},
                attributes: {
                    'clip-path': `url(#${clipId})`,
                },
            },
        };

        const scopeVNode: SVGVNode = {
            id: scopeElement.id,
            tag: 'g',
            element: scopeElement,
            children: [],
        };

        this._currentParentVNode.children.push(scopeVNode);
        this._currentParentVNode = scopeVNode;
    }

    private _render() {
        reconcileNode(this.element, this._vtree, this._domCache, this._reconcilerOptions);
    }

    // Sweeping after the reconcile, never before: a def removed while a live node still references it paints as a dangling `url(#…)`.
    private _commit() {
        this._render();
        this._sweepDefs();

        // A transform can change on any frame, so the inverses cannot outlive the DOM they were read from.
        this._inverseCTMCache.clear();
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

            // Boxes move between frames, so the memo must not outlive the pass that measured them.
            this._gradientBounds = undefined;
        }

        super.markRenderStart();
    }

    /** Signals the end of a render pass, reconciling the virtual DOM tree to the SVG surface and then sweeping the `<defs>` entries the pass left unused, at the outermost depth. */
    public markRenderEnd(): void {
        super.markRenderEnd();

        if (this.renderDepth !== 0) {
            return;
        }

        this._commit();
    }

    /**
     * Captures a snapshot of the SVG surface and returns format-specific exporters (see
     * {@link ContextExport}). Every object URL handed out by `toURL()` is tracked and revoked by
     * `release()`.
     */
    public export(): ContextExport {
        const markup = new XMLSerializer().serializeToString(this.element);
        const width = this.width;
        const height = this.height;
        const urls = new Set<string>();

        return {
            toString: () => markup,
            toURL: () => {
                const url = URL.createObjectURL(new Blob([markup], {
                    type: 'image/svg+xml',
                }));

                urls.add(url);

                return url;
            },
            toImage: () => svgMarkupToImageData(markup, width, height),
            release: () => {
                urls.forEach(url => URL.revokeObjectURL(url));
                urls.clear();
            },
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

    // Resolving at the boundary keys the def by the group and writes the `url(#…)` back, so every leaf inherits one ramp across the group's box instead of restarting it over its own.
    private _resolveGroupPaint(groupElement: SVGContextElement, groupId: string): void {
        const fill = this.currentState.fill;
        const stroke = this.currentState.stroke;

        const resolvedFill = fill && this._resolveGradientStyle(fill, `${groupId}:fill`);
        const resolvedStroke = stroke && this._resolveGradientStyle(stroke, `${groupId}:stroke`);

        if (resolvedFill && resolvedFill !== fill) {
            this.currentState.fill = resolvedFill;
            groupElement.definition.styles.fill = resolvedFill;
        }

        if (resolvedStroke && resolvedStroke !== stroke) {
            this.currentState.stroke = resolvedStroke;
            groupElement.definition.styles.stroke = resolvedStroke;
        }
    }

    /**
     * Opens a group boundary as a nested `<g>` element: descends the reconciliation pointer
     * into a `<g>` keyed by the group's id and stamps the group's own transform onto it, so
     * descendants nest under the `<g>` and inherit the group transform via SVG's native
     * cascade. Resets the accumulated transform afterwards so leaves carry only their own
     * transform (avoiding a double application of the group transform).
     *
     * A gradient or pattern the group carries is resolved **once here**, against the group's own
     * box, and stamped on the `<g>`; descendants inherit the resolved `url(#…)` rather than
     * re-resolving the paint against their own box, which is what makes the group ramp continuously
     * across its children and match what the canvas backend paints.
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

        this._resolveGroupPaint(groupElement, group.id);

        const transform = this._currentTransforms.join(' ');

        if (transform) {
            groupElement.definition.attributes.transform = transform;
        }

        // Opacity composites the subtree: stamp it on the `<g>` and clear it so descendants don't double-apply.
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

    /** Saves the current drawing state, transform, and clip scope onto their stacks. */
    public save(): void {
        this._transformStack.push([...this._currentTransforms]);
        this._clipScopeStack.push(this._currentParentVNode);
        super.save();
    }

    /** Restores the most recently saved drawing state, transform, and clip scope from their stacks. */
    public restore(): void {
        // The base `restore()` no-ops at depth 0, so popping unconditionally would discard the live transform and clip scope.
        if (this.saveDepth === 0) {
            return;
        }

        this._currentTransforms = this._transformStack.pop() || [];
        this._currentParentVNode = this._clipScopeStack.pop() ?? this._vtree;
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

    /**
     * Clips subsequent drawing operations to the given path by opening a `<g clip-path>` scope and
     * nesting them inside it, so the clip is expressed in the user space it was authored in rather
     * than the referencing leaf's (which every intervening `<g transform>` would displace). Nesting
     * the scopes is also what makes a second clip **intersect** the first, as `ctx.clip()` does,
     * instead of replacing it. The scope closes with the enclosing `restore()` or `popGroup()`, and
     * the backing `<clipPath>` def is swept once no render pass uses it.
     */
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
        } else {
            cached.pathElement.removeAttribute('clip-rule');
        }

        this._removeFromVTree(path.id);
        this._openClipScope(path.id, cached.clipId);
    }

    /**
     * Fills the given element using the current fill style, resolving linear and radial
     * gradients into `<defs>`. Conic gradients have no SVG equivalent and degrade to a solid
     * fill using the color stop nearest the middle of the gradient.
     *
     * @param element - The element to stamp the resolved fill onto.
     * @param fillRule - Winding rule the fill is evaluated with; emitted as `fill-rule`.
     */
    public applyFill(element: SVGContextElement, fillRule?: FillRule): void {
        this._setElementStyles(element, {
            fill: this._resolveGradientStyle(this.currentState.fill, `${element.id}:fill`),
            ...(fillRule ? { fillRule } : {}),
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

    /** Measures text dimensions using the context's current font, alignment, and baseline, or an optional font override. */
    public measureText(text: string, font?: string): TextMetrics {
        return measureText(text, {
            font: font ?? this.currentState.font,
            textAlign: this.currentState.textAlign,
            textBaseline: this.currentState.textBaseline,
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

    /** Resets the context to its initial state, dropping the accumulated transform, the open clip scopes, and the group nesting alongside the base drawing state. */
    public reset(): void {
        super.reset();

        this._currentTransforms = [];
        this._transformStack = [];
        this._clipScopeStack = [];
        this._vnodeStack = [];
        this._currentParentVNode = this._vtree;
    }

    /** Destroys the context, releasing the reconciler's node cache, every `<defs>` cache, and the virtual tree it retained. */
    public destroy(): void {
        super.destroy();

        this._defs.replaceChildren();
        this._domCache.clear();
        this._gradientCache.clear();
        this._patternCache.clear();
        this._textPathCache.clear();
        this._clipCache.clear();
        this._shadowCache.clear();
        this._usedDefs.clear();
        this._inverseCTMCache.clear();

        this._vtree = {
            id: '__root__',
            tag: 'svg',
            children: [],
        };

        this.reset();
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
