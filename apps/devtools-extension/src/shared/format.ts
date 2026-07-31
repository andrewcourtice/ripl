import type {
    SerializedProperty,
} from '@ripl/devtools';

import {
    typeIsArray,
    typeIsNumber,
} from '@ripl/utilities';

const MAX_DECIMALS = 3;

/** Formats a number for display, trimming to at most 3 decimal places without trailing zeros. */
export function formatNumber(value: number): string {
    if (Number.isInteger(value)) {
        return value.toString();
    }

    return Number.parseFloat(value.toFixed(MAX_DECIMALS)).toString();
}

/** Formats a serialized property value as a short display string based on its wire type. */
export function formatPropertyValue(property: SerializedProperty): string {
    if (property.valueType === 'number' && typeIsNumber(property.value)) {
        return formatNumber(property.value);
    }

    if (property.valueType === 'number-array') {
        return typeIsArray(property.value)
            ? property.value.map(formatNumber).join(', ')
            : '';
    }

    if (property.valueType === 'opaque') {
        return property.preview ?? '…';
    }

    return String(property.value ?? '');
}
