import {
    typeIsDate,
} from './type';

/** Options for {@link timeFormat}: any `Intl.DateTimeFormat` option plus a locale. */
export interface TimeFormatOptions extends Intl.DateTimeFormatOptions {
    /** BCP 47 locale tag (defaults to the runtime locale). */
    locale?: string;
}

const DEFAULT_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
};

const DATE_FORMATTER_CACHE = new Map<string, Intl.DateTimeFormat>();

function getDateFormatter(locale: string | undefined, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
    const key = `${locale ?? ''}|${JSON.stringify(options)}`;

    let formatter = DATE_FORMATTER_CACHE.get(key);

    if (!formatter) {
        formatter = new Intl.DateTimeFormat(locale, options);
        DATE_FORMATTER_CACHE.set(key, formatter);
    }

    return formatter;
}

/**
 * Formats a `Date` (or epoch millisecond value) as a locale-aware string via `Intl.DateTimeFormat`.
 * With no field options a short year/month/day format is used. Passed values explicitly by axes and
 * tooltips; never bound to a scale.
 */
export function timeFormat(value: Date | number, options: TimeFormatOptions = {}): string {
    const date = typeIsDate(value) ? value : new Date(value);

    const {
        locale,
        ...intlOptions
    } = options;

    const resolved = Object.keys(intlOptions).length ? intlOptions : DEFAULT_DATE_OPTIONS;

    return getDateFormatter(locale, resolved).format(date);
}
