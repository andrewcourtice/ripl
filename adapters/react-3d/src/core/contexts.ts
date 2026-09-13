import type {
    Camera,
    Context3D,
} from '@ripl/3d';

import {
    createContext,
} from 'react';

import type {
    Context as ReactContext,
} from 'react';

/** The registry holding every Ripl React context, keyed by name. */
type RiplContextRegistry = Record<string, unknown>;

/** Hands the camera a `<RiplCamera>` built up to the context component that owns the slot. */
export type RiplCameraSlot = (camera: Camera | undefined) => void;

// Registry-keyed for the same reason `@ripl/react` uses them: the standalone IIFE builds inline
// their workspace dependencies, so a page loading two adapters holds two sets of unequal contexts.
const REGISTRY = ((globalThis as Record<PropertyKey, unknown>)[Symbol.for('ripl.react.contexts')] ??= {}) as RiplContextRegistry;

function registerContext<TValue>(name: string): ReactContext<TValue | undefined> {
    return (REGISTRY[name] ??= createContext<TValue | undefined>(undefined)) as ReactContext<TValue | undefined>;
}

/** Context carrying the 3D rendering context the subtree draws to. */
export const RIPL_CONTEXT_3D: ReactContext<Context3D | undefined> = registerContext<Context3D>('ripl.react3d.context');

/** Context carrying the camera viewing the enclosing 3D context. */
export const RIPL_CAMERA: ReactContext<Camera | undefined> = registerContext<Camera>('ripl.react3d.camera');

/**
 * Context carrying the setter a camera component reports itself through.
 *
 * A camera belongs to the context rather than to the scene graph, so the subtree it is declared in
 * must not decide who can reach it: the context component holds the state and hands down the way to
 * fill it, rather than the camera providing itself to its own descendants only.
 */
export const RIPL_CAMERA_SLOT: ReactContext<RiplCameraSlot | undefined> = registerContext<RiplCameraSlot>('ripl.react3d.camera-slot');
