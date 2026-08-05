import {
    numberClamp,
    numberNice,
} from '@ripl/utilities';

/** A generated set of axis ticks covering one axis of the visible window. */
export interface TickSet {
    /** The spacing between adjacent major ticks, in data units. */
    step: number;
    /** The major tick values inside the window, ascending. */
    values: number[];
    /** The label for each entry of {@link TickSet.values}, in the same order. */
    labels: string[];
    /** The minor tick values inside the window, ascending, excluding every major tick. */
    minorValues: number[];
}

const DEFAULT_TICK_COUNT = 10;
const EXPONENTIAL_LOWER = 1e-4;
const EXPONENTIAL_UPPER = 1e6;
const MAX_DECIMALS = 15;
const MAX_EXPONENTIAL_DIGITS = 6;
const MAX_MAJOR_TICKS = 128;
const MAX_MINOR_TICKS = 640;
const MINOR_DIVISIONS: Record<number, number> = {
    1: 5,
    2: 4,
    5: 5,
};
const DEFAULT_MINOR_DIVISIONS = 5;
const PI_MINOR_DIVISIONS = 2;
const PI_DENOMINATORS = [
    16,
    12,
    8,
    6,
    4,
    3,
    2,
];

function emptyTickSet(): TickSet {
    return {
        step: 0,
        values: [],
        labels: [],
        minorValues: [],
    };
}

function isPlottableWindow(min: number, max: number): boolean {
    return Number.isFinite(min) && Number.isFinite(max) && max > min;
}

function formatExponential(value: number, step: number): string {
    const digits = numberClamp(
        Math.floor(Math.log10(Math.abs(value))) - Math.floor(Math.log10(step)),
        0,
        MAX_EXPONENTIAL_DIGITS
    );

    const [
        mantissa,
        exponent,
    ] = value.toExponential(digits).split('e');

    return `${Number(mantissa)}e${Number(exponent)}`;
}

/** Subdivisions a major step is split into, chosen so minor lines land on 1-2-5 friendly values. */
function minorDivisions(step: number): number {
    const leading = Math.round(step / 10 ** Math.floor(Math.log10(step)));

    return MINOR_DIVISIONS[leading] ?? DEFAULT_MINOR_DIVISIONS;
}

function collectMinorValues(min: number, max: number, step: number, divisions: number): number[] {
    const minorStep = step / divisions;
    const first = Math.ceil(min / minorStep);
    const last = Math.floor(max / minorStep);
    const values: number[] = [];

    for (let i = first; i <= last && values.length < MAX_MINOR_TICKS; i++) {
        if (i % divisions !== 0) {
            values.push(i * minorStep);
        }
    }

    return values;
}

function greatestCommonDivisor(a: number, b: number): number {
    let left = a;
    let right = b;

    while (right) {
        const next = left % right;

        left = right;
        right = next;
    }

    return left || 1;
}

/** Picks the numerator/denominator of a pi step from the fraction ladder, or an integer multiple above pi. */
function piStepFraction(ratio: number): [number, number] {
    if (ratio > 1) {
        return [
            numberNice(ratio, true),
            1,
        ];
    }

    return [
        1,
        PI_DENOMINATORS.find(denominator => 1 / denominator >= ratio) ?? 1,
    ];
}

function formatPiLabel(index: number, numerator: number, denominator: number): string {
    if (index === 0) {
        return '0';
    }

    const scaled = index * numerator;
    const divisor = greatestCommonDivisor(Math.abs(scaled), denominator);
    const top = scaled / divisor;
    const bottom = denominator / divisor;
    const sign = top < 0 ? '-' : '';
    const magnitude = Math.abs(top);
    const coefficient = magnitude === 1 ? '' : String(magnitude);

    return bottom === 1
        ? `${sign}${coefficient}π`
        : `${sign}${coefficient}π/${bottom}`;
}

/**
 * The number of decimal places a label needs to tell adjacent ticks apart.
 *
 * Derived from the step rather than the value: `0.30000000000000004` is a float artifact of the
 * value, and only the step knows how much of it is signal.
 *
 * @param step - The spacing between adjacent ticks, in data units.
 * @returns A decimal count between `0` and `15`.
 */
export function tickDecimals(step: number): number {
    if (!Number.isFinite(step) || step <= 0) {
        return 0;
    }

    return numberClamp(-Math.floor(Math.log10(step)), 0, MAX_DECIMALS);
}

