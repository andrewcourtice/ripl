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
} from '@ripl/web';

import {
    RiplCircle,
    RiplContext,
    RiplGroup,
    RiplRenderer,
    RiplScene,
    useRiplContext,
    useRiplRenderer,
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

describe('@ripl/vue', () => {

    beforeEach(() => {
        mockCanvasContext();
        polyfillPath2D();
    });

    afterEach(() => vi.restoreAllMocks());

    describe('Context tier', () => {

        test('Should create a context and paint elements declared directly under it', () => {
            const captured: ReturnType<typeof useRiplContext>[] = [];

            const Probe = defineComponent({
                setup() {
                    captured.push(useRiplContext());
                    return () => null;
                },
            });

            const wrapper = mount(RiplContext, {
                slots: {
                    default: () => [
                        h(RiplCircle, {
                            id: 'a',
                            cx: 5,
                            cy: 5,
                            radius: 10,
                        }),
                        h(Probe),
                    ],
                },
            });

            expect(captured).toHaveLength(1);
            expect(captured[0].value?.type).toBe('canvas');
            expect(wrapper.find('canvas').exists()).toBe(true);

            wrapper.unmount();
        });

        test('Should resolve the context inside a descendant setup, before any mounted hook', () => {
            const seen: (string | undefined)[] = [];

            const Probe = defineComponent({
                setup() {
                    seen.push(useRiplContext().value?.type);
                    return () => null;
                },
            });

            const wrapper = mount(RiplContext, {
                slots: {
                    default: () => h(RiplScene, null, {
                        default: () => h(RiplRenderer, null, {
                            default: () => h(Probe),
                        }),
                    }),
                },
            });

            expect(seen).toEqual(['canvas']);

            wrapper.unmount();
        });

    });

    describe('Scene and renderer tiers', () => {

        test('Should expose the scene and renderer to descendants', () => {
            let scene: ReturnType<typeof useRiplScene> | undefined;
            let renderer: ReturnType<typeof useRiplRenderer> | undefined;

            const Probe = defineComponent({
                setup() {
                    scene = useRiplScene();
                    renderer = useRiplRenderer();
                    return () => null;
                },
            });

            const wrapper = mount(RiplContext, {
                slots: {
                    default: () => h(RiplScene, null, {
                        default: () => h(RiplRenderer, {
                            autoStart: false,
                        }, {
                            default: () => h(Probe),
                        }),
                    }),
                },
            });

            expect(scene?.value).toBeDefined();
            expect(renderer?.value).toBeDefined();
            expect(scene?.value?.context.type).toBe('canvas');

            wrapper.unmount();
        });

        test('Should parent elements to the scene when one is declared', () => {
            let scene: ReturnType<typeof useRiplScene> | undefined;

            const Probe = defineComponent({
                setup() {
                    scene = useRiplScene();
                    return () => null;
                },
            });

            const wrapper = mount(RiplContext, {
                slots: {
                    default: () => h(RiplScene, null, {
                        default: () => [
                            h(Probe),
                            h(RiplCircle, {
                                id: 'a',
                                cx: 1,
                                cy: 1,
                                radius: 1,
                            }),
                        ],
                    }),
                },
            });

            expect(childIds(scene?.value)).toEqual(['a']);

            wrapper.unmount();
        });

    });

    describe('Graph structure', () => {

        test('Should nest elements under their group in template order', () => {
            let scene: ReturnType<typeof useRiplScene> | undefined;

            const Probe = defineComponent({
                setup() {
                    scene = useRiplScene();
                    return () => null;
                },
            });

            const wrapper = mount(RiplContext, {
                slots: {
                    default: () => h(RiplScene, null, {
                        default: () => [
                            h(Probe),
                            h(RiplGroup, {
                                id: 'group',
                            }, {
                                default: () => [
                                    h(RiplCircle, {
                                        id: 'first',
                                        cx: 0,
                                        cy: 0,
                                        radius: 1,
                                    }),
                                    h(RiplCircle, {
                                        id: 'second',
                                        cx: 0,
                                        cy: 0,
                                        radius: 1,
                                    }),
                                ],
                            }),
                        ],
                    }),
                },
            });

            const group = scene?.value?.getElementById('group') as Group;

            expect(childIds(scene?.value)).toEqual(['group']);
            expect(childIds(group)).toEqual([
                'first',
                'second',
            ]);

            wrapper.unmount();
        });

        test('Should remove an element from the graph when it unmounts', async () => {
            let scene: ReturnType<typeof useRiplScene> | undefined;
            const visible = ref(true);

            const Harness = defineComponent({
                setup() {
                    const Probe = defineComponent({
                        setup() {
                            scene = useRiplScene();
                            return () => null;
                        },
                    });

                    return () => h(RiplContext, null, {
                        default: () => h(RiplScene, null, {
                            default: () => [
                                h(Probe),
                                visible.value
                                    ? h(RiplCircle, {
                                        id: 'a',
                                        cx: 1,
                                        cy: 1,
                                        radius: 1,
                                    })
                                    : null,
                            ],
                        }),
                    });
                },
            });

            const wrapper = mount(Harness);

            expect(childIds(scene?.value)).toEqual(['a']);

            visible.value = false;
            await nextTick();

            expect(childIds(scene?.value)).toEqual([]);

            wrapper.unmount();
        });

    });

    describe('Props', () => {

        test('Should apply bound props to the element and leave unbound props at their Ripl default', () => {
            let scene: ReturnType<typeof useRiplScene> | undefined;

            const Probe = defineComponent({
                setup() {
                    scene = useRiplScene();
                    return () => null;
                },
            });

            const wrapper = mount(RiplContext, {
                slots: {
                    default: () => h(RiplScene, null, {
                        default: () => [
                            h(Probe),
                            h(RiplCircle, {
                                id: 'a',
                                cx: 5,
                                cy: 6,
                                radius: 7,
                                fill: '#ff0000',
                            }),
                        ],
                    }),
                },
            });

            const circle = scene?.value?.getElementById('a');

            expect(circle?.$state.cx).toBe(5);
            expect(circle?.$state.cy).toBe(6);
            expect(circle?.$state.radius).toBe(7);
            expect(circle?.fill).toBe('#ff0000');
            expect(circle?.$state.opacity).toBeUndefined();

            wrapper.unmount();
        });

        test('Should write a changed prop through to the element', async () => {
            let scene: ReturnType<typeof useRiplScene> | undefined;
            const radius = ref(10);

            const Harness = defineComponent({
                setup() {
                    const Probe = defineComponent({
                        setup() {
                            scene = useRiplScene();
                            return () => null;
                        },
                    });

                    return () => h(RiplContext, null, {
                        default: () => h(RiplScene, null, {
                            default: () => [
                                h(Probe),
                                h(RiplCircle, {
                                    id: 'a',
                                    cx: 1,
                                    cy: 1,
                                    radius: radius.value,
                                }),
                            ],
                        }),
                    });
                },
            });

            const wrapper = mount(Harness);

            expect(scene?.value?.getElementById('a')?.$state.radius).toBe(10);

            radius.value = 42;
            await nextTick();

            expect(scene?.value?.getElementById('a')?.$state.radius).toBe(42);

            wrapper.unmount();
        });

        test('Should bind the class prop to the element class list rather than the marker node', () => {
            let scene: ReturnType<typeof useRiplScene> | undefined;

            const Probe = defineComponent({
                setup() {
                    scene = useRiplScene();
                    return () => null;
                },
            });

            const wrapper = mount(RiplContext, {
                slots: {
                    default: () => h(RiplScene, null, {
                        default: () => [
                            h(Probe),
                            h(RiplCircle, {
                                id: 'a',
                                class: 'segment active',
                                cx: 1,
                                cy: 1,
                                radius: 1,
                            }),
                        ],
                    }),
                },
            });

            const circle = scene?.value?.getElementById('a');

            expect(Array.from(circle?.classList ?? [])).toEqual([
                'segment',
                'active',
            ]);
            expect(wrapper.find('ripl-node').classes()).toEqual([]);

            wrapper.unmount();
        });

    });

});
