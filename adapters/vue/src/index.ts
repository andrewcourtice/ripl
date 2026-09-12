export * from './components/context';
export * from './components/elements';
export * from './components/renderer';
export * from './components/scene';
export * from './components/transition';
export * from './compositions';
export * from './plugin';
export * from './types';

export {
    defineRiplElement,
    elementFactory,
} from './core/define-element';

export type { RiplNodeDefinition } from './core/define-element';

export { RiplTransitionScope } from './core/transition';

export type {
    RiplElementState,
    RiplTransitionPhase,
    RiplTransitionPhaseName,
    RiplTransitionPhaseOptions,
    RiplTransitionPhases,
} from './core/transition';

// The building blocks a sibling adapter (`@ripl/vue-3d`, `@ripl/vue-charts`) needs to wrap a Ripl
// object the same way this package does. Exported deliberately; see the README's Extending section.

export {
    RIPL_CONTEXT,
    RIPL_ELEMENT,
    RIPL_PARENT,
    RIPL_RENDERER,
    RIPL_SCENE,
    RIPL_TRANSITION,
    RIPL_TREE,
} from './core/injection';

export {
    createRiplTree,
    RiplTree,
} from './core/tree';

export {
    ANY_PROP,
    BASE_STATE_KEYS,
    BOOLEAN_PROP,
    CONSTRUCTION_ONLY_KEYS,
    createProps,
    ELEMENT_OPTION_KEYS,
    ELEMENT_STATE_KEYS,
    NUMBER_PROP,
    SHAPE_FIELD_KEYS,
    SHAPE_FIELDS,
} from './core/props';

export {
    applyFields,
    applyState,
    collectChangedProps,
    partitionProps,
    readBoundProps,
    resolveClassNames,
} from './core/state';

export type {
    RiplFieldWriters,
    RiplPropPartition,
    RiplWritable,
} from './core/state';

export {
    CONTEXT_EVENTS,
    ELEMENT_EVENTS,
    RENDERER_EVENTS,
    useForwardedEvents,
} from './core/events';

export { useExposedInstance } from './core/expose';

export { registerComponents } from './core/register';

export { useElementProps } from './core/use-element-props';

export type { RiplElementPropsOptions } from './core/use-element-props';
