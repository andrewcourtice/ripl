import {
    BorderRadius,
    Context,
    ContextElement,
    ContextOptions,
    ContextPath,
    ContextText,
    createFrameBuffer,
    FillRule,
    getThetaPoint,
    isGradientString,
    measureText,
    normaliseBorderRadius,
    parseColor,
    parseGradient,
    radiansToDegrees,
    serialiseRGBA,
    TextAlignment,
    TextBaseline,
    TextOptions,
} from '@ripl/core';

import {
    AnyFunction,
    arrayForEach,
    GetMutableKeys,
    objectForEach,
    objectMap,
    stringUniqueId,
} from '@ripl/utilities';

import {
    ensureGroupPath,
    getAncestorGroupIds,
    reconcileNode,
    ReconcilerOptions,
    VNode,
} from '@ripl/vdom';

import type {
    Gradient,
    GradientColorStop,
} from '@ripl/core';

type SVGVNode = VNode<SVGContextElement>;
type GradientElementFactory = (gradient: Gradient) => SVGElement;
type GradientElementUpdater = (element: SVGElement, gradient: Gradient) => void;

type Styles = {
    [TKey in GetMutableKeys<CSSStyleDeclaration>]: CSSStyleDeclaration[TKey];
};

export interface SVGContextElementDefinition {
    tag: keyof SVGElementTagNameMap;
    styles: Partial<Styles>;
    attributes: Record<string, string>;
    textContent?: string;
}

export interface SVGContextElement extends ContextElement {
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

