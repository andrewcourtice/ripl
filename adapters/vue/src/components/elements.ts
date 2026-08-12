import {
    defineRiplElement,
} from '../core/define-element';

import {
    ELEMENT_STATE_KEYS,
} from '../core/props';

import type {
    RiplComponent,
    RiplElementProps,
} from '../types';

import {
    createArc,
    createCircle,
    createEllipse,
    createGroup,
    createImage,
    createLine,
    createPath,
    createPolygon,
    createPolyline,
    createRect,
    createText,
} from '@ripl/web';

import type {
    ArcState,
    BaseElementState,
    CircleState,
    Element,
    EllipseState,
    GroupOptions,
    ImageState,
    LineState,
    PathState,
    PolygonState,
    PolylineState,
    RectState,
    Shape2DOptions,
    TextState,
} from '@ripl/web';

/**
 * Groups its children, cascading its own state to them and transforming them as a unit.
 *
 * @example
 * <ripl-group fill="#f00" :translate-x="20">
 *     <ripl-circle :cx="10" :cy="10" :radius="5"/>
 * </ripl-group>
 */
export const RiplGroup = defineRiplElement({
    name: 'RiplGroup',
    stateKeys: [],
    container: true,
    create: options => createGroup(options as unknown as GroupOptions) as unknown as Element,
}) as unknown as RiplComponent<RiplElementProps<BaseElementState>>;

/** An arc or annular segment, the building block of pie, donut and gauge shapes. */
export const RiplArc = defineRiplElement({
    name: 'RiplArc',
    stateKeys: ELEMENT_STATE_KEYS.arc,
    create: options => createArc(options as unknown as Shape2DOptions<ArcState>) as unknown as Element,
}) as unknown as RiplComponent<RiplElementProps<ArcState>>;

/** A circle rendered at a center point with a given radius. */
export const RiplCircle = defineRiplElement({
    name: 'RiplCircle',
    stateKeys: ELEMENT_STATE_KEYS.circle,
    create: options => createCircle(options as unknown as Shape2DOptions<CircleState>) as unknown as Element,
}) as unknown as RiplComponent<RiplElementProps<CircleState>>;

/** An ellipse, optionally drawn as a partial sweep between two angles. */
export const RiplEllipse = defineRiplElement({
    name: 'RiplEllipse',
    stateKeys: ELEMENT_STATE_KEYS.ellipse,
    create: options => createEllipse(options as unknown as Shape2DOptions<EllipseState>) as unknown as Element,
}) as unknown as RiplComponent<RiplElementProps<EllipseState>>;

/** A bitmap drawn from any canvas image source. */
export const RiplImage = defineRiplElement({
    name: 'RiplImage',
    stateKeys: ELEMENT_STATE_KEYS.image,
    create: options => createImage(options as unknown as Shape2DOptions<ImageState>) as unknown as Element,
}) as unknown as RiplComponent<RiplElementProps<ImageState>>;

/** A straight line between two points. */
export const RiplLine = defineRiplElement({
    name: 'RiplLine',
    stateKeys: ELEMENT_STATE_KEYS.line,
    create: options => createLine(options as unknown as Shape2DOptions<LineState>) as unknown as Element,
}) as unknown as RiplComponent<RiplElementProps<LineState>>;

/** A shape drawn by a custom path renderer within a bounding box. */
export const RiplPath = defineRiplElement({
    name: 'RiplPath',
    stateKeys: ELEMENT_STATE_KEYS.path,
    create: options => createPath(options as unknown as Shape2DOptions<PathState>) as unknown as Element,
}) as unknown as RiplComponent<RiplElementProps<PathState>>;

/** A regular polygon with a given number of sides. */
export const RiplPolygon = defineRiplElement({
    name: 'RiplPolygon',
    stateKeys: ELEMENT_STATE_KEYS.polygon,
    create: options => createPolygon(options as unknown as Shape2DOptions<PolygonState>) as unknown as Element,
}) as unknown as RiplComponent<RiplElementProps<PolygonState>>;

/** A multi-segment line through a list of points. */
export const RiplPolyline = defineRiplElement({
    name: 'RiplPolyline',
    stateKeys: ELEMENT_STATE_KEYS.polyline,
    create: options => createPolyline(options as unknown as Shape2DOptions<PolylineState>) as unknown as Element,
}) as unknown as RiplComponent<RiplElementProps<PolylineState>>;

/** A rectangle, optionally with rounded corners. */
export const RiplRect = defineRiplElement({
    name: 'RiplRect',
    stateKeys: ELEMENT_STATE_KEYS.rect,
    create: options => createRect(options as unknown as Shape2DOptions<RectState>) as unknown as Element,
}) as unknown as RiplComponent<RiplElementProps<RectState>>;

/** A run of text, optionally laid out along an SVG path. */
export const RiplText = defineRiplElement({
    name: 'RiplText',
    stateKeys: ELEMENT_STATE_KEYS.text,
    create: options => createText(options as unknown as Shape2DOptions<TextState>) as unknown as Element,
}) as unknown as RiplComponent<RiplElementProps<TextState>>;