/**
 * Formats a tick value at the precision its step warrants, stripping trailing zeros and normalizing
 * `-0` to `0`. Values outside roughly `[1e-4, 1e6]` switch to exponential notation.
 *
 * @param value - The tick value to label.
 * @param step - The spacing between adjacent ticks, in data units.
 * @returns The label, or an empty string when the value is not finite.
 */
export function formatTickLabel(value: number, step: number): string {
    if (!Number.isFinite(value)) {
        return '';
    }

    if (value === 0) {
        return '0';
    }

    if (step < EXPONENTIAL_LOWER || Math.abs(value) >= EXPONENTIAL_UPPER) {
        return formatExponential(value, step);
    }

    // `Number` drops the zeros `toFixed` pads with and folds `-0` back to `0`.
    return String(Number(value.toFixed(tickDecimals(step))));
}

/**
 * Formats a traced coordinate, two decimals finer than the axis labels so the readout stays useful
 * between gridlines.
 *
 * @param value - The coordinate to label.
 * @param step - The spacing between adjacent ticks on that axis, in data units.
 * @returns The formatted coordinate.
 */
export function formatCoordinate(value: number, step: number): string {
    return formatTickLabel(value, step / 100);
}

/**
 * Generates the ticks falling strictly inside `[min, max]`, on a 1-2-5 decade ladder.
 *
 * The window is the user's, so the domain is never expanded to a nice boundary the way a chart axis
 * would be; only the step is rounded. Tick values are always `index * step` rather than an
 * accumulated sum, which would drift into labels like `0.30000000000000004`.
 *
 * @param min - The lower edge of the visible window, in data units.
 * @param max - The upper edge of the visible window, in data units.
 * @param count - The approximate number of major ticks wanted across the window.
 * @returns The major values with their labels, plus the minor values between them.
 */
export function generateTicks(min: number, max: number, count: number = DEFAULT_TICK_COUNT): TickSet {
    if (!isPlottableWindow(min, max) || count <= 0) {
        return emptyTickSet();
    }

    const step = numberNice((max - min) / count, true);

    if (!Number.isFinite(step) || step <= 0) {
        return emptyTickSet();
    }

    const first = Math.ceil(min / step);
    const last = Math.floor(max / step);
    const values: number[] = [];
    const labels: string[] = [];

    for (let i = first; i <= last && values.length < MAX_MAJOR_TICKS; i++) {
        values.push(i * step);
        labels.push(formatTickLabel(i * step, step));
    }

    return {
        step,
        values,
        labels,
        minorValues: collectMinorValues(min, max, step, minorDivisions(step)),
    };
}

/**
 * Generates ticks on multiples of pi, labelled from a pi-fraction ladder so a trig view reads
 * `π/2`, `3π/2`, `2π` instead of `1.5707963`.
 *
 * Falls back to {@link generateTicks} once the window is tighter than the finest rung of the ladder
 * (`π/16`), where pi fractions carry no more meaning than decimals.
 *
 * @param min - The lower edge of the visible window, in data units.
 * @param max - The upper edge of the visible window, in data units.
 * @param count - The approximate number of major ticks wanted across the window.
 * @returns The major values with their labels, plus the minor values between them.
 */
export function generatePiTicks(min: number, max: number, count: number = DEFAULT_TICK_COUNT): TickSet {
    if (!isPlottableWindow(min, max) || count <= 0) {
        return emptyTickSet();
    }

    const ratio = (max - min) / count / Math.PI;

    if (!Number.isFinite(ratio) || ratio < 1 / PI_DENOMINATORS[0]) {
        return generateTicks(min, max, count);
    }

    const [
        numerator,
        denominator,
    ] = piStepFraction(ratio);

    const step = numerator * Math.PI / denominator;
    const first = Math.ceil(min / step);
    const last = Math.floor(max / step);
    const values: number[] = [];
    const labels: string[] = [];

    for (let i = first; i <= last && values.length < MAX_MAJOR_TICKS; i++) {
        values.push(i * step);
        labels.push(formatPiLabel(i, numerator, denominator));
    }

    return {
        step,
        values,
        labels,
        minorValues: collectMinorValues(min, max, step, PI_MINOR_DIVISIONS),
    };
}
