import {
    EventBus,
} from '../core/event-bus';

import {
    Scale,
    scaleContinuous,
} from '../scales';

import {
    BorderRadius,
    getThetaPoint,
    Point,
} from '../math';

import {
    createFrameBuffer,
} from '../animation';

import {
    AnyFunction,
    arrayForEach,
    arrayJoin,
    objectForEach,
    onDOMElementResize,
    stringUniqueId,
    typeIsString,
} from '@ripl/utilities';

import type {
    BaseState,
    Context,
    ContextEventMap,
    ContextOptions,
    Direction,
    FillRule,
    FontKerning,
    LineCap,
    LineJoin,
    Path,
    TextAlignment,
    TextBaseline,
} from './types';

const REF_CANVAS = document.createElement('canvas');
const REF_CONTEXT = REF_CANVAS.getContext('2d')!;

function getDefaultState() {
    return {
        fillStyle: REF_CONTEXT.fillStyle,
        filter: REF_CONTEXT.filter,
        direction: REF_CONTEXT.direction,
        font: REF_CONTEXT.font,
        fontKerning: REF_CONTEXT.fontKerning,
        globalAlpha: REF_CONTEXT.globalAlpha,
        globalCompositeOperation: REF_CONTEXT.globalCompositeOperation,
        lineCap: REF_CONTEXT.lineCap,
        lineDash: REF_CONTEXT.getLineDash(),
        lineDashOffset: REF_CONTEXT.lineDashOffset,
        lineJoin: REF_CONTEXT.lineJoin,
        lineWidth: REF_CONTEXT.lineWidth,
        miterLimit: REF_CONTEXT.miterLimit,
        shadowBlur: REF_CONTEXT.shadowBlur,
        shadowColor: REF_CONTEXT.shadowColor,
        shadowOffsetX: REF_CONTEXT.shadowOffsetX,
        shadowOffsetY: REF_CONTEXT.shadowOffsetY,
        strokeStyle: REF_CONTEXT.strokeStyle,
        textAlign: REF_CONTEXT.textAlign,
        textBaseline: REF_CONTEXT.textBaseline,
    } as BaseState;
}

function createSVGElement<TTag extends keyof SVGElementTagNameMap>(tag: TTag) {
    return document.createElementNS('http://www.w3.org/2000/svg', tag);
}

type SVGPathImplementation = {
    styles: Partial<CSSStyleDeclaration>;
    attributes: {
        d: string;
        [key: string]: string;
    };
}

function updatePathElement(element: SVGElement, path: SVGPath) {
    const {
        attributes,
        styles,
    } = path.impl;

    element.setAttribute('id', path.id);
    Object.assign(element.style, styles);
    objectForEach(attributes, (key, value) => element.setAttribute(key.toString(), value));
}

export class SVGPath implements Path<SVGPathImplementation> {

    public readonly id: string;
    public readonly impl: SVGPathImplementation;

    constructor(id: string) {
        this.id = id;
        this.impl = {
            attributes: {
                d: '',
            },
            styles: {
                stroke: 'none',
                fill: 'none',
            },
        };
    }

    public setState(op: 'stroke' | 'fill', state: BaseState) {
        Object.assign(this.impl.styles, {
            filter: state.filter,
            direction: state.direction,
            font: state.font,
            fontKerning: state.fontKerning,
            textAlign: state.textAlign,
            opacity: state.globalAlpha.toString(),
            // shadowBlur,
            // shadowColor,
            // shadowOffsetX,
            // shadowOffsetY,
            //textBaseline,
        });

        if (op === 'stroke') {
            Object.assign(this.impl.styles, {
                stroke: state.strokeStyle,
                strokeLinecap: state.lineCap,
                strokeDasharray: state.lineDash.join(' '),
                strokeDashoffset: state.lineDashOffset.toString(),
                strokeLinejoin: state.lineJoin,
                strokeWidth: state.lineWidth.toString(),
                strokeMiterlimit: state.miterLimit.toString(),
            });
        }

        if (op === 'fill') {
            Object.assign(this.impl.styles, {
                fill: state.fillStyle,
            });
        }
    }

    private appendElementData(data: string) {
        this.impl.attributes.d = `${this.impl.attributes.d} ${data}`.trim();
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

    polyline(points: Point[]): void {
        arrayForEach(points, ([x, y], index) => !index
            ? this.moveTo(x,y)
            : this.lineTo(x, y)
        );
    }

}



export class SVGContext extends EventBus<ContextEventMap> implements Context {

    readonly element: SVGSVGElement;

    private states: BaseState[];
    private currentState: BaseState;
    private renderDepth = 0;
    private stack: Set<SVGPath>;
    private requestFrame: (callback: AnyFunction) => void;

    public buffer: boolean;
    public width!: number;
    public height!: number;
    public xScale!: Scale<number, number>;
    public yScale!: Scale<number, number>;

    get fillStyle(): string {
        return this.currentState.fillStyle;
    }

    set fillStyle(value) {
        this.currentState.fillStyle = value;
    }

    get filter(): string {
        return this.currentState.filter;
    }

    set filter(value) {
        this.currentState.filter = value;
    }

    get direction(): Direction {
        return this.currentState.direction;
    }

    set direction(value) {
        this.currentState.direction = value;
    }

    get font(): string {
        return this.currentState.font;
    }

    set font(value) {
        this.currentState.font = value;
    }

    get fontKerning(): FontKerning {
        return this.currentState.fontKerning;
    }

    set fontKerning(value) {
        this.currentState.fontKerning = value;
    }

    get globalAlpha(): number {
        return this.currentState.globalAlpha;
    }

    set globalAlpha(value) {
        this.currentState.globalAlpha = value;
    }

