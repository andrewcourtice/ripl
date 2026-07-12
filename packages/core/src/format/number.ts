import {
    typeIsNumber,
} from '@ripl/utilities';

/** Options for {@link formatNumber}: any `Intl.NumberFormat` option plus a locale and a precision shorthand. */
export interface NumberFormatOptions extends Intl.NumberFormatOptions {
    /** BCP 47 locale tag (defaults to the runtime locale). */
    locale?: string;
    /** Shorthand for `maximumFractionDigits`. */
    precision?: number;
}

// `Intl.NumberFormat` construction is comparatively expensive, so memoise formatters by their config.
// The number of distinct configs in an application is small and bounded by usage.
const FORMATTER_CACHE = new Map<string, Intl.NumberFormat>();

function getNumberFormatter(locale: string | undefined, options: Intl.NumberFormatOptions): Intl.NumberFormat {
    const key = `${locale ?? ''}|${JSON.stringify(options)}`;

    let formatter = FORMATTER_CACHE.get(key);

    if (!formatter) {
        formatter = new Intl.NumberFormat(locale, options);
        FORMATTER_CACHE.set(key, formatter);
    }

    return formatter;
}

/**
 * Formats a number as a locale-aware string. Supports decimal, `percent`, and `currency` styles;
 * `compact`/`scientific`/`engineering` notation; grouping; and fraction-digit control (with
 * `precision` as a shorthand for `maximumFractionDigits`). Non-numeric values fall back to `String`.
 *
 * This is a standalone utility — it is passed values explicitly by axes, legends, and tooltips, and
 * is intentionally never bound to a scale.
 */
export function formatNumber(value: unknown, options: NumberFormatOptions = {}): string {
    if (!typeIsNumber(value)) {
        return String(value);
    }

    const {
        locale,
        precision,
        ...intlOptions
    } = options;

    if (precision !== undefined && intlOptions.maximumFractionDigits === undefined) {
        intlOptions.maximumFractionDigits = precision;
    }

    return getNumberFormatter(locale, intlOptions).format(value);
}
