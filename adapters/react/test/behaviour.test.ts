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
    useRiplRenderer,
    useRiplScene,
} from '@ripl/react';

import {
    act,
    render,
} from '@testing-library/react';

import {
    createElement,
    createRef,
    StrictMode,
} from 'react';

import type {
    ReactNode,
} from 'react';

/** Reads the ids of a group's children in paint order. */
function childIds(group: Group | undefined): string[] {
    return (group?.children ?? []).map(element => element.id);
}

/**
 * Mounts a tree whose scene is captured for assertions, and hands back a way to re-render its
 * children so a test can drive the graph the way a consumer's state would.
 */
function mountScene(children: ReactNode, renderer?: Record<string, unknown>) {
    const captured: { scene?: Scene } = {};

    const Probe = () => {
        captured.scene = useRiplScene();
        return null;
    };

    const build = (nodes: ReactNode) => createElement(RiplContext, null,
        createElement(RiplScene, null,
            createElement(Probe),
            renderer
                ? createElement(RiplRenderer, renderer, nodes)
                : nodes));

    const view = render(build(children));

    return {
        captured,
        view,
        update: (nodes: ReactNode) => view.rerender(build(nodes)),
    };
}

/**
 * Mounts a transition around a single circle, handing back the renderer and the circle themselves
 * so a test can watch a transition run rather than infer it from the graph.
 */
function mountTransition(phases: Record<string, unknown>, props: Record<string, unknown> = {}) {
    const renderer = createRef<Renderer>();
    const circle = createRef<Circle>();

    const build = (cx: number) => createElement(RiplContext, null,
        createElement(RiplScene, null,
            createElement(RiplRenderer, {
                ref: renderer,
                autoStop: false,
            }, createElement(RiplTransition, phases, createElement(RiplCircle, {
                ref: circle,
                id: 'a',
                cy: 1,
                radius: 1,
                cx,
                ...props,
            })))));

    const view = render(build(1));

    return {
        circle,
        renderer,
        view,
        setCx: (cx: number) => view.rerender(build(cx)),
    };
}