    get globalCompositeOperation(): unknown {
        return this.currentState.globalCompositeOperation;
    }

    set globalCompositeOperation(value) {
        this.currentState.globalCompositeOperation = value;
    }

    get lineCap(): LineCap {
        return this.currentState.lineCap;
    }

    set lineCap(value) {
        this.currentState.lineCap = value;
    }

    get lineDash(): number[] {
        return this.currentState.lineDash;
    }

    set lineDash(value) {
        this.currentState.lineDash = value;
    }

    get lineDashOffset(): number {
        return this.currentState.lineDashOffset;
    }

    set lineDashOffset(value) {
        this.currentState.lineDashOffset = value;
    }

    get lineJoin(): LineJoin {
        return this.currentState.lineJoin;
    }

    set lineJoin(value) {
        this.currentState.lineJoin = value;
    }

    get lineWidth(): number {
        return this.currentState.lineWidth;
    }

    set lineWidth(value) {
        this.currentState.lineWidth = value;
    }

    get miterLimit(): number {
        return this.currentState.miterLimit;
    }

    set miterLimit(value) {
        this.currentState.miterLimit = value;
    }

    get shadowBlur(): number {
        return this.currentState.shadowBlur;
    }

    set shadowBlur(value) {
        this.currentState.shadowBlur = value;
    }

    get shadowColor(): string {
        return this.currentState.shadowColor;
    }

    set shadowColor(value) {
        this.currentState.shadowColor = value;
    }

    get shadowOffsetX(): number {
        return this.currentState.shadowOffsetX;
    }

    set shadowOffsetX(value) {
        this.currentState.shadowOffsetX = value;
    }

    get shadowOffsetY(): number {
        return this.currentState.shadowOffsetY;
    }

    set shadowOffsetY(value) {
        this.currentState.shadowOffsetY = value;
    }

    get strokeStyle(): string {
        return this.currentState.strokeStyle;
    }

    set strokeStyle(value) {
        this.currentState.strokeStyle = value;
    }

    get textAlign(): TextAlignment {
        return this.currentState.textAlign;
    }

    set textAlign(value) {
        this.currentState.textAlign = value;
    }

    get textBaseline(): TextBaseline {
        return this.currentState.textBaseline;
    }

    set textBaseline(value) {
        this.currentState.textBaseline = value;
    }

    constructor(target: string | HTMLElement, options?: ContextOptions) {
        super();

        const {
            buffer = true,
        } = options || {};

        const root = typeIsString(target)
            ? document.querySelector(target) as HTMLElement
            : target;

        const svg = createSVGElement('svg');

        this.element = svg;
        this.buffer = buffer;
        this.stack = new Set();
        this.states = [];
        this.currentState = getDefaultState();
        this.requestFrame = createFrameBuffer();

        svg.style.display = 'block';
        svg.style.width = '100%';
        svg.style.height = '100%';

        root.appendChild(svg);

        const {
            width,
            height,
        } = svg.getBoundingClientRect();

        this.rescale(width, height);

        onDOMElementResize(root, ({ width, height }) => this.rescale(width, height));
    }

    private rescale(width: number, height: number) {
        this.xScale = scaleContinuous([0, width], [0, width]);
        this.yScale = scaleContinuous([0, height], [0, height]);

        this.width = width;
        this.height = height;
        this.element.setAttribute('viewBox', `0 0 ${width} ${height}`);

        this.emit('context:resize', null);
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

        const {
            left: entries,
            inner: updates,
            right: exits,
        } = arrayJoin(stack, elements, 'id');

        arrayForEach(entries, path => {
            const element = createSVGElement('path');
            updatePathElement(element, path);
            this.element.append(element);
        });

        arrayForEach(updates, ([path, element]) => updatePathElement(element, path));
        arrayForEach(exits, element => element.remove());

        this.stack.clear();
    }

    save(): void {
        this.states.push(this.currentState);
        this.currentState = getDefaultState();
    }

    restore(): void {
        this.currentState = this.states.pop() || getDefaultState();
    }

    clear(): void {
    }

    reset(): void {
    }

    markRenderStart(): void {
        this.renderDepth += 1;
    }

    markRenderEnd(): void {
        this.renderDepth -= 1;

        if (this.renderDepth !== 0) {
            return;
        }

        this.buffer
            ? this.requestFrame(() => this.render())
            : this.render();
    }

    rotate(angle: number): void {
    }

    scale(x: number, y: number): void {
    }

    translate(x: number, y: number): void {
    }

    // eslint-disable-next-line id-length
    setTransform(a: number, b: number, c: number, d: number, e: number, f: number): void {
    }

    // eslint-disable-next-line id-length
    transform(a: number, b: number, c: number, d: number, e: number, f: number): void {
    }

    measureText(text: string): TextMetrics {
    }

    fillText(text: string, x: number, y: number, maxWidth?: number): void {
    }

    strokeText(text: string, x: number, y: number, maxWidth?: number): void {
    }

    createPath(id: string = `path-${stringUniqueId()}`): SVGPath {
        const path = new SVGPath(id);
        this.stack.add(path);

        return path;
    }

    clip(path: SVGPath, fillRule?: FillRule): void {
    }

    fill(path: SVGPath, fillRule?: FillRule): void {
        path.setState('fill', this.currentState);
    }

    stroke(path: SVGPath): void {
        path.setState('stroke', this.currentState);
    }

    isPointInPath(path: SVGPath, x: number, y: number, fillRule?: FillRule): boolean {
        return this.isPointIn('fill', path, x, y);
    }

    isPointInStroke(path: SVGPath, x: number, y: number): boolean {
        return this.isPointIn('stroke', path, x, y);
    }


}