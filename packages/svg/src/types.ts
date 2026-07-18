import type {
    ContextElement,
} from '@ripl/core';

import type {
    GetMutableKeys,
} from '@ripl/utilities';

/** The mutable subset of `CSSStyleDeclaration` properties that can be assigned as inline SVG element styles. */
export type Styles = {
    [TKey in GetMutableKeys<CSSStyleDeclaration>]: CSSStyleDeclaration[TKey];
};

/** Definition for an SVG context element, describing its tag, inline styles, and attributes. */
export interface SVGContextElementDefinition {
    /** The SVG element tag name to create. */
    tag: keyof SVGElementTagNameMap;
    /** Inline styles applied to the element. */
    styles: Partial<Styles>;
    /** Attributes set on the element. */
    attributes: Record<string, string>;
    /** Optional text content rendered inside the element. */
    textContent?: string;
}

/** An SVG-specific context element carrying its rendering definition. */
export interface SVGContextElement extends ContextElement {
    /** The rendering definition describing how to build this element's SVG node. */
    definition: SVGContextElementDefinition;
}
