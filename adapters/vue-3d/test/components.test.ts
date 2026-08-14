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

import {
    Camera,
    Context3D,
} from '@ripl/3d';

import type {
    Cube,

    Face3D,
    Group3D,
} from '@ripl/3d';

import type {
    Scene,
} from '@ripl/web';

import {
    RiplAmbientLight,
    RiplCamera,
    RiplContext3D,
    RiplCube,
    RiplGroup3D,
    RiplMesh,
    RiplRenderer,
    RiplScene,
    RiplTransition,
    useRiplCamera,
    useRiplContext3D,
    useRiplScene,
} from '@ripl/vue-3d';

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
function childIds(group: Group3D | Scene | undefined): string[] {
    return (group?.children ?? []).map(element => element.id);
}

/** Mounts a 3D tree whose scene is captured for assertions. */
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
            return () => h(RiplContext3D, null, {
                default: () => h(RiplScene, null, {
                    default: () => [
                        h(Probe),
                        h(RiplRenderer, {
                            autoStop: false,
                            ...renderer,
                        }, {
                            default: () => children(),
                        }),
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

describe('@ripl/vue-3d', () => {

    beforeEach(() => {
        mockCanvasContext();
        polyfillPath2D();
    });

    afterEach(() => vi.restoreAllMocks());

    describe('Context', () => {

        test('Should create a 3D context and resolve it inside a descendant setup', () => {
            const seen: (Context3D | undefined)[] = [];

            const Probe = defineComponent({
                setup() {
                    seen.push(useRiplContext3D().value);
                    return () => null;
                },
            });

            const wrapper = mount(RiplContext3D, {
                slots: {
                    default: () => h(Probe),
                },
            });

            expect(seen).toHaveLength(1);
            expect(seen[0]).toBeInstanceOf(Context3D);

            wrapper.unmount();
        });

        test('Should replace the default light rig when lights are bound', () => {
            const context = shallowRef<Context3D>();

            const Harness = defineComponent({
                setup() {
                    return () => h(RiplContext3D, {
                        ref: context,
                        lights: [],
                    });
                },
            });

            const wrapper = mount(Harness);

            expect(context.value?.lights.length).toBe(0);

            wrapper.unmount();
        });

    });

    describe('Shapes', () => {

        test('Should nest shapes under their group in template order', () => {
            const {
                captured,
                wrapper,
            } = mountScene(() => h(RiplGroup3D, {
                id: 'group',
            }, {
                default: () => [
                    h(RiplCube, {
                        id: 'a',
                        size: 1,
                    }),
                    h(RiplCube, {
                        id: 'b',
                        size: 1,
                    }),
                ],
            }));

            const group = captured.scene?.getElementById('group') as Group3D | undefined;

            expect(childIds(captured.scene)).toEqual(['group']);
            expect(childIds(group)).toEqual(['a', 'b']);

            wrapper.unmount();
        });

        test('Should write transform props through to the shape state', async () => {
            const z = ref(0);

            const {
                captured,
                wrapper,
            } = mountScene(() => h(RiplCube, {
                id: 'a',
                size: 2,
                x: 1,
                y: 2,
                z: z.value,
                rotationY: 0.5,
            }));

            const cube = captured.scene?.getElementById('a') as Cube | undefined;

            expect(cube?.x).toBe(1);
            expect(cube?.rotationY).toBe(0.5);

            z.value = 5;
            await nextTick();

            expect(cube?.z).toBe(5);

            wrapper.unmount();
        });

        // A 3D shape derives zIndex from projected depth and warns when one is assigned, so the
        // prop surface must not offer it in the first place.
        test('Should not offer zIndex on a 3D shape', () => {
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

            const {
                wrapper,
            } = mountScene(() => h(RiplCube, {
                id: 'a',
                size: 1,
                zIndex: 4,
            }));

            expect(warn).not.toHaveBeenCalled();

            wrapper.unmount();
        });

        test('Should apply a uniform scale to all three axes', () => {
            const {
                captured,
                wrapper,
            } = mountScene(() => h(RiplCube, {
                id: 'a',
                size: 1,
                scale: 3,
            }));

            const cube = captured.scene?.getElementById('a') as Cube | undefined;

            expect([
                cube?.scaleX,
                cube?.scaleY,
                cube?.scaleZ,
            ]).toEqual([3, 3, 3]);

            wrapper.unmount();
        });

        // A mesh holds its faces by reference behind a revision counter and exposes no setter, so a
        // changed binding has to go through `setFaces` or it is silently ignored.
        test('Should replace mesh geometry when its faces prop changes', async () => {
            const faces = ref<Face3D[]>([
                {
                    vertices: [
                        [0, 0, 0],
                        [1, 0, 0],
                        [0, 1, 0],
                    ],
                },
            ]);

            const {
                captured,
                wrapper,
            } = mountScene(() => h(RiplMesh, {
                id: 'a',
                faces: faces.value,
            }));

            const mesh = captured.scene?.getElementById('a');
            const before = (mesh as unknown as { revision: number }).revision;

            faces.value = [
                ...faces.value,
                {
                    vertices: [
                        [0, 0, 1],
                        [1, 0, 1],
                        [0, 1, 1],
                    ],
                },
            ];

            await nextTick();

            expect((mesh as unknown as { faces: Face3D[] }).faces).toHaveLength(2);
            expect((mesh as unknown as { revision: number }).revision).toBeGreaterThan(before);

            wrapper.unmount();
        });

    });

    describe('Groups', () => {

        test('Should apply a group transform without routing it through element state', async () => {
            const rotation = ref(0);

            const {
                captured,
                wrapper,
            } = mountScene(() => h(RiplGroup3D, {
                id: 'group',
                rotationY: rotation.value,
            }, {
                default: () => h(RiplCube, {
                    id: 'a',
                    size: 1,
                }),
            }));

            const group = captured.scene?.getElementById('group') as Group3D | undefined;

            rotation.value = 1.5;
            await nextTick();

            expect(group?.rotationY).toBe(1.5);
            expect(group?.$state).not.toHaveProperty('rotationY');

            wrapper.unmount();
        });

    });

    describe('Camera and lights', () => {

        test('Should attach a camera and resolve it from a composition', () => {
            let seen: Camera | undefined;

            const Probe = defineComponent({
                setup() {
                    seen = useRiplCamera().value;
                    return () => null;
                },
            });

            const {
                wrapper,
            } = mountScene(() => [
                h(RiplCamera, {
                    position: [0, 2, 5],
                }),
                h(Probe),
            ]);

            expect(seen).toBeInstanceOf(Camera);
            expect(seen?.position).toEqual([0, 2, 5]);

            wrapper.unmount();
        });

        test('Should dispose the camera when it unmounts', () => {
            const camera = shallowRef<Camera>();
            const visible = ref(true);

            const {
                wrapper,
            } = mountScene(() => visible.value
                ? h(RiplCamera, {
                    ref: camera,
                })
                : null);

            const dispose = vi.spyOn(camera.value!, 'dispose');

            wrapper.unmount();

            expect(dispose).toHaveBeenCalled();
        });

        test('Should add a light to the context and remove it on unmount', async () => {
            const visible = ref(true);
            const context = shallowRef<Context3D>();

            const Harness = defineComponent({
                setup() {
                    return () => h(RiplContext3D, {
                        ref: context,
                        lights: [],
                    }, {
                        default: () => visible.value
                            ? h(RiplAmbientLight, {
                                intensity: 0.4,
                            })
                            : null,
                    });
                },
            });

            const wrapper = mount(Harness);

            expect(context.value?.lights.length).toBe(1);

            visible.value = false;
            await nextTick();

            expect(context.value?.lights.length).toBe(0);

            wrapper.unmount();
        });

    });

    describe('Interop with @ripl/vue', () => {

        // The 3D shapes are ordinary elements, so the core transition component drives them with no
        // 3D-specific code at all. This is the test that proves the two packages compose.
        test('Should animate a 3D shape through the core transition component', () => {
            const {
                captured,
                wrapper,
            } = mountScene(() => h(RiplTransition, {
                enter: {
                    duration: 5000,
                    state: {
                        y: -10,
                    },
                },
            }, {
                default: () => h(RiplCube, {
                    id: 'a',
                    size: 1,
                    y: 0,
                }),
            }));

            expect((captured.scene?.getElementById('a') as Cube | undefined)?.y).toBe(-10);

            wrapper.unmount();
        });

        test('Should resolve a ref on a 3D component to the Ripl object', () => {
            const context = shallowRef<Context3D>();
            const cube = shallowRef<Cube>();

            const Harness = defineComponent({
                setup() {
                    return () => h(RiplContext3D, {
                        ref: context,
                    }, {
                        default: () => h(RiplScene, null, {
                            default: () => h(RiplCube, {
                                ref: cube,
                                id: 'a',
                                size: 2,
                            }),
                        }),
                    });
                },
            });

            const wrapper = mount(Harness);

            expect(context.value?.element).toBeInstanceOf(HTMLElement);
            expect(cube.value?.size).toBe(2);

            wrapper.unmount();
        });

    });

});
