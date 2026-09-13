export * from './components/context';
export * from './components/elements';
export * from './components/renderer';
export * from './components/scene';
export * from './components/transition';
export * from './hooks';
export * from './types';

export { defineRiplElement } from './core/define-element';

export {
    RIPL_CONTEXT,
    RIPL_ELEMENT,
    RIPL_PARENT,
    RIPL_RENDERER,
    RIPL_SCENE,
    RIPL_TRANSITION,
    RIPL_TREE,
} from './core/contexts';

export {
    CLASS_KEY,
    ELEMENT_OPTION_KEYS,
    readElementSnapshot,
} from './core/props';

export type { RiplElementSnapshot } from './core/props';

export { useElementProps } from './core/use-element-props';

export type { RiplElementPropsOptions } from './core/use-element-props';

export { useElementTransition } from './core/use-element-transition';

export { useForwardedEvents } from './core/use-forwarded-events';

export {
    useRiplInstance,
    useRiplLazy,
    useRiplResource,
} from './core/use-ripl-instance';

export type {
    RiplInstanceHandle,
    RiplResource,
} from './core/use-ripl-instance';

// The building blocks a sibling adapter (`@ripl/react-3d`, `@ripl/react-charts`) needs to wrap a
// Ripl object the same way this package does. Their implementations live in `@ripl/adapters`,
// shared with the Vue adapters; they are re-exported here so one import covers a whole adapter.

export {
    applyFields,
    applyState,
    BASE_STATE_KEYS,
    collectChangedProps,
    CONSTRUCTION_ONLY_KEYS,
    CONTEXT_EVENTS,
    createRiplTree,
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
