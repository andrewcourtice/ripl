import type {
    Ease,
} from '@ripl/core';

import {
    easeInCubic,
    easeInOutCubic,
    easeInOutQuad,
    easeInOutQuart,
    easeInOutQuint,
    easeInQuad,
    easeInQuart,
    easeInQuint,
    easeLinear,
    easeOutCubic,
    easeOutQuad,
    easeOutQuart,
    easeOutQuint,
} from '@ripl/core';

const EASE_MAP: Record<string, Ease> = {
    linear: easeLinear,
    easeLinear,
    easeInQuad,
    easeOutQuad,
    easeInOutQuad,
    easeInCubic,
    easeOutCubic,
    easeInOutCubic,
    easeInQuart,
    easeOutQuart,
    easeInOutQuart,
    easeInQuint,
    easeOutQuint,
    easeInOutQuint,
};

export function resolveEase(name: string): Ease {
    return EASE_MAP[name] ?? easeLinear;
}

export const BASE_ELEMENT_PROPS = {
    id: {
        type: String,
        default: undefined,
    },
    class: {
        type: [String, Array],
        default: undefined,
    },
    data: {
        type: null,
        default: undefined,
    },
    pointerEvents: {
        type: String,
        default: undefined,
    },
    fillStyle: {
        type: String,
        default: undefined,
    },
    strokeStyle: {
        type: String,
        default: undefined,
    },
    lineWidth: {
        type: Number,
        default: undefined,
    },
    lineCap: {
        type: String,
        default: undefined,
    },
    lineJoin: {
        type: String,
        default: undefined,
    },
    lineDash: {
        type: Array,
        default: undefined,
    },
    lineDashOffset: {
        type: Number,
        default: undefined,
    },
    globalAlpha: {
        type: Number,
        default: undefined,
    },
    globalCompositeOperation: {
        type: String,
        default: undefined,
    },
    shadowBlur: {
        type: Number,
        default: undefined,
    },
    shadowColor: {
        type: String,
        default: undefined,
    },
    shadowOffsetX: {
        type: Number,
        default: undefined,
    },
    shadowOffsetY: {
        type: Number,
        default: undefined,
    },
    font: {
        type: String,
        default: undefined,
    },
    textAlign: {
        type: String,
        default: undefined,
    },
    textBaseline: {
        type: String,
        default: undefined,
    },
    direction: {
        type: String,
        default: undefined,
    },
    filter: {
        type: String,
        default: undefined,
    },
    miterLimit: {
        type: Number,
        default: undefined,
    },
    zIndex: {
        type: Number,
        default: undefined,
    },
    translateX: {
        type: Number,
        default: undefined,
    },
    translateY: {
        type: Number,
        default: undefined,
    },
    transformScaleX: {
        type: Number,
        default: undefined,
    },
    transformScaleY: {
        type: Number,
        default: undefined,
    },
    rotation: {
        type: [Number, String],
        default: undefined,
    },
    transformOriginX: {
        type: [Number, String],
        default: undefined,
    },
    transformOriginY: {
        type: [Number, String],
        default: undefined,
    },
};

export const BASE_ELEMENT_PROP_KEYS = Object.keys(BASE_ELEMENT_PROPS);
