import type {
    SVGContextElement,
    SVGContextElementDefinition,
} from './types';

import {
    ContextPath,
    getThetaPoint,
    normaliseBorderRadius,
    radiansToDegrees,
} from '@ripl/core';

import type {
    BorderRadius,
} from '@ripl/core';

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
        const rotDeg = radiansToDegrees(rotation);
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
