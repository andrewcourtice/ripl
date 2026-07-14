/**
 * Reusable statistical data transforms shared by the statistical chart types (histogram, box plot,
 * violin) and available to consumers directly. Pure functions over numeric arrays — no rendering.
 */

import {
    numberNice,
} from '@ripl/utilities';

/** A histogram bin covering the half-open interval `[x0, x1)` (the last bin includes `x1`). */
export interface Bin {
    /** Inclusive lower boundary of the bin. */
    x0: number;
    /** Upper boundary of the bin (exclusive, except for the last bin). */
    x1: number;
    /** Number of values that fell into the bin. */
    count: number;
    /** The values that fell into the bin. */
    values: number[];
}

/** Options for {@link bin}. */
export interface BinOptions {
    /** Target number of bins (ignored when `thresholds` is given). */
    bins?: number;
    /** Value extent to bin over (defaults to the data extent). */
    domain?: [number, number];
    /** Explicit bin boundaries; overrides `bins`. */
    thresholds?: number[];
}

/** Five-number summary plus IQR and outliers, as used by a box plot. */
export interface BoxplotStats {
    /** Smallest value within the lower whisker (excluding outliers). */
    min: number;
    /** First quartile (25th percentile). */
    q1: number;
    /** Median (50th percentile). */
    median: number;
    /** Third quartile (75th percentile). */
    q3: number;
    /** Largest value within the upper whisker (excluding outliers). */
    max: number;
    /** Interquartile range (`q3 - q1`). */
    iqr: number;
    /** Values beyond 1.5×IQR of the quartiles. */
    outliers: number[];
}

/** A fitted simple linear regression. */
export interface LinearRegression {
    /** Slope of the fitted line. */
    slope: number;
    /** Y-intercept of the fitted line. */
    intercept: number;
    /** Coefficient of determination (R²), measuring goodness of fit. */
    r2: number;
    /** Predicts `y` for a given `x` from the fitted line. */
    predict(x: number): number;
}

/** The arithmetic mean of the values (`NaN` when empty). */
export function mean(values: number[]): number {
    if (!values.length) {
        return NaN;
    }

    return values.reduce((sum, value) => sum + value, 0) / values.length;
}

/** The population standard deviation of the values. */
export function deviation(values: number[]): number {
    if (values.length < 2) {
        return 0;
    }

    const average = mean(values);
    const variance = values.reduce((sum, value) => sum + (value - average) ** 2, 0) / values.length;

    return Math.sqrt(variance);
}