    arrayForEach(stops, (stop) => {
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

export class SVGPath extends ContextPath implements SVGContextElement {

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

    private appendElementData(data: string) {
        this.definition.attributes.d = `${this.definition.attributes.d} ${data}`.trim();
    }

    arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, counterclockwise?: boolean): void {
        const [x1, y1] = getThetaPoint(startAngle, radius, x, y);
        const [x2, y2] = getThetaPoint(endAngle, radius, x, y);
        const largeArcFlag = +(Math.abs(endAngle - startAngle) > Math.PI);
        const clockwiseFlag = +!counterclockwise;

        this.moveTo(x1, y1);
        this.appendElementData(`A ${radius} ${radius} 0 ${largeArcFlag} ${clockwiseFlag} ${x2},${y2}`);
    }

    arcTo(x1: number, y1: number, x2: number, y2: number, radius: number): void {
        this.moveTo(x1, y1);
        this.appendElementData(`A ${radius} ${radius} 0 0 1 ${x2},${y2}`);
    }

    circle(x: number, y: number, radius: number): void {
        this.moveTo(x + radius, y);
        this.appendElementData(`a ${radius} ${radius} 0 1 0 ${radius * -2},0`);
        this.appendElementData(`a ${radius} ${radius} 0 1 0 ${radius * 2},0`);
    }

    bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): void {
        this.appendElementData(`C ${cp1x},${cp1y} ${cp2x},${cp2y} ${x},${y}`);
    }

    closePath(): void {
        this.appendElementData('Z');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ellipse(x: number, y: number, radiusX: number, radiusY: number, rotation: number, startAngle: number, endAngle: number, counterclockwise?: boolean): void {
        this.moveTo(x, y);
        this.appendElementData(`A ${radiusX} ${radiusY} ${rotation}`);
    }

    lineTo(x: number, y: number): void {
        this.appendElementData(`L ${x},${y}`);
    }

    moveTo(x: number, y: number): void {
        this.appendElementData(`M ${x},${y}`);
    }

    quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void {
        this.appendElementData(`Q ${cpx},${cpy} ${x},${y}`);
    }

    rect(x: number, y: number, width: number, height: number): void {
        this.moveTo(x, y);
        this.lineTo(x + width, y);
        this.lineTo(x + width, y + height);
        this.lineTo(x, y + height);
        this.lineTo(x, y);
    }

    roundRect(x: number, y: number, width: number, height: number, radii?: BorderRadius): void {
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
        this.appendElementData(`A ${borderTopRight} ${borderTopRight} 0 0 1 ${x + width},${y + borderTopRight}`);
        this.lineTo(x + width, y + height - borderBottomRight);
        this.appendElementData(`A ${borderBottomRight} ${borderBottomRight} 0 0 1 ${x + width - borderBottomRight},${y + height}`);
        this.lineTo(x + borderBottomLeft, y + height);
        this.appendElementData(`A ${borderBottomLeft} ${borderBottomLeft} 0 0 1 ${x},${y + height - borderBottomLeft}`);
        this.lineTo(x, y + borderTopLeft);
        this.appendElementData(`A ${borderTopLeft} ${borderTopLeft} 0 0 1 ${x + borderTopLeft},${y}`);
        this.closePath();
    }

}

export class SVGText extends ContextText implements SVGContextElement {

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

export class SVGImage implements SVGContextElement {

    public readonly id: string;
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

export class SVGTextPath implements SVGContextElement {

    public readonly id: string;
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

export class SVGContext extends Context<SVGSVGElement> {

    private vtree: SVGVNode;
    private domCache: Map<string, Element>;
    private reconcilerOptions: ReconcilerOptions<SVGContextElement>;
    private requestFrame: (callback: AnyFunction) => void;
    private defs: SVGDefsElement;
    private gradientCache: Map<string, { gradientId: string;
        element: SVGElement; }>;
    private textPathCache: Map<string, { pathId: string;
        element: SVGElement; }>;
    private transformStack: string[][];
    private currentTransforms: string[];
    private clipCache: Map<string, { clipId: string; element: SVGElement }>;
    private clipStack: (string | undefined)[];
    private currentClipId: string | undefined;

    constructor(target: string | HTMLElement, options?: ContextOptions) {
        const svg = createSVGElement('svg');

        svg.style.display = 'block';
        svg.style.width = '100%';
        svg.style.height = '100%';

        super('svg', target, svg, {
            buffer: true,
            ...options,
        });

        this.vtree = {
            id: '__root__',
            tag: 'svg',
            children: [],
        };

        this.reconcilerOptions = {
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

        this.domCache = new Map();
        this.gradientCache = new Map();
        this.textPathCache = new Map();
        this.transformStack = [];
        this.currentTransforms = [];
        this.clipCache = new Map();
        this.clipStack = [];
        this.currentClipId = undefined;
        this.defs = createSVGElement('defs');
        this.element.appendChild(this.defs);
        this.requestFrame = createFrameBuffer();

        this.init();
    }

    private removeGradientDef(cacheKey: string): void {
        const existing = this.gradientCache.get(cacheKey);

        if (!existing) {
            return;
        }

        this.defs.removeChild(existing.element);
        this.gradientCache.delete(cacheKey);
    }

    private resolveGradientStyle(value: string, cacheKey: string): string {
        if (!isGradientString(value)) {
            this.removeGradientDef(cacheKey);
            return value;
        }

        const gradient = parseGradient(value);

        if (!gradient) {
            return value;
        }

        const cached = this.gradientCache.get(cacheKey);

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

        this.defs.appendChild(gradientEl);
        this.gradientCache.set(cacheKey, {
            gradientId,
            element: gradientEl,
        });

        return `url(#${gradientId})`;
    }

    protected rescale(width: number, height: number) {
        this.element.setAttribute('viewBox', `0 0 ${width} ${height}`);
        super.rescale(width, height);
    }

    private setElementStyles(element: SVGContextElement, styles: Partial<Styles>) {
        Object.assign(element.definition.styles, mapSVGStyles({
            filter: this.currentState.filter,
            direction: this.currentState.direction,
            font: this.currentState.font,
            fontKerning: this.currentState.fontKerning,
            textAnchor: this.currentState.textAlign,
            alignmentBaseline: this.currentState.textBaseline,
            opacity: this.currentState.globalAlpha.toString(),
            zIndex: (this.currentState.zIndex || '').toString(),
            // shadowBlur,
            // shadowColor,
            // shadowOffsetX,
            // shadowOffsetY,
            //textBaseline,
            ...styles,
        }));

        const transformStr = this.currentTransforms.join(' ');

        if (transformStr) {
            element.definition.attributes.transform = transformStr;
        }

        if (this.currentClipId) {
            element.definition.attributes['clip-path'] = `url(#${this.currentClipId})`;
        }
    }

    private isPointIn(method: 'stroke' | 'fill', path: SVGPath, x: number, y: number) {
        const element = this.element.getElementById(path.id);
        const point = this.element.createSVGPoint();

        point.x = x;
        point.y = y;

        return element instanceof SVGGeometryElement && (method === 'stroke'
            ? element.isPointInStroke(point)
            : element.isPointInFill(point)
        );
    }

    private addToVTree(contextElement: SVGContextElement): void {
        const renderElement = this.currentRenderElement;
        const groupIds = renderElement ? getAncestorGroupIds(renderElement) : [];
        const parent = ensureGroupPath(this.vtree, groupIds);

        parent.children.push({
            id: contextElement.id,
            tag: contextElement.definition.tag,
            element: contextElement,
            children: [],
        });
    }

    private removeFromVTree(id: string): void {
        const renderElement = this.currentRenderElement;
        const groupIds = renderElement ? getAncestorGroupIds(renderElement) : [];
        const parent = ensureGroupPath(this.vtree, groupIds);
        const index = parent.children.findIndex(c => c.id === id);

        if (index !== -1) {
            parent.children.splice(index, 1);
        }
    }

    private render() {
        reconcileNode(this.element, this.vtree, this.domCache, this.reconcilerOptions);
    }

    markRenderStart(): void {
        if (this.renderDepth === 0) {
            this.vtree = {
                id: '__root__',
                tag: 'svg',
                children: [],
            };
        }

        super.markRenderStart();
    }

    markRenderEnd(): void {
        super.markRenderEnd();

        if (this.renderDepth !== 0) {
            return;
        }

        if (this.buffer) {
            this.requestFrame(() => this.render());
        } else {
            this.render();
        }
    }

    createPath(id?: string): SVGPath {
        const path = new SVGPath(id);
        this.addToVTree(path);

        return path;
    }

    createText(options: TextOptions): ContextText {
        const text = new SVGText(options);
        const renderElement = this.currentRenderElement;
        const groupIds = renderElement ? getAncestorGroupIds(renderElement) : [];
        const parent = ensureGroupPath(this.vtree, groupIds);

        const textNode: SVGVNode = {
            id: text.id,
            tag: text.definition.tag,
            element: text,
            children: [],
        };

        if (options.pathData) {
            const cacheKey = text.id;
            let cached = this.textPathCache.get(cacheKey);

            if (!cached) {
                const pathId = `textpath-${stringUniqueId()}`;
                const pathEl = createSVGElement('path');
                pathEl.setAttribute('id', pathId);
                this.defs.appendChild(pathEl);
                cached = {
                    pathId,
                    element: pathEl,
                };
                this.textPathCache.set(cacheKey, cached);
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
            const cached = this.textPathCache.get(cacheKey);

            if (cached) {
                this.defs.removeChild(cached.element);
                this.textPathCache.delete(cacheKey);
            }
        }

        parent.children.push(textNode);

        return text;
    }

    drawImage(image: CanvasImageSource, x: number, y: number, width?: number, height?: number): void {
        const [sourceWidth, sourceHeight] = getImageSourceSize(image);
        const imgWidth = width ?? sourceWidth;
        const imgHeight = height ?? sourceHeight;
        const renderElement = this.currentRenderElement;
        const id = renderElement?.id ?? `image-${stringUniqueId()}`;
        const href = canvasImageSourceToDataURL(image, imgWidth, imgHeight);
        const svgImage = new SVGImage(id, href, x, y, imgWidth, imgHeight);

        this.setElementStyles(svgImage, {
            opacity: this.currentState.globalAlpha.toString(),
        });

        this.addToVTree(svgImage);
    }

    save(): void {
        this.transformStack.push([...this.currentTransforms]);
        this.clipStack.push(this.currentClipId);
        super.save();
    }

    restore(): void {
        this.currentTransforms = this.transformStack.pop() || [];
        this.currentClipId = this.clipStack.pop();
        super.restore();
    }

    rotate(angle: number): void {
        this.currentTransforms.push(`rotate(${radiansToDegrees(angle)})`);
    }

    scale(x: number, y: number): void {
        this.currentTransforms.push(`scale(${x},${y})`);
    }

    translate(x: number, y: number): void {
        this.currentTransforms.push(`translate(${x},${y})`);
    }

    // eslint-disable-next-line id-length
    setTransform(a: number, b: number, c: number, d: number, e: number, f: number): void {
        this.currentTransforms = [`matrix(${a},${b},${c},${d},${e},${f})`];
    }

    // eslint-disable-next-line id-length
    transform(a: number, b: number, c: number, d: number, e: number, f: number): void {
        this.currentTransforms.push(`matrix(${a},${b},${c},${d},${e},${f})`);
    }

    clip(path: SVGPath, fillRule?: FillRule): void {
        const cacheKey = path.id;
        let cached = this.clipCache.get(cacheKey);

        if (!cached) {
            const clipId = `clip-${stringUniqueId()}`;
            const clipPathEl = createSVGElement('clipPath');
            clipPathEl.setAttribute('id', clipId);

            const useEl = createSVGElement('path');
            clipPathEl.appendChild(useEl);
            this.defs.appendChild(clipPathEl);

            cached = { clipId, element: useEl };
            this.clipCache.set(cacheKey, cached);
        }

        cached.element.setAttribute('d', path.definition.attributes.d);

        if (this.currentTransforms.length > 0) {
            cached.element.setAttribute('transform', this.currentTransforms.join(' '));
        } else {
            cached.element.removeAttribute('transform');
        }

        if (fillRule) {
            cached.element.setAttribute('clip-rule', fillRule);
        }

        this.removeFromVTree(path.id);
        this.currentClipId = cached.clipId;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    fill(element: SVGContextElement, fillRule?: FillRule): void {
        this.setElementStyles(element, {
            fill: this.resolveGradientStyle(this.currentState.fillStyle, `${element.id}:fill`),
        });
    }

    stroke(element: SVGContextElement): void {
        this.setElementStyles(element, {
            stroke: this.resolveGradientStyle(this.currentState.strokeStyle, `${element.id}:stroke`),
            strokeLinecap: this.currentState.lineCap,
            strokeDasharray: this.currentState.lineDash.join(' '),
            strokeDashoffset: this.currentState.lineDashOffset.toString(),
            strokeLinejoin: this.currentState.lineJoin,
            strokeWidth: this.currentState.lineWidth.toString(),
            strokeMiterlimit: this.currentState.miterLimit.toString(),
        });
    }

    measureText(text: string, font?: string): TextMetrics {
        return measureText(text, {
            font: font ?? this.currentState.font,
        });
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    isPointInPath(path: SVGPath, x: number, y: number, fillRule?: FillRule): boolean {
        return this.isPointIn('fill', path, x, y);
    }

    isPointInStroke(path: SVGPath, x: number, y: number): boolean {
        return this.isPointIn('stroke', path, x, y);
    }

}

export function createContext(target: string | HTMLElement, options?: ContextOptions): Context {
    return new SVGContext(target, options);
}