describe('@ripl/react behaviour', () => {

    beforeEach(() => {
        mockCanvasContext();
        polyfillPath2D();
    });

    afterEach(() => vi.restoreAllMocks());

    describe('Ordering', () => {

        const circles = (ids: string[]) => ids.map(id => createElement(RiplCircle, {
            key: id,
            id,
            cx: 1,
            cy: 1,
            radius: 1,
        }));

        test('Should re-order a group when a keyed list reorders without remounting', async () => {
            const {
                captured,
                update,
                view,
            } = mountScene(circles([
                'a',
                'b',
                'c',
            ]));

            expect(childIds(captured.scene)).toEqual([
                'a',
                'b',
                'c',
            ]);

            update(circles([
                'c',
                'a',
                'b',
            ]));

            await vi.waitFor(() => expect(childIds(captured.scene)).toEqual([
                'c',
                'a',
                'b',
            ]));

            view.unmount();
        });

    });

    describe('Events', () => {

        test('Should subscribe only to events a listener is bound to', () => {
            const onClick = vi.fn();

            const {
                captured,
                view,
            } = mountScene(createElement(RiplCircle, {
                id: 'a',
                cx: 1,
                cy: 1,
                radius: 1,
                onClick,
            }));

            const circle = captured.scene?.getElementById('a');

            expect(circle?.has('click')).toBe(true);
            expect(circle?.has('mousemove')).toBe(false);

            view.unmount();
        });

        test('Should forward an event payload to its listener prop', () => {
            const onClick = vi.fn();

            const {
                captured,
                view,
            } = mountScene(createElement(RiplCircle, {
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

            view.unmount();
        });

        // A React consumer passes an inline arrow constantly, so a subscription keyed on handler
        // identity would tear itself down and rebuild on every render of the parent.
        test('Should not resubscribe when only the handler identity changes', () => {
            const circle = createRef<Circle>();

            const build = (handler: () => void) => createElement(RiplContext, null,
                createElement(RiplScene, null, createElement(RiplCircle, {
                    ref: circle,
                    id: 'a',
                    cx: 1,
                    cy: 1,
                    radius: 1,
                    onClick: handler,
                })));

            const view = render(build(() => undefined));
            const on = vi.spyOn(circle.current!, 'on');

            const latest = vi.fn();

            view.rerender(build(latest));

            expect(on).not.toHaveBeenCalled();

            circle.current?.emit('click', {
                x: 1,
                y: 2,
            });

            expect(latest).toHaveBeenCalledTimes(1);

            view.unmount();
        });

    });

    describe('Transitions', () => {

        test('Should apply the enter state to a new element straight away', () => {
            const {
                captured,
                view,
            } = mountScene(createElement(RiplTransition, {
                enter: {
                    duration: 5000,
                    state: {
                        opacity: 0,
                    },
                },
            }, createElement(RiplCircle, {
                id: 'a',
                cx: 1,
                cy: 1,
                radius: 1,
            })), {
                autoStop: false,
            });

            expect(captured.scene?.getElementById('a')?.$state.opacity).toBe(0);

            view.unmount();
        });

        test('Should skip the enter phase on the initial mount when appear is false', () => {
            const {
                captured,
                view,
            } = mountScene(createElement(RiplTransition, {
                appear: false,
                enter: {
                    duration: 5000,
                    state: {
                        opacity: 0,
                    },
                },
            }, createElement(RiplCircle, {
                id: 'a',
                cx: 1,
                cy: 1,
                radius: 1,
            })), {
                autoStop: false,
            });

            expect(captured.scene?.getElementById('a')?.$state.opacity).toBeUndefined();

            view.unmount();
        });

        test('Should keep a leaving element in the graph until its transition finishes', async () => {
            const leaving = (children: ReactNode) => createElement(RiplTransition, {
                leave: {
                    duration: 40,
                    state: {
                        opacity: 0,
                    },
                },
            }, children);

            const circle = createElement(RiplCircle, {
                id: 'a',
                cx: 1,
                cy: 1,
                radius: 1,
                opacity: 1,
            });

            const {
                captured,
                update,
                view,
            } = mountScene(leaving(circle), {
                autoStop: false,
            });

            update(leaving(null));

            // Retagged so a key re-entering mid-fade cannot collide with the element still leaving.
            expect(childIds(captured.scene)[0]).toMatch(/^a:leave:/);

            await vi.waitFor(() => expect(childIds(captured.scene)).toEqual([]), {
                timeout: 3000,
            });

            view.unmount();
        });

        test('Should not hold a leaving element when the whole tree is being destroyed', () => {
            const {
                captured,
                view,
            } = mountScene(createElement(RiplTransition, {
                leave: {
                    duration: 5000,
                    state: {
                        opacity: 0,
                    },
                },
            }, createElement(RiplCircle, {
                id: 'a',
                cx: 1,
                cy: 1,
                radius: 1,
                opacity: 1,
            })), {
                autoStop: false,
            });

            const scene = captured.scene;

            view.unmount();

            expect(childIds(scene)).toEqual([]);
        });

    });

    describe('Looping transitions', () => {

        test('Should keep a looping transition running past its duration', async () => {
            const {
                renderer,
                view,
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

            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 150));
            });

            expect(renderer.current?.isBusy).toBe(true);

            view.unmount();
        });

        test('Should settle a transition that does not loop', async () => {
            const {
                renderer,
                view,
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

            await vi.waitFor(() => expect(renderer.current?.isBusy).toBe(false), {
                timeout: 3000,
            });

            view.unmount();
        });

        test('Should reverse an alternating transition on its second cycle', async () => {
            const {
                circle,
                view,
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

            await vi.waitFor(() => expect(circle.current?.opacity).toBeGreaterThan(0.9), {
                timeout: 3000,
            });

            await vi.waitFor(() => expect(circle.current?.opacity).toBeLessThan(0.5), {
                timeout: 3000,
            });

            view.unmount();
        });

        // A looping leave would never resolve, so the element would animate forever instead of
        // being destroyed; `loop` is dropped from the phase that owns the element's destruction.
        test('Should still destroy a leaving element whose phase asks to loop', async () => {
            const leaving = (children: ReactNode) => createElement(RiplTransition, {
                leave: {
                    duration: 30,
                    loop: true,
                    state: {
                        opacity: 0,
                    },
                },
            }, children);

            const {
                captured,
                update,
                view,
            } = mountScene(leaving(createElement(RiplCircle, {
                id: 'a',
                cx: 1,
                cy: 1,
                radius: 1,
                opacity: 1,
            })), {
                autoStop: false,
            });

            update(leaving(null));

            await vi.waitFor(() => expect(childIds(captured.scene)).toEqual([]), {
                timeout: 3000,
            });

            view.unmount();
        });

        // A looping entry is never evicted by the renderer, so an element that leaves without
        // aborting it would keep the loop busy and the animation frame alive forever.
        test('Should release a looping transition when its element leaves', async () => {
            const renderer = createRef<Renderer>();

            const build = (visible: boolean) => createElement(RiplContext, null,
                createElement(RiplScene, null,
                    createElement(RiplRenderer, {
                        ref: renderer,
                        autoStop: false,
                    }, createElement(RiplTransition, {
                        enter: {
                            duration: 5000,
                            loop: true,
                            state: {
                                opacity: 0,
                            },
                        },
                    }, visible
                        ? createElement(RiplCircle, {
                            id: 'a',
                            cx: 1,
                            cy: 1,
                            radius: 1,
                            opacity: 1,
                        })
                        : null))));

            const view = render(build(true));

            await vi.waitFor(() => expect(renderer.current?.isBusy).toBe(true), {
                timeout: 3000,
            });

            view.rerender(build(false));

            expect(renderer.current?.isBusy).toBe(false);

            view.unmount();
        });

        test('Should replace a looping transition rather than stack another on the element', () => {
            const abort = vi.spyOn(Task.prototype, 'abort');

            const {
                setCx,
                view,
            } = mountTransition({
                update: {
                    duration: 5000,
                    loop: true,
                },
            });

            setCx(2);

            expect(abort).not.toHaveBeenCalled();

            setCx(3);

            expect(abort).toHaveBeenCalledTimes(1);

            setCx(4);

            expect(abort).toHaveBeenCalledTimes(2);

            view.unmount();
        });

    });

    describe('Instance refs', () => {

        test('Should resolve a ref on each component to the Ripl object it wraps', () => {
            const context = createRef<Context>();
            const scene = createRef<Scene>();
            const renderer = createRef<Renderer>();
            const circle = createRef<Circle>();

            const view = render(createElement(RiplContext, {
                ref: context,
            }, createElement(RiplScene, {
                ref: scene,
            }, createElement(RiplRenderer, {
                ref: renderer,
                autoStart: false,
            }, createElement(RiplCircle, {
                ref: circle,
                id: 'a',
                cx: 5,
                cy: 6,
                radius: 7,
            })))));

            expect(context.current?.element).toBeInstanceOf(HTMLElement);
            expect(scene.current?.getElementById('a')).toBeDefined();
            expect(renderer.current?.isBusy).toBe(false);
            expect(circle.current?.cx).toBe(5);
            expect(circle.current?.radius).toBe(7);

            circle.current!.radius = 9;

            expect(scene.current?.getElementById('a')?.$state.radius).toBe(9);

            view.unmount();
        });

    });

    describe('Declared events', () => {

        // The forwarded names come from `EventBus.$events`, so an element forwards every event it
        // actually emits — `graph` among them, which a hand-written list had omitted.
        test('Should forward an event the element declares beyond the pointer set', () => {
            const graph = vi.fn();

            const grouped = (count: number) => createElement(RiplGroup, {
                id: 'group',
                onGraph: graph,
            }, Array.from({ length: count }, (_, index) => createElement(RiplCircle, {
                key: index,
                id: `c${index}`,
                cx: 1,
                cy: 1,
                radius: 1,
            })));

            const {
                update,
                view,
            } = mountScene(grouped(1));

            graph.mockClear();

            update(grouped(2));

            expect(graph).toHaveBeenCalled();

            view.unmount();
        });

    });

    describe('Staggered enters', () => {

        // Layout effects run in sibling order, so an enter applied inside one would see only the
        // siblings before it and a `delay: index / length` stagger would compress towards the end.
        test('Should resolve a stagger against the whole set on the initial mount', () => {
            const lengths: number[] = [];
            const indices: number[] = [];

            const {
                view,
            } = mountScene(createElement(RiplTransition, {
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
            }, Array.from({ length: 3 }, (_, index) => createElement(RiplCircle, {
                key: index,
                id: `c${index}`,
                cx: 1,
                cy: 1,
                radius: 1,
            }))), {
                autoStop: false,
            });

            expect(lengths).toEqual([3, 3, 3]);
            expect(indices).toEqual([0, 1, 2]);

            view.unmount();
        });

    });

    describe('Class bindings', () => {

        // The construction snapshot held a parsed class list while every later read yielded the raw
        // binding, so the first change of any prop reported it as changed and rebuilt the list.
        test('Should not rebuild the class list when an unrelated prop changes', () => {
            const circle = createRef<Circle>();

            const build = (cx: number) => createElement(RiplContext, null,
                createElement(RiplScene, null, createElement(RiplCircle, {
                    ref: circle,
                    id: 'a',
                    className: {
                        active: true,
                    },
                    cx,
                    cy: 1,
                    radius: 1,
                })));

            const view = render(build(1));
            const clear = vi.spyOn(circle.current!.classList, 'clear');

            view.rerender(build(2));

            expect(clear).not.toHaveBeenCalled();
            expect(circle.current?.classList.has('active')).toBe(true);

            view.unmount();
        });

    });

    describe('Construction-only props', () => {

        test('Should hand interpolators to the element and leave them out of the sync path', async () => {
            const interpolator = vi.fn(() => () => 5);
            const circle = createRef<Circle>();

            const build = (cx: number) => createElement(RiplContext, null,
                createElement(RiplScene, null,
                    createElement(RiplRenderer, {
                        autoStop: false,
                    }, createElement(RiplTransition, {
                        update: {
                            duration: 40,
                        },
                    }, createElement(RiplCircle, {
                        ref: circle,
                        id: 'a',
                        cy: 1,
                        radius: 1,
                        cx,
                        interpolators: {
                            cx: interpolator,
                        },
                    })))));

            const view = render(build(1));

            view.rerender(build(2));

            await vi.waitFor(() => expect(interpolator).toHaveBeenCalled(), {
                timeout: 3000,
            });

            // A protected field on the element, so a later change must never reach the write path.
            expect(circle.current?.$state.interpolators).toBeUndefined();

            view.unmount();
        });

    });

    describe('Nested contexts', () => {

        test('Should not resolve the enclosing scene inside a nested context', () => {
            const captured: {
                outer?: Scene;
                inner?: Scene;
            } = {};

            const Outer = () => {
                captured.outer = useRiplScene();
                return null;
            };

            const Inner = () => {
                captured.inner = useRiplScene();
                return null;
            };

            const view = render(createElement(RiplContext, null,
                createElement(RiplScene, null,
                    createElement(Outer),
                    createElement(RiplContext, null, createElement(Inner)))));

            expect(captured.outer).toBeDefined();
            expect(captured.inner).toBeUndefined();

            view.unmount();
        });

        test('Should not bind a renderer in a nested context to the enclosing scene', () => {
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
            const captured: { renderer?: Renderer } = {};

            const Probe = () => {
                captured.renderer = useRiplRenderer();
                return null;
            };

            const view = render(createElement(RiplContext, null,
                createElement(RiplScene, null,
                    createElement(RiplContext, null,
                        createElement(RiplRenderer, null, createElement(Probe))))));

            expect(warn).toHaveBeenCalledWith(expect.stringContaining('needs a <RiplScene> ancestor'));
            expect(captured.renderer).toBeUndefined();

            view.unmount();
        });

        // The barrier must be an empty provider, not the tree's own scene: `tree.scene` is already
        // populated by the time a sibling renderer builds, so reading it would bind to a scene it
        // is not inside.
        test('Should still treat a scene as out of reach from its own sibling', () => {
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
            const captured: { scene?: Scene } = {};

            const Probe = () => {
                captured.scene = useRiplScene();
                return null;
            };

            const view = render(createElement(RiplContext, null,
                createElement(RiplScene, null),
                createElement(Probe),
                createElement(RiplRenderer, null)));

            expect(captured.scene).toBeUndefined();
            expect(warn).toHaveBeenCalledWith(expect.stringContaining('needs a <RiplScene> ancestor'));

            view.unmount();
        });

    });

    describe('Strict mode', () => {

        // React's development-mode remount runs every cleanup and then re-runs the effects without
        // re-rendering, so anything a cleanup destroyed has to be rebuilt rather than reused dead.
        test('Should leave a live graph behind after a double mount', () => {
            const captured: { scene?: Scene } = {};

            const Probe = () => {
                captured.scene = useRiplScene();
                return null;
            };

            const view = render(createElement(StrictMode, null,
                createElement(RiplContext, null,
                    createElement(RiplScene, null,
                        createElement(Probe),
                        createElement(RiplCircle, {
                            id: 'a',
                            cx: 1,
                            cy: 1,
                            radius: 1,
                        }),
                        createElement(RiplGroup, {
                            id: 'group',
                        }, createElement(RiplCircle, {
                            id: 'b',
                            cx: 2,
                            cy: 2,
                            radius: 1,
                        }))))));

            // Exactly these: a strict-mount that rebuilt without releasing would leave a stale copy
            // of each element behind, and a child rebuilt against its old parent would go missing.
            expect(childIds(captured.scene)).toEqual([
                'a',
                'group',
            ]);

            expect(childIds(captured.scene?.getElementById<Group>('group'))).toEqual(['b']);

            view.unmount();
        });

        test('Should destroy every context it created when unmounted', () => {
            const created: Context[] = [];
            const destroyed: Context[] = [];

            const view = render(createElement(StrictMode, null,
                createElement(RiplContext, {
                    onReady: (context: Context) => {
                        created.push(context);
                        context.once('destroyed', () => destroyed.push(context));
                    },
                }, createElement(RiplCircle, {
                    id: 'a',
                    cx: 1,
                    cy: 1,
                    radius: 1,
                }))));

            view.unmount();

            expect(created.length).toBeGreaterThan(0);
            expect(destroyed).toEqual(created);
        });

    });

});
