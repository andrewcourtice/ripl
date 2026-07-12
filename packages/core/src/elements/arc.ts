import {
    Shape2D,
} from '../core';

import type {
    BaseElementState,
    Shape2DOptions,
} from '../core';

import type {
    Context,
} from '../context';

import {
    Box,
    getThetaPoint,
    max,
    min,
} from '../math';

import {
    typeIsNil,
} from '@ripl/utilities';

const TAU = Math.PI * 2;

// The four cardinal directions where a circle reaches its horizontal/vertical extremes.
const CARDINAL_ANGLES = [0, Math.PI / 2, Math.PI, Math.PI * 3 / 2];

/**
 * Whether the sweep between two angles passes through an angle equivalent (mod 2π) to `target`. Used
 * to decide when an arc reaches the full radius along a cardinal axis, which the endpoints alone miss.
 */
function arcSweepsAngle(startAngle: number, endAngle: number, target: number): boolean {
    const lo = Math.min(startAngle, endAngle);
    const hi = Math.max(startAngle, endAngle);
    const aligned = target + Math.ceil((lo - target) / TAU) * TAU;

    return aligned <= hi;
}

/** State interface for an arc element, defining center, angles, radii, pad angle, and border radius. */
export interface ArcState extends BaseElementState {
    cx: number;
    cy: number;
    startAngle: number;
    endAngle: number;
    radius: number;
    innerRadius?: number;
    padAngle?: number;
    borderRadius?: number;
}

/** An arc or annular sector shape supporting inner radius and pad angle. */
export class Arc extends Shape2D<ArcState> {

    public get cx() {
        return this.getStateValue('cx');
    }

    public set cx(value) {
        this.setStateValue('cx', value);
    }

    public get cy() {
        return this.getStateValue('cy');
    }

    public set cy(value) {
        this.setStateValue('cy', value);
    }

    public get startAngle() {
        return this.getStateValue('startAngle');
    }

    public set startAngle(value) {
        this.setStateValue('startAngle', value);
    }

    public get endAngle() {
        return this.getStateValue('endAngle');
    }

    public set endAngle(value) {
        this.setStateValue('endAngle', value);
    }

    public get radius() {
        return this.getStateValue('radius');
    }

    public set radius(value) {
        this.setStateValue('radius', value);
    }

    public get innerRadius() {
        return this.getStateValue('innerRadius');
    }

    public set innerRadius(value) {
        this.setStateValue('innerRadius', value);
    }

    public get padAngle() {
        return this.getStateValue('padAngle');
    }

    public set padAngle(value) {
        this.setStateValue('padAngle', value);
    }

    public get borderRadius() {
        return this.getStateValue('borderRadius');
    }

    public set borderRadius(value) {
        this.setStateValue('borderRadius', value);
    }

    constructor(options: Shape2DOptions<ArcState>) {
        super('arc', options);
    }

    /** Computes the centroid point of this arc, optionally with state overrides. */
    public getCentroid(alterations?: Partial<ArcState>) {
        const {
            cx,
            cy,
            radius,
            startAngle,
            endAngle,
            innerRadius = 0,
        } = {
            cx: this.cx,
            cy: this.cy,
            radius: this.radius,
            startAngle: this.startAngle,
            endAngle: this.endAngle,
            innerRadius: this.innerRadius,
            ...alterations,
        };

        const angle = (startAngle + endAngle) / 2;
        const distance = innerRadius + (radius - innerRadius) / 2;

        return getThetaPoint(angle, distance, cx, cy);
    }

    public getBoundingBox(): Box {
        const {
            cx,
            cy,
            radius,
            innerRadius,
            startAngle,
            endAngle,
        } = this;

        // Sample the outer edge at the endpoints and at every cardinal direction the sweep crosses —
        // an arc bulges to the full radius at those cardinals (e.g. a 0→π sector reaches cy+radius at
        // π/2), which the endpoints alone do not capture. Using `getThetaPoint` throughout keeps this
        // independent of the angle→coordinate convention.
        const outerAngles = [startAngle, endAngle];

        for (const cardinal of CARDINAL_ANGLES) {
            if (arcSweepsAngle(startAngle, endAngle, cardinal)) {
                outerAngles.push(cardinal);
            }
        }

        const xs: number[] = [];
        const ys: number[] = [];

        for (const angle of outerAngles) {
            const [x, y] = getThetaPoint(angle, radius, cx, cy);

            xs.push(x);
            ys.push(y);
        }

        if (typeIsNil(innerRadius)) {
            // A pie sector's inner edge is the centre point.
            xs.push(cx);
            ys.push(cy);
        } else {
            const [innerX1, innerY1] = getThetaPoint(startAngle, innerRadius, cx, cy);
            const [innerX2, innerY2] = getThetaPoint(endAngle, innerRadius, cx, cy);

            xs.push(innerX1, innerX2);
            ys.push(innerY1, innerY2);
        }

        return new Box(
            min(...ys),
            min(...xs),
            max(...ys),
            max(...xs)
        );
    }

    public render(context: Context) {
        let {
            cx,
            cy,
            radius,
            innerRadius,
            startAngle,
            endAngle,
            padAngle,
        } = this;

        radius = Math.max(0, radius);
        innerRadius = typeIsNil(innerRadius) ? innerRadius : Math.max(0, innerRadius);

        return super.render(context, path => {
            if (padAngle) {
                const offset = padAngle / 2;

                startAngle = Math.min(startAngle + offset, endAngle);
                endAngle = Math.max(endAngle - offset, startAngle);
            }

            if (typeIsNil(innerRadius)) {
                return path.arc(cx, cy, radius, startAngle, endAngle);
            }

            const [x1, y1] = getThetaPoint(startAngle, radius, cx, cy);
            const [x2, y2] = getThetaPoint(endAngle, innerRadius, cx, cy);

            path.moveTo(x1, y1);
            path.arc(cx, cy, radius, startAngle, endAngle);
            path.lineTo(x2, y2);
            path.arc(cx, cy, innerRadius, endAngle, startAngle, true);
            path.lineTo(x1, y1);
        });
    }

}

/** Factory function that creates a new `Arc` instance. */
export function createArc(...options: ConstructorParameters<typeof Arc>) {
    return new Arc(...options);
}

/** Type guard that checks whether a value is an `Arc` instance. */
export function elementIsArc(value: unknown): value is Arc {
    return value instanceof Arc;
}