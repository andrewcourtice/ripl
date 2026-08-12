import {
    afterEach,
    beforeEach,
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import {
    mockCanvasContext,
    polyfillPath2D,
} from '@ripl/test-utils';

import type {
    Group,
    Scene,
} from '@ripl/web';

import {
    RiplCircle,
    RiplContext,
    RiplRenderer,
    RiplScene,
    RiplTransition,
    useRiplScene,
} from '@ripl/vue';

import {
    mount,
} from '@vue/test-utils';

import {
    defineComponent,
    h,
    nextTick,
    ref,
} from 'vue';

/** Reads the ids of a group's children in paint order. */
function childIds(group: Group | undefined): string[] {
    return (group?.children ?? []).map(element => element.id);
}

/**
 * Mounts a tree whose scene is captured for assertions. The probe is rendered first so its `setup`
 * runs before the elements under test, mirroring how a consumer would read the scene.
 */
function mountScene(children: () => unknown, renderer?: Record<string, unknown>) {
    const captured: { scene?: Scene } = {};

    const Probe = defineComponent({
        setup() {
            captured.scene = useRiplScene().value;
            return () => null;
        },
    });

    const Harness = defineComponent({
        setup() {
            return () => h(RiplContext, null, {
                default: () => h(RiplScene, null, {
                    default: () => [
                        h(Probe),
                        renderer
                            ? h(RiplRenderer, renderer, {
                                default: () => children(),
                            })
                            : children(),
                    ],
                }),
            });
        },
    });

    return {
        captured,
        wrapper: mount(Harness),
    };
}

describe('@ripl/vue behaviour', () => {

    beforeEach(() => {
        mockCanvasContext();
        polyfillPath2D();
    });

    afterEach(() => vi.restoreAllMocks());

    describe('Ordering', () => {

        test('Should re-order a group when a keyed v-for reorders without remounting', async () => {
            const items = ref([
                'a',
                'b',
                'c',
            ]);

            const {
                captured,
                wrapper,
            } = mountScene(() => items.value.map(id => h(RiplCircle, {
                key: id,
                id,
                cx: 1,
                cy: 1,
                radius: 1,
            })));

            expect(childIds(captured.scene)).toEqual([
                'a',
                'b',
                'c',
            ]);

            items.value = [
                'c',
                'a',
                'b',
            ];

            await nextTick();
            await vi.waitFor(() => expect(childIds(captured.scene)).toEqual([
                'c',
                'a',
                'b',
            ]));

            wrapper.unmount();
        });

    });

    describe('Events', () => {

        test('Should subscribe only to events a listener is bound to', () => {
            const onClick = vi.fn();

            const {
                captured,
                wrapper,
            } = mountScene(() => h(RiplCircle, {
                id: 'a',
                cx: 1,
                cy: 1,
                radius: 1,
                onClick,
            }));

            const circle = captured.scene?.getElementById('a');

            expect(circle?.has('click')).toBe(true);
            expect(circle?.has('mousemove')).toBe(false);

            wrapper.unmount();
        });

        test('Should forward an event payload to its Vue listener', () => {
            const onClick = vi.fn();

            const {
                captured,
                wrapper,
            } = mountScene(() => h(RiplCircle, {
                id: 'a',
                cx: 1,
                cy: 1,
                radius: 1,
                onClick,
            }));

            captured.scene?.getElementById('a')?.emit('click', {
                x: 3,
                y: 4,
            });

            expect(onClick).toHaveBeenCalledTimes(1);
            expect(onClick.mock.calls[0][0]).toEqual({
                x: 3,
                y: 4,
            });

            wrapper.unmount();
        });

    });

    describe('Transitions', () => {

        test('Should apply the enter state to a new element straight away', () => {
            const {
                captured,
                wrapper,
            } = mountScene(() => h(RiplTransition, {
                enter: {
                    duration: 5000,
                    state: {
                        opacity: 0,
                    },
                },
            }, {
                default: () => h(RiplCircle, {
                    id: 'a',
                    cx: 1,
                    cy: 1,
                    radius: 1,
                }),
            }), {
                autoStop: false,
            });

            expect(captured.scene?.getElementById('a')?.$state.opacity).toBe(0);

            wrapper.unmount();
        });

        test('Should skip the enter phase on the initial mount when appear is false', () => {
            const {
                captured,
                wrapper,
            } = mountScene(() => h(RiplTransition, {
                appear: false,
                enter: {
                    duration: 5000,
                    state: {
                        opacity: 0,
                    },
                },
            }, {
                default: () => h(RiplCircle, {
                    id: 'a',
                    cx: 1,
                    cy: 1,
                    radius: 1,
                }),
            }), {
                autoStop: false,
            });

            expect(captured.scene?.getElementById('a')?.$state.opacity).toBeUndefined();

            wrapper.unmount();
        });

        test('Should keep a leaving element in the graph until its transition finishes', async () => {
            const visible = ref(true);

            const {
                captured,
                wrapper,
            } = mountScene(() => h(RiplTransition, {
                leave: {
                    duration: 40,
                    state: {
                        opacity: 0,
                    },
                },
            }, {
                default: () => visible.value
                    ? h(RiplCircle, {
                        id: 'a',
                        cx: 1,
                        cy: 1,
                        radius: 1,
                        opacity: 1,
                    })
                    : null,
            }), {
                autoStop: false,
            });

            visible.value = false;
            await nextTick();

            // Retagged so a key re-entering mid-fade cannot collide with the element still leaving.
            expect(childIds(captured.scene)[0]).toMatch(/^a:leave:/);

            await vi.waitFor(() => expect(childIds(captured.scene)).toEqual([]), {
                timeout: 3000,
            });

            wrapper.unmount();
        });

        test('Should not hold a leaving element when the whole tree is being destroyed', async () => {
            const {
                captured,
                wrapper,
            } = mountScene(() => h(RiplTransition, {
                leave: {
                    duration: 5000,
                    state: {
                        opacity: 0,
                    },
                },
            }, {
                default: () => h(RiplCircle, {
                    id: 'a',
                    cx: 1,
                    cy: 1,
                    radius: 1,
                    opacity: 1,
                }),
            }), {
                autoStop: false,
            });

            const scene = captured.scene;

            wrapper.unmount();
            await nextTick();

            expect(childIds(scene)).toEqual([]);
        });

    });

});
