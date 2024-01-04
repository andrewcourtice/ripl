import type {
    EventBus,
    EventMap,
} from '../core/event-bus';

import type {
    Scale,
} from '../scales';

import type {
    OneOrMore,
} from '@ripl/utilities';

export type ContextType = 'canvas' | 'svg';
export type Direction = 'inherit' | 'ltr' | 'rtl';
export type FontKerning = 'auto' | 'none' | 'normal';
export type LineCap = 'butt' | 'round' | 'square';
export type LineJoin = 'bevel' | 'miter' | 'round';
export type TextAlignment = 'center' | 'end' | 'left' | 'right' | 'start';
export type TextBaseline = 'alphabetic' | 'bottom' | 'hanging' | 'ideographic' | 'middle' | 'top';
export type FillRule = 'evenodd' | 'nonzero';

export interface ContextEventMap extends EventMap {
    'context:resize': null;
}

export interface ContextOptions {
    type?: ContextType;
}

export interface Path<TImpl = unknown> {
    readonly impl: TImpl;
    arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, counterclockwise?: boolean): void;
    arcTo(x1: number, y1: number, x2: number, y2: number, radius: number): void;
    bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): void;
    closePath(): void;
    ellipse(x: number, y: number, radiusX: number, radiusY: number, rotation: number, startAngle: number, endAngle: number, counterclockwise?: boolean): void;
    lineTo(x: number, y: number): void;
    moveTo(x: number, y: number): void;
    quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void;
    rect(x: number, y: number, width: number, height: number): void;
    roundRect(x: number, y: number, width: number, height: number, radii?: OneOrMore<number>): void;
}

export interface Context extends EventBus<ContextEventMap> {
    element: HTMLElement;
    width: number;
    height: number;

    xScale: Scale;
    yScale: Scale;

    get fillStyle(): string;
    set fillStyle(value);
    get filter(): string;
    set filter(value);
    get direction(): Direction;
    set direction(value);
    get font(): string;
    set font(value);
    get fontKerning(): FontKerning;
    set fontKerning(value);
    get globalAlpha(): number;
    set globalAlpha(value);
    get globalCompositeOperation(): unknown;
    set globalCompositeOperation(value);
    get lineCap(): LineCap;
    set lineCap(value);
    get lineDash(): number[];
    set lineDash(value);
    get lineDashOffset(): number;
    set lineDashOffset(value);
    get lineJoin(): LineJoin;
    set lineJoin(value);
    get lineWidth(): number;
    set lineWidth(value);
    get miterLimit(): number;
    set miterLimit(value);
    get shadowBlur(): number;
    set shadowBlur(value);
    get shadowColor(): string;
    set shadowColor(value);
    get shadowOffsetX(): number;
    set shadowOffsetX(value);
    get shadowOffsetY(): number;
    set shadowOffsetY(value);
    get strokeStyle(): string;
    set strokeStyle(value);
    get textAlign(): TextAlignment;
    set textAlign(value);
    get textBaseline(): TextBaseline;
    set textBaseline(value);

    save(): void;
    restore(): void;
    clear(): void;
    reset(): void;

    rotate(angle: number): void;
    scale(x: number, y: number): void;
    translate(x: number, y: number): void;
    setTransform(a: number, b: number, c: number, d: number, e: number, f: number): void;
    transform(a: number, b: number, c: number, d: number, e: number, f: number): void;

    fillText(text: string, x: number, y: number, maxWidth?: number): void;
    measureText(text: string): TextMetrics;
    strokeText(text: string, x: number, y: number, maxWidth?: number): void;

    createPath(): Path;
    clip(path: Path, fillRule?: FillRule): void;
    fill(path: Path, fillRule?: FillRule): void;
    isPointInPath(path: Path, x: number, y: number, fillRule?: FillRule): boolean;
    isPointInStroke(path: Path, x: number, y: number): boolean;
    stroke(path: Path): void;
}