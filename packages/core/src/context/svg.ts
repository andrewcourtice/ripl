import {
    BaseState,
    Context,
    ContextElement,
    ContextOptions,
    ContextPath,
    ContextText,
    TextAlignment,
    TextOptions,
} from './base';

import {
    scaleContinuous,
} from '../scales';

import {
    BorderRadius,
    getThetaPoint,
} from '../math';

import {
    createFrameBuffer,
} from '../animation';

import {
    AnyFunction,
    arrayForEach,
    arrayJoin,
    arrayMap,
    GetMutableKeys,
    objectForEach,
    objectMap,
    onDOMElementResize,
    typeIsString,
} from '@ripl/utilities';

type Styles = {
    [TKey in GetMutableKeys<CSSStyleDeclaration>]: CSSStyleDeclaration[TKey];
}

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
        return SVG_STYLE_MAP[key]?.[value] ?? value;
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

export class SVGContext extends Context<SVGSVGElement> {

    private stack: Set<SVGContextElement>;
    private requestFrame: (callback: AnyFunction) => void;

    constructor(target: string | HTMLElement, options?: ContextOptions) {
        const svg = createSVGElement('svg');

        svg.style.display = 'block';
        svg.style.width = '100%';
        svg.style.height = '100%';

        super(target, svg, {
            buffer: true,
            ...options,
        });

        this.stack = new Set();
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

    private render() {
        const stack = Array.from(this.stack.values());
        const elements = Array.from(this.element.children) as SVGElement[];
        const order = arrayMap(stack, element => element.id);

        const {
            left: entries,
            inner: updates,
            right: exits,
        } = arrayJoin(stack, elements, 'id');

        const newElements = arrayMap(entries, contextElement => {
            const svgElement = createSVGElement(contextElement.definition.tag);
            updateSVGElement(svgElement, contextElement);
            return svgElement;
        });

        const updatedElements = arrayMap(updates, ([contextElement, svgElement]) => {
            updateSVGElement(svgElement, contextElement);
            return svgElement;
        });

        arrayForEach(exits, element => element.remove());

        const orderedElements = newElements
            .concat(updatedElements)
            .sort((ea, eb) => order.indexOf(ea.id) - order.indexOf(eb.id));

        this.element.append(...orderedElements);
        this.stack.clear();
    }

    markRenderEnd(): void {
        super.markRenderEnd();

        if (this.renderDepth !== 0) {
            return;
        }

        this.buffer
            ? this.requestFrame(() => this.render())
            : this.render();
    }

    createPath(id?: string): SVGPath {
        const path = new SVGPath(id);
        this.stack.add(path);

        return path;
    }

    createText(options: TextOptions): ContextText {
        const text = new SVGText(options);
        this.stack.add(text);

        return text;
    }

    clip(path: SVGPath, fillRule?: FillRule): void {
    }

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

    isPointInPath(path: SVGPath, x: number, y: number, fillRule?: FillRule): boolean {
        return this.isPointIn('fill', path, x, y);
    }

    isPointInStroke(path: SVGPath, x: number, y: number): boolean {
        return this.isPointIn('stroke', path, x, y);
    }

}

export function createSVGContext(target: string | HTMLElement, options?: ContextOptions): Context {
    return new SVGContext(target, options);
}