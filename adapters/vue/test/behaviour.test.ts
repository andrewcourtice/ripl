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
    Circle,
    Context,
    Group,
    Renderer,
    Scene,
} from '@ripl/web';

import {
    Task,
} from '@ripl/web';

import {
    RiplCircle,
    RiplContext,
    RiplGroup,
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
    shallowRef,
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


/**
 * Mounts a transition around a single circle, handing back the renderer and the circle themselves
 * so a test can watch a transition run rather than infer it from the graph.
 */
function mountTransition(phases: Record<string, unknown>, props: Record<string, unknown> = {}) {
    const renderer = shallowRef<Renderer>();
    const circle = shallowRef<Circle>();
    const cx = ref(1);

    const Harness = defineComponent({
        setup() {
            return () => h(RiplContext, null, {
                default: () => h(RiplScene, null, {
                    default: () => h(RiplRenderer, {
                        ref: renderer,
                        autoStop: false,
                    }, {
                        default: () => h(RiplTransition, phases, {
                            default: () => h(RiplCircle, {
                                ref: circle,
                                id: 'a',
                                cy: 1,
                                radius: 1,
                                cx: cx.value,
                                ...props,
                            }),
                        }),
                    }),
                }),
            });
        },
    });

    return {
        circle,
        cx,
        renderer,
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

    describe('Looping transitions', () => {

        test('Should keep a looping transition running past its duration', async () => {
            const {
                renderer,
                wrapper,
            } = mountTransition({
                enter: {
                    duration: 20,
                    loop: true,
                    state: {
                        opacity: 0,
                    },
                },
            }, {
                opacity: 1,
            });

            await new Promise(resolve => setTimeout(resolve, 150));

            expect(renderer.value?.isBusy).toBe(true);

            wrapper.unmount();
        });

        test('Should settle a transition that does not loop', async () => {
            const {
                renderer,
                wrapper,
            } = mountTransition({
                enter: {
                    duration: 20,
                    state: {
                        opacity: 0,
                    },
                },
            }, {
                opacity: 1,
            });

            await vi.waitFor(() => expect(renderer.value?.isBusy).toBe(false), {
                timeout: 3000,
            });

            wrapper.unmount();
        });

        test('Should reverse an alternating transition on its second cycle', async () => {
            const {
                circle,
                wrapper,
            } = mountTransition({
                enter: {
                    duration: 60,
                    loop: 'alternate',
                    state: {
                        opacity: 0,
                    },
                },
            }, {
                opacity: 1,
            });

            await vi.waitFor(() => expect(circle.value?.opacity).toBeGreaterThan(0.9), {
                timeout: 3000,
            });

            await vi.waitFor(() => expect(circle.value?.opacity).toBeLessThan(0.5), {
                timeout: 3000,
            });

            wrapper.unmount();
        });

        // A looping leave would never resolve, so the element would animate forever instead of
        // being destroyed; `loop` is dropped from the phase that owns the element's destruction.
        test('Should still destroy a leaving element whose phase asks to loop', async () => {
            const visible = ref(true);

            const {
                captured,
                wrapper,
            } = mountScene(() => h(RiplTransition, {
                leave: {
                    duration: 30,
                    loop: true,
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

            await vi.waitFor(() => expect(childIds(captured.scene)).toEqual([]), {
                timeout: 3000,
            });

            wrapper.unmount();
        });

        // A looping entry is never evicted by the renderer, so an element that leaves without
        // aborting it would keep the loop busy and the animation frame alive forever.
        test('Should release a looping transition when its element leaves', async () => {
            const visible = ref(true);
            const renderer = shallowRef<Renderer>();

            const Harness = defineComponent({
                setup() {
                    return () => h(RiplContext, null, {
                        default: () => h(RiplScene, null, {
                            default: () => h(RiplRenderer, {
                                ref: renderer,
                                autoStop: false,
                            }, {
                                default: () => h(RiplTransition, {
                                    enter: {
                                        duration: 5000,
                                        loop: true,
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
                                }),
                            }),
                        }),
                    });
                },
            });

            const wrapper = mount(Harness);

            await vi.waitFor(() => expect(renderer.value?.isBusy).toBe(true), {
                timeout: 3000,
            });

            visible.value = false;
            await nextTick();

            expect(renderer.value?.isBusy).toBe(false);

            wrapper.unmount();
        });

        test('Should replace a looping transition rather than stack another on the element', async () => {
            const abort = vi.spyOn(Task.prototype, 'abort');

            const {
                cx,
                wrapper,
            } = mountTransition({
                update: {
                    duration: 5000,
                    loop: true,
                },
            });

            cx.value = 2;
            await nextTick();

            expect(abort).not.toHaveBeenCalled();

            cx.value = 3;
            await nextTick();

            expect(abort).toHaveBeenCalledTimes(1);

            cx.value = 4;
            await nextTick();

            expect(abort).toHaveBeenCalledTimes(2);

            wrapper.unmount();
        });

    });

    describe('Instance refs', () => {

        test('Should resolve a ref on each component to the Ripl object it wraps', () => {
            const context = shallowRef<Context>();
            const scene = shallowRef<Scene>();
            const renderer = shallowRef<Renderer>();
            const circle = shallowRef<Circle>();

            const Harness = defineComponent({
                setup() {
                    return () => h(RiplContext, {
                        ref: context,
                    }, {
                        default: () => h(RiplScene, {
                            ref: scene,
                        }, {
                            default: () => h(RiplRenderer, {
                                ref: renderer,
                                autoStart: false,
                            }, {
                                default: () => h(RiplCircle, {
                                    ref: circle,
                                    id: 'a',
                                    cx: 5,
                                    cy: 6,
                                    radius: 7,
                                }),
                            }),
                        }),
                    });
                },
            });

            const wrapper = mount(Harness);

            expect(context.value?.element).toBeInstanceOf(HTMLElement);
            expect(scene.value?.getElementById('a')).toBeDefined();
            expect(renderer.value?.isBusy).toBe(false);
            expect(circle.value?.cx).toBe(5);
            expect(circle.value?.radius).toBe(7);

            circle.value!.radius = 9;

            expect(scene.value?.getElementById('a')?.$state.radius).toBe(9);

            wrapper.unmount();
        });

    });

    describe('Declared events', () => {

        // The forwarded names come from `EventBus.$events`, so an element forwards every event it
        // actually emits — `graph` among them, which a hand-written list had omitted.
        test('Should forward an event the element declares beyond the pointer set', async () => {
            const graph = vi.fn();
            const count = ref(1);

            const {
                wrapper,
            } = mountScene(() => h(RiplGroup, {
                id: 'group',
                onGraph: graph,
            }, {
                default: () => Array.from({ length: count.value }, (_, index) => h(RiplCircle, {
                    key: index,
                    id: `c${index}`,
                    cx: 1,
                    cy: 1,
                    radius: 1,
                })),
            }));

            graph.mockClear();

            count.value = 2;
            await nextTick();

            expect(graph).toHaveBeenCalled();

            wrapper.unmount();
        });

    });

    describe('Staggered enters', () => {

        // Resolved during `setup`, each element saw only the siblings constructed before it, so a
        // `delay: index / length` stagger compressed towards the end of the set instead of spanning it.
        test('Should resolve a stagger against the whole set on the initial mount', () => {
            const lengths: number[] = [];
            const indices: number[] = [];

            const {
                wrapper,
            } = mountScene(() => h(RiplTransition, {
                enter: (_element: unknown, index: number, length: number) => {
                    indices.push(index);
                    lengths.push(length);

                    return {
                        duration: 10,
                        state: {
                            opacity: 0,
                        },
                    };
                },
            }, {
                default: () => Array.from({ length: 3 }, (_, index) => h(RiplCircle, {
                    key: index,
                    id: `c${index}`,
                    cx: 1,
                    cy: 1,
                    radius: 1,
                })),
            }), {
                autoStop: false,
            });

            expect(lengths).toEqual([3, 3, 3]);
            expect(indices).toEqual([0, 1, 2]);

            wrapper.unmount();
        });

    });

    describe('Class bindings', () => {

        // The construction snapshot held a parsed class list while every later read yielded the raw
        // binding, so the first change of any prop reported `class` as changed and rebuilt the list.
        test('Should not rebuild the class list when an unrelated prop changes', async () => {
            const cx = ref(1);
            const circle = shallowRef<Circle>();

            const Harness = defineComponent({
                setup() {
                    return () => h(RiplContext, null, {
                        default: () => h(RiplScene, null, {
                            default: () => h(RiplCircle, {
                                ref: circle,
                                id: 'a',
                                class: {
                                    active: true,
                                },
                                cx: cx.value,
                                cy: 1,
                                radius: 1,
                            }),
                        }),
                    });
                },
            });

            const wrapper = mount(Harness);
            const clear = vi.spyOn(circle.value!.classList, 'clear');

            cx.value = 2;
            await nextTick();

            expect(clear).not.toHaveBeenCalled();
            expect(circle.value?.classList.has('active')).toBe(true);

            wrapper.unmount();
        });

    });

});
