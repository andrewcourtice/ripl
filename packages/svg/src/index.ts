import {
    BorderRadius,
    Context,
    ContextElement,
    ContextOptions,
    ContextPath,
    ContextText,
    createFrameBuffer,
    FillRule,
    getRefContext,
    getThetaPoint,
    TextAlignment,
    TextBaseline,
    TextOptions,
} from '@ripl/core';

import {
    AnyFunction,
    GetMutableKeys,
    objectForEach,
    objectMap,
    typeIsNumber,
} from '@ripl/utilities';

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

function updateSVGElement(svgElement: SVGElement, { id, definition }: SVGContextElement) {
    const {
        styles,
        attributes,
        textContent,
    } = definition;

    svgElement.setAttribute('id', id);
    Object.assign(svgElement.style, styles);
    objectForEach(attributes, (key, value) => svgElement.setAttribute(key.toString(), value));

    if (textContent) {
        svgElement.textContent = textContent;
    }
}

function mapSVGStyles(styles: Partial<Styles>) {
    return objectMap(styles, (key, value) => {
        const mapped = SVG_STYLE_MAP[key];
        return mapped?.[value as string] ?? value;
    });
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

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    roundRect(x: number, y: number, width: number, height: number, radii?: BorderRadius): void {
        return this.rect(x, y, width, height);
        // const [
        //     borderTopLeft,
        //     borderTopRight,
        //     borderBottomRight,
        //     borderBottomLeft,
        // ] = normaliseBorderRadius(radii ?? 0);

        // this.moveTo(x + borderTopLeft, y);
        // this.lineTo(x - borderTopRight, y);
        // this.arcTo(x + width - borderTopRight, y, x + width, y + borderTopRight, borderTopRight);
        // this.lineTo(x + width, y + height - borderBottomRight);
        // this.arcTo()
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
            styles: {},
            attributes: {
                get x() {
                    return _this.x.toString();
                },
                get y() {
                    return _this.y.toString();
                },
            },
            get textContent() {
                return _this.content;
            },
        };
    }
}

interface SVGVNode {
    id: string;
    tag: keyof SVGElementTagNameMap;
    element?: SVGContextElement;
    children: SVGVNode[];
}

interface ParentRef {
    id: string;
    parent?: ParentRef;
}

function getAncestorGroupIds(element: ParentRef): string[] {
    const ids: string[] = [];
    let current = element.parent;

    while (current?.parent) {
        ids.unshift(current.id);
        current = current.parent;
    }

    return ids;
}

function ensureGroupPath(root: SVGVNode, groupIds: string[]): SVGVNode {
    let parent = root;

    for (const groupId of groupIds) {
        let child = parent.children.find(c => c.id === groupId);

        if (!child) {
            child = {
                id: groupId,
                tag: 'g',
                children: [],
            };
            parent.children.push(child);
        }

        parent = child;
    }

    return parent;
}

function reconcileNode(domParent: SVGElement | SVGSVGElement, vnode: SVGVNode, domCache: Map<string, SVGElement>): void {
    const desiredIds = vnode.children.map(c => c.id);
    const existingChildren = new Map<string, SVGElement>();

    for (let i = domParent.children.length - 1; i >= 0; i--) {
        const child = domParent.children[i] as SVGElement;
        const childId = child.getAttribute('id');

        if (childId && desiredIds.includes(childId)) {
            existingChildren.set(childId, child);
        } else {
            child.remove();
            if (childId) {
                domCache.delete(childId);
            }
        }
    }

    for (let i = 0; i < vnode.children.length; i++) {
        const childVNode = vnode.children[i];
        let domChild = existingChildren.get(childVNode.id) || domCache.get(childVNode.id);

        if (!domChild) {
            const tag = childVNode.element?.definition.tag ?? childVNode.tag;
            domChild = createSVGElement(tag);
            domChild.setAttribute('id', childVNode.id);
            domCache.set(childVNode.id, domChild);
        }

        if (childVNode.element) {
            updateSVGElement(domChild, childVNode.element);
        }

        const currentAtIndex = domParent.children[i] as SVGElement | undefined;

        if (currentAtIndex !== domChild) {
            if (currentAtIndex) {
                domParent.insertBefore(domChild, currentAtIndex);
            } else {
                domParent.appendChild(domChild);
            }
        }

        if (childVNode.children.length > 0) {
            reconcileNode(domChild, childVNode, domCache);
        }
    }
}

export class SVGContext extends Context<SVGSVGElement> {

    private vtree: SVGVNode;
    private domCache: Map<string, SVGElement>;
    private requestFrame: (callback: AnyFunction) => void;

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
        this.domCache = new Map();
        this.requestFrame = createFrameBuffer();
        this.init();
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

    private render() {
        reconcileNode(this.element, this.vtree, this.domCache);
        this.vtree = {
            id: '__root__',
            tag: 'svg',
            children: [],
        };
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
        this.addToVTree(text);

        return text;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    clip(path: SVGPath, fillRule?: FillRule): void {
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    fill(element: SVGContextElement, fillRule?: FillRule): void {
        this.setElementStyles(element, {
            fill: this.currentState.fillStyle,
        });
    }

    stroke(element: SVGContextElement): void {
        this.setElementStyles(element, {
            stroke: this.currentState.strokeStyle,
            strokeLinecap: this.currentState.lineCap,
            strokeDasharray: this.currentState.lineDash.join(' '),
            strokeDashoffset: this.currentState.lineDashOffset.toString(),
            strokeLinejoin: this.currentState.lineJoin,
            strokeWidth: this.currentState.lineWidth.toString(),
            strokeMiterlimit: this.currentState.miterLimit.toString(),
        });
    }

    measureText(text: string): TextMetrics {
        const context = getRefContext();

        context.save();
        context.font = this.font;

        const result = context.measureText(text);

        context.restore();

        return new Proxy(result, {
            get: (target, prop: string) => {
                const value = target[prop as keyof TextMetrics];

                return typeIsNumber(value)
                    ? this.scaleDPR(value)
                    : value;
            },
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
