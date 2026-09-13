import {
    RIPL_CONTEXT,
    RIPL_ELEMENT,
    RIPL_PARENT,
    RIPL_SCENE,
    RIPL_TREE,
} from '../core/contexts';

import {
    CLASS_KEY,
    ELEMENT_OPTION_KEYS,
    readElementSnapshot,
} from '../core/props';

import {
    useElementProps,
} from '../core/use-element-props';

import {
    useForwardedEvents,
} from '../core/use-forwarded-events';

import {
    useRiplResource,
} from '../core/use-ripl-instance';

import type {
    RiplElementOptionProps,
} from '../types';

import {
    applyFields,
    applyState,
    BASE_STATE_KEYS,
    CONSTRUCTION_ONLY_KEYS,
    SHAPE_FIELDS,
} from '@ripl/adapters';

import type {
    RiplElementListeners,
    RiplWritable,
} from '@ripl/adapters';

import {
    createScene,
    factory,
} from '@ripl/web';

import type {
    BaseElementState,
    Scene,
} from '@ripl/web';

import {
    createElement,
    forwardRef,
    useContext,
    useImperativeHandle,
    useRef,
} from 'react';

import type {
    PropsWithChildren,
} from 'react';

const PROP_KEYS = [
    'renderOnResize',
    ...ELEMENT_OPTION_KEYS,
    ...BASE_STATE_KEYS,
];

const STATE_KEYS = new Set<string>(BASE_STATE_KEYS);

const SYNC_KEYS = PROP_KEYS.filter(key => !CONSTRUCTION_ONLY_KEYS.has(key));

/** Props accepted by {@link RiplScene}. */
export interface RiplSceneProps extends Partial<BaseElementState>, RiplElementOptionProps, RiplElementListeners {
    /** Whether the scene re-renders automatically when its context is resized. Defaults to `true`. */
    renderOnResize?: boolean;
}

/**
 * Creates a scene bound to the enclosing context and parents its subtree to it.
 *
 * A scene hoists the element tree into a flat instruction stream, so it is what makes z-ordering,
 * group clipping and large graphs efficient. State props set here cascade to every descendant that
 * does not set its own — `<RiplScene fill="#333">` gives the whole tree a default fill.
 *
 * @example
 * <RiplContext>
 *     <RiplScene fill="#333">
 *         <RiplCircle cx={50} cy={50} radius={20}/>
 *     </RiplScene>
 * </RiplContext>
 */
export const RiplScene = forwardRef<Scene, PropsWithChildren<RiplSceneProps>>((props, ref) => {
    const tree = useContext(RIPL_TREE);
    const context = useContext(RIPL_CONTEXT);
    const applied = useRef<RiplWritable>({});

    const scene = useRiplResource<Scene>(() => {
        if (!context) {
            return undefined;
        }

        const snapshot = readElementSnapshot(props as RiplWritable, PROP_KEYS);
        const created = createScene(context, snapshot.options);

        applied.current = snapshot.applied;

        if (tree) {
            tree.scene = created;
        }

        // The scene seeds its font from the host's computed style, which resolves to nothing while
        // the host is still detached, so re-read it once the context component attaches.
        tree?.onAttached(() => {
            if (snapshot.applied.font !== undefined) {
                return;
            }

            const font = factory.getComputedStyle?.(context.element)?.font;

            if (font) {
                created.font = font;
            }
        });

        return {
            value: created,
            destroy: () => {
                // `false`: the context component owns the context and destroys it itself.
                created.destroy(false);

                if (tree) {
                    tree.scene = undefined;
                }
            },
        };
    }, [context, tree]);

    useImperativeHandle(ref, () => scene as Scene, [scene]);
    useForwardedEvents(scene, props);

    useElementProps(scene, props as RiplWritable, {
        syncKeys: SYNC_KEYS,
        stateKeys: STATE_KEYS,
        paintedKeys: SHAPE_FIELDS,
        applied: applied.current,
        apply: (target, { state, fields }) => {
            applyFields(target, fields, undefined, CLASS_KEY);
            applyState(target, state);
            tree?.requestPaint();
        },
    });

    const parented = createElement(RIPL_PARENT.Provider, {
        value: scene,
    }, createElement(RIPL_ELEMENT.Provider, {
        value: scene,
    }, props.children));

    return createElement(RIPL_SCENE.Provider, {
        value: scene,
    }, scene ? parented : null);
});

RiplScene.displayName = 'RiplScene';
