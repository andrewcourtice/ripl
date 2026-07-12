import type {
    LinearScaleOptions,
} from './_base';

import {
    createScale,
    getLinearScaleMethod,
} from './_base';

import {
    numberNice,
} from '@ripl/utilities';

import type {
    Scale,
} from './types';

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const YEAR = 365 * DAY;

/** A candidate tick interval: a fixed millisecond step, or a calendar month/year step. */
interface TimeInterval {
    kind: 'ms' | 'month' | 'year';
    step: number;
    duration: number;
}

// Calendar-aware tick intervals ordered by duration. Sub-month intervals step by fixed milliseconds;
// month/year steps use calendar arithmetic so they land on real month/year boundaries.
const TIME_INTERVALS: TimeInterval[] = [
    {
        kind: 'ms',
        step: SECOND,
        duration: SECOND,
    },
    {
        kind: 'ms',
        step: 5 * SECOND,
        duration: 5 * SECOND,
    },
    {
        kind: 'ms',
        step: 15 * SECOND,
        duration: 15 * SECOND,
    },
    {
        kind: 'ms',
        step: 30 * SECOND,
        duration: 30 * SECOND,
    },
    {
        kind: 'ms',
        step: MINUTE,
        duration: MINUTE,
    },
    {
        kind: 'ms',
        step: 5 * MINUTE,
        duration: 5 * MINUTE,
    },
    {
        kind: 'ms',
        step: 15 * MINUTE,
        duration: 15 * MINUTE,
    },
    {
        kind: 'ms',
        step: 30 * MINUTE,
        duration: 30 * MINUTE,
    },
    {
        kind: 'ms',
        step: HOUR,
        duration: HOUR,
    },
    {
        kind: 'ms',
        step: 3 * HOUR,
        duration: 3 * HOUR,
    },
    {
        kind: 'ms',
        step: 6 * HOUR,
        duration: 6 * HOUR,
    },
    {
        kind: 'ms',
        step: 12 * HOUR,
        duration: 12 * HOUR,
    },
    {
        kind: 'ms',
        step: DAY,
        duration: DAY,
    },
    {
        kind: 'ms',
        step: 2 * DAY,
        duration: 2 * DAY,
    },
    {
        kind: 'ms',
        step: WEEK,
        duration: WEEK,
    },
    {
        kind: 'month',
        step: 1,
        duration: 30 * DAY,
    },
    {
        kind: 'month',
        step: 3,
        duration: 91 * DAY,
    },
    {
        kind: 'year',
        step: 1,
        duration: YEAR,
    },
];

/** Picks the interval whose duration is closest (by log-ratio) to the desired spacing between ticks. */
function pickTimeInterval(target: number): TimeInterval {
    if (target >= YEAR) {
        return {
            kind: 'year',
            step: Math.max(1, numberNice(target / YEAR, true)),
            duration: target,
        };
    }

    let best = TIME_INTERVALS[0];
    let bestError = Infinity;

    for (const interval of TIME_INTERVALS) {
        const error = Math.abs(Math.log(interval.duration / target));

        if (error < bestError) {
            bestError = error;
            best = interval;
        }
    }

    return best;
}

/** Generates calendar-aligned tick dates spanning `[min, max]` at roughly `count` ticks. */
export function getTimeTicks(min: number, max: number, count: number = 10): Date[] {
    if (!(max > min)) {
        return [new Date(min)];
    }

    const interval = pickTimeInterval((max - min) / Math.max(1, count));
    const ticks: Date[] = [];

    if (interval.kind === 'year') {
        const startYear = Math.floor(new Date(min).getFullYear() / interval.step) * interval.step;

        for (let date = new Date(startYear, 0, 1); date.getTime() <= max; date = new Date(date.getFullYear() + interval.step, 0, 1)) {
            if (date.getTime() >= min) {
                ticks.push(date);
            }
        }
    } else if (interval.kind === 'month') {
        const start = new Date(min);
        const startMonth = Math.floor(start.getMonth() / interval.step) * interval.step;

        for (let month = startMonth, date = new Date(start.getFullYear(), month, 1); date.getTime() <= max; month += interval.step, date = new Date(start.getFullYear(), month, 1)) {
            if (date.getTime() >= min) {
                ticks.push(date);
            }
        }
    } else {
        const dayStart = new Date(min);
        dayStart.setHours(0, 0, 0, 0);

        let time = dayStart.getTime();

        if (time < min) {
            time += Math.ceil((min - time) / interval.step) * interval.step;
        }

        for (; time <= max; time += interval.step) {
            ticks.push(new Date(time));
        }
    }

    return ticks.length ? ticks : [new Date(min), new Date(max)];
}

/** Creates a time scale that maps a `Date` domain to a numeric range using linear interpolation of timestamps. */
export function scaleTime(
    domain: Date[],
    range: number[],
    options?: LinearScaleOptions
): Scale<Date, number> {
    const numericDomain = domain.map(date => date.getTime());
    const convert = getLinearScaleMethod(numericDomain, range, options);
    const invert = getLinearScaleMethod(range, numericDomain, options);

    return createScale({
        domain,
        range,
        convert: value => convert(value.getTime()),
        invert: value => new Date(invert(value)),
        includes: value => {
            const time = value.getTime();
            return time >= numericDomain[0] && time <= numericDomain[1];
        },
        ticks: (count: number = 10) => getTimeTicks(numericDomain[0], numericDomain[1], count),
    });
}
