export * from './components/context';
export * from './components/elements';
export * from './components/renderer';
export * from './components/scene';
export * from './components/transition';
export * from './compositions';
export * from './plugin';
export * from './types';

export { defineRiplElement } from './core/define-element';

// The building blocks a sibling adapter (`@ripl/vue-3d`, `@ripl/vue-charts`) needs to wrap a Ripl
// object the same way this package does. Their implementations live in `@ripl/adapters`, shared
// with the React adapters; they are re-exported here so one import covers a whole adapter.

export {
    applyFields,
    applyState,
    BASE_STATE_KEYS,
    collectChangedProps,
    CONSTRUCTION_ONLY_KEYS,
    CONTEXT_EVENTS,
    ELEMENT_EVENTS,
    ELEMENT_STATE_KEYS,
    elementFactory,
    partitionProps,
    readBoundProps,
    RENDERER_EVENTS,
    resolveClassNames,
    RiplTransitionScope,
    RiplTree,
    SHAPE_FIELD_KEYS,
    SHAPE_FIELDS,
} from '@ripl/adapters';

export type {
    RiplElementState,
    RiplFieldWriters,
    RiplNodeDefinition,
    RiplPropPartition,
    RiplTransitionPhase,
    RiplTransitionPhaseName,
    RiplTransitionPhaseOptions,
    RiplTransitionPhases,
    RiplWritable,
} from '@ripl/adapters';

export {
    RIPL_CONTEXT,
    RIPL_ELEMENT,
    RIPL_PARENT,
    RIPL_RENDERER,
    RIPL_SCENE,
    RIPL_TRANSITION,
    RIPL_TREE,
} from './core/injection';

export { createRiplTree } from './core/tree';

export {
    ANY_PROP,
    BOOLEAN_PROP,
    createProps,
    ELEMENT_OPTION_KEYS,
    NUMBER_PROP,
} from './core/props';

export { useForwardedEvents } from './core/events';

export { useExposedInstance } from './core/expose';

export { registerComponents } from './core/register';

export { useElementProps } from './core/use-element-props';

export type { RiplElementPropsOptions } from './core/use-element-props';
