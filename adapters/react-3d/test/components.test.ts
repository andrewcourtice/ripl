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
    Group,
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
} from '@ripl/react-3d';

import {
    render,
} from '@testing-library/react';

import {
    createElement,
    createRef,
} from 'react';

import type {
    ReactNode,
} from 'react';

/** Reads the ids of a group's children in paint order. */
function childIds(group: Group | undefined): string[] {
    return (group?.children ?? []).map(element => element.id);
}

/** Mounts a 3D scene whose scene is captured for assertions, with a way to re-render its children. */
function mountScene(children: ReactNode) {
    const captured: { scene?: Scene } = {};

    const Probe = () => {
        captured.scene = useRiplScene();
        return null;
    };

    const build = (nodes: ReactNode) => createElement(RiplContext3D, null,
        createElement(RiplScene, null,
            createElement(Probe),
            createElement(RiplRenderer, {
                autoStop: false,
            }, nodes)));

    const view = render(build(children));

    return {
        captured,
        view,
        update: (nodes: ReactNode) => view.rerender(build(nodes)),
    };
}

describe('@ripl/react-3d', () => {

    beforeEach(() => {
        mockCanvasContext();
        polyfillPath2D();
    });

    afterEach(() => vi.restoreAllMocks());

    describe('Context', () => {

        test('Should create a 3D context and resolve it in a descendant', () => {
            const captured: { context?: Context3D } = {};

            const Probe = () => {
                captured.context = useRiplContext3D();
                return null;
            };

            const view = render(createElement(RiplContext3D, null, createElement(Probe)));

            expect(captured.context).toBeInstanceOf(Context3D);

            view.unmount();
        });

        test('Should replace the default light rig when lights are bound', () => {
            const context = createRef<Context3D>();

            const view = render(createElement(RiplContext3D, {
                ref: context,
                lights: [],
            }));

            expect(context.current?.lights.length).toBe(0);

            view.unmount();
        });

    });

    describe('Shapes', () => {

        test('Should nest shapes under their group in declaration order', () => {
            const {
                captured,
                view,
            } = mountScene(createElement(RiplGroup3D, {
                id: 'group',
            }, createElement(RiplCube, {
                id: 'a',
                size: 1,
            }), createElement(RiplCube, {
                id: 'b',
                size: 1,
            })));

            const group = captured.scene?.getElementById('group') as Group3D | undefined;

            expect(childIds(captured.scene)).toEqual(['group']);
            expect(childIds(group)).toEqual(['a', 'b']);

            view.unmount();
        });

        test('Should write transform props through to the shape state', () => {
            const cube = (z: number) => createElement(RiplCube, {
                id: 'a',
                size: 2,
                x: 1,
                y: 2,
                z,
                rotationY: 0.5,
            });

            const {
                captured,
                update,
                view,
            } = mountScene(cube(0));

            const shape = captured.scene?.getElementById('a') as Cube | undefined;

            expect(shape?.x).toBe(1);
            expect(shape?.rotationY).toBe(0.5);

            update(cube(5));

            expect(shape?.z).toBe(5);

            view.unmount();
        });

        // A 3D shape derives zIndex from projected depth and warns when one is assigned, so the
        // prop surface must not offer it in the first place.
        test('Should not offer zIndex on a 3D shape', () => {
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

            const {
                view,
            } = mountScene(createElement(RiplCube, {
                id: 'a',
                size: 1,
                zIndex: 4,
            } as never));

            expect(warn).not.toHaveBeenCalled();

            view.unmount();
        });

        test('Should apply a uniform scale to all three axes', () => {
            const {
                captured,
                view,
            } = mountScene(createElement(RiplCube, {
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

            view.unmount();
        });

        // A mesh holds its faces by reference behind a revision counter and exposes no setter, so a
        // changed binding has to go through `setFaces` or it is silently ignored.
        test('Should replace mesh geometry when its faces prop changes', () => {
            const first: Face3D[] = [
                {
                    vertices: [
                        [0, 0, 0],
                        [1, 0, 0],
                        [0, 1, 0],
                    ],
                },
            ];

            const mesh = (faces: Face3D[]) => createElement(RiplMesh, {
                id: 'a',
                faces,
            });

            const {
                captured,
                update,
                view,
            } = mountScene(mesh(first));

            const element = captured.scene?.getElementById('a');
            const before = (element as unknown as { revision: number }).revision;

            update(mesh([
                ...first,
                {
                    vertices: [
                        [0, 0, 1],
                        [1, 0, 1],
                        [0, 1, 1],
                    ],
                },
            ]));

            expect((element as unknown as { faces: Face3D[] }).faces).toHaveLength(2);
            expect((element as unknown as { revision: number }).revision).toBeGreaterThan(before);

            view.unmount();
        });

    });

    describe('Groups', () => {

        test('Should apply a group transform without routing it through element state', () => {
            const group = (rotationY: number) => createElement(RiplGroup3D, {
                id: 'group',
                rotationY,
            }, createElement(RiplCube, {
                id: 'a',
                size: 1,
            }));

            const {
                captured,
                update,
                view,
            } = mountScene(group(0));

            const element = captured.scene?.getElementById('group') as Group3D | undefined;

            update(group(1.5));

            expect(element?.rotationY).toBe(1.5);
            expect(element?.$state).not.toHaveProperty('rotationY');

            view.unmount();
        });

    });

    describe('Camera and lights', () => {

        test('Should attach a camera and resolve it from a hook', () => {
            const captured: { camera?: Camera } = {};

            const Probe = () => {
                captured.camera = useRiplCamera();
                return null;
            };

            const {
                view,
            } = mountScene([
                createElement(RiplCamera, {
                    key: 'camera',
                    position: [0, 2, 5],
                }),
                createElement(Probe, {
                    key: 'probe',
                }),
            ]);

            expect(captured.camera).toBeInstanceOf(Camera);
            expect(captured.camera?.position).toEqual([0, 2, 5]);

            view.unmount();
        });

        // The demo re-renders every frame off a tick handler; rewriting the declared vectors each
        // time would undo the orbit the pointer just applied.
        test('Should leave an interactively moved camera alone when its props are rebuilt', () => {
            const camera = createRef<Camera>();

            const build = () => createElement(RiplCamera, {
                ref: camera,
                position: [0, 2, 5],
                target: [0, 0, 0],
            });

            const {
                view,
                update,
            } = mountScene(build());

            camera.current!.orbit(0.4, 0.2);

            const orbited = camera.current!.position;

            update(build());

            expect(camera.current?.position).toEqual(orbited);

            view.unmount();
        });

        test('Should dispose the camera when it unmounts', () => {
            const camera = createRef<Camera>();

            const {
                view,
            } = mountScene(createElement(RiplCamera, {
                ref: camera,
            }));

            const dispose = vi.spyOn(camera.current!, 'dispose');

            view.unmount();

            expect(dispose).toHaveBeenCalled();
        });

        test('Should add a light to the context and remove it on unmount', () => {
            const context = createRef<Context3D>();

            const build = (visible: boolean) => createElement(RiplContext3D, {
                ref: context,
                lights: [],
            }, visible
                ? createElement(RiplAmbientLight, {
                    intensity: 0.4,
                })
                : null);

            const view = render(build(true));

            expect(context.current?.lights.length).toBe(1);

            view.rerender(build(false));

            expect(context.current?.lights.length).toBe(0);

            view.unmount();
        });

    });

    describe('Repainting', () => {

        // A group transform is a plain field, so it carries no state change to dirty the scene with
        // — and a running renderer skips the paint on a frame where nothing is dirty.
        test('Should invalidate the scene when a plain field changes', () => {
            const group = (rotationY: number) => createElement(RiplGroup3D, {
                id: 'group',
                rotationY,
            }, createElement(RiplCube, {
                id: 'a',
                size: 1,
            }));

            const {
                captured,
                update,
                view,
            } = mountScene(group(0));

            captured.scene?.$consumeRender();

            expect(captured.scene?.needsRender).toBe(false);

            update(group(1));

            expect(captured.scene?.needsRender).toBe(true);

            view.unmount();
        });

    });

    describe('Interop with @ripl/react', () => {

        // The 3D shapes are ordinary elements, so the core transition component drives them with no
        // 3D-specific code at all. This is the test that proves the two packages compose.
        test('Should animate a 3D shape through the core transition component', () => {
            const {
                captured,
                view,
            } = mountScene(createElement(RiplTransition, {
                enter: {
                    duration: 5000,
                    state: {
                        y: -10,
                    },
                },
            }, createElement(RiplCube, {
                id: 'a',
                size: 1,
                y: 0,
            })));

            expect((captured.scene?.getElementById('a') as Cube | undefined)?.y).toBe(-10);

            view.unmount();
        });

        test('Should resolve a ref on a 3D component to the Ripl object', () => {
            const context = createRef<Context3D>();
            const cube = createRef<Cube>();

            const view = render(createElement(RiplContext3D, {
                ref: context,
            }, createElement(RiplScene, null, createElement(RiplCube, {
                ref: cube,
                id: 'a',
                size: 2,
            }))));

            expect(context.current?.element).toBeInstanceOf(HTMLElement);
            expect(cube.current?.size).toBe(2);

            view.unmount();
        });

    });

});