function quantileSorted(sorted: number[], probability: number): number {
    if (!sorted.length) {
        return NaN;
    }

    const index = (sorted.length - 1) * probability;
    const lower = Math.floor(index);
    const upper = Math.ceil(index);

    if (lower === upper) {
        return sorted[lower];
    }

    return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

/** The `p`-quantile (0–1) of the values via linear interpolation between order statistics. */
export function quantile(values: number[], probability: number): number {
    return quantileSorted([...values].sort((a, b) => a - b), probability);
}

/**
 * Bins numeric values into a histogram. Without explicit `thresholds`, a "nice" uniform bin width is
 * derived from the target bin count (Sturges' rule by default). Values outside the domain are dropped.
 */
export function bin(values: number[], options?: BinOptions): Bin[] {
    if (!values.length) {
        return [];
    }

    const [
        min,
        max,
    ] = options?.domain ?? [
        Math.min(...values),
        Math.max(...values),
    ];

    let thresholds = options?.thresholds;

    if (!thresholds) {
        const count = Math.max(1, options?.bins ?? Math.ceil(Math.log2(values.length)) + 1);
        const step = numberNice((max - min) / count) || 1;
        const start = Math.floor(min / step) * step;

        thresholds = [];

        for (let edge = start; edge < max + step; edge += step) {
            thresholds.push(edge);
        }
    }

    if (thresholds.length < 2) {
        thresholds = [
            min,
            max + 1,
        ];
    }

    const bins: Bin[] = thresholds.slice(0, -1).map((x0, index) => ({
        x0,
        x1: thresholds![index + 1],
        count: 0,
        values: [],
    }));

    const last = bins.length - 1;

    values.forEach(value => {
        if (value < bins[0].x0 || value > bins[last].x1) {
            return;
        }

        let index = bins.findIndex(current => value >= current.x0 && value < current.x1);

        if (index === -1) {
            index = last;
        }

        bins[index].count += 1;
        bins[index].values.push(value);
    });

    return bins;
}

/** Computes the box-plot five-number summary, splitting values beyond 1.5×IQR out as outliers. */
export function boxplotStats(values: number[]): BoxplotStats {
    const sorted = [...values].sort((a, b) => a - b);

    const q1 = quantileSorted(sorted, 0.25);
    const median = quantileSorted(sorted, 0.5);
    const q3 = quantileSorted(sorted, 0.75);
    const iqr = q3 - q1;

    const lowerFence = q1 - 1.5 * iqr;
    const upperFence = q3 + 1.5 * iqr;

    const inliers = sorted.filter(value => value >= lowerFence && value <= upperFence);
    const outliers = sorted.filter(value => value < lowerFence || value > upperFence);

    return {
        q1,
        median,
        q3,
        iqr,
        min: inliers.length ? inliers[0] : sorted[0],
        max: inliers.length ? inliers[inliers.length - 1] : sorted[sorted.length - 1],
        outliers,
    };
}

/** Fits a simple least-squares linear regression to `[x, y]` points and reports its R². */
export function linearRegression(points: [number, number][]): LinearRegression {
    const count = points.length;

    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;

    points.forEach(([x, y]) => {
        sumX += x;
        sumY += y;
        sumXY += x * y;
        sumXX += x * x;
    });

    const denominator = count * sumXX - sumX * sumX;
    const slope = denominator === 0 ? 0 : (count * sumXY - sumX * sumY) / denominator;
    const intercept = count === 0 ? 0 : (sumY - slope * sumX) / count;
    const averageY = count === 0 ? 0 : sumY / count;

    let residual = 0;
    let total = 0;

    points.forEach(([x, y]) => {
        residual += (y - (slope * x + intercept)) ** 2;
        total += (y - averageY) ** 2;
    });

    return {
        slope,
        intercept,
        r2: total === 0 ? 0 : 1 - residual / total,
        predict: x => slope * x + intercept,
    };
}

/** Options for {@link kde}. */
export interface KdeOptions {
    /** Kernel bandwidth; defaults to Silverman's rule of thumb. */
    bandwidth?: number;
}

function gaussianKernel(value: number): number {
    return Math.exp(-0.5 * value * value) / Math.sqrt(2 * Math.PI);
}

function silvermanBandwidth(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const spread = quantileSorted(sorted, 0.75) - quantileSorted(sorted, 0.25);
    const sigma = Math.min(deviation(values), spread / 1.34) || deviation(values) || 1;

    return 0.9 * sigma * values.length ** (-1 / 5);
}

/**
 * Returns a Gaussian kernel density estimator `f(x)` for the values. The bandwidth defaults to
 * Silverman's rule; pass one explicitly for tighter or smoother density curves.
 */
export function kde(values: number[], options?: KdeOptions): (x: number) => number {
    if (!values.length) {
        return () => 0;
    }

    const bandwidth = options?.bandwidth ?? silvermanBandwidth(values) ?? 1;

    return x => {
        const total = values.reduce((sum, value) => sum + gaussianKernel((x - value) / bandwidth), 0);

        return total / (values.length * bandwidth);
    };
}

/** Groups values by a key and reduces each group, returning a `Map` of key → reduced value. */
export function rollup<TValue, TKey, TResult>(
    values: TValue[],
    keyOf: (value: TValue) => TKey,
    reducer: (group: TValue[]) => TResult
): Map<TKey, TResult> {
    const groups = new Map<TKey, TValue[]>();

    values.forEach(value => {
        const key = keyOf(value);
        const group = groups.get(key);

        if (group) {
            group.push(value);
        } else {
            groups.set(key, [value]);
        }
    });

    const result = new Map<TKey, TResult>();

    groups.forEach((group, key) => {
        result.set(key, reducer(group));
    });

    return result;
}
