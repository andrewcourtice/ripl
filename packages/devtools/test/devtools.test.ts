import {
    afterEach,
    beforeEach,
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import type {
    MockInstance,
} from 'vitest';

import {
    EVENT_BUFFER_LIMIT,
    EVENT_FLUSH_INTERVAL,
    RIPL_VERSION,
} from '../src/constants';

import {
    createDevtools,
} from '../src/devtools';

import type {
    Devtools,
} from '../src/devtools';

import {
    createExtensionEnvelope,
    messageIsFromBridge,
} from '../src/protocol';

import type {
    BridgeMessage,
    ExtensionMessage,
} from '../src/protocol';

import {
    getBindings,
} from '../src/registry';

import {
    createRect,
    createRenderer,
    createScene,
    Element,
    factory,
} from '@ripl/core';

import type {
    BaseElementState,
    ElementEventMap,
    Rect,
    Scene,
} from '@ripl/core';

import {
    createContext,
} from '@ripl/canvas';

import {
    mockCanvasContext,
    polyfillPath2D,
} from '@ripl/test-utils';

polyfillPath2D();

type MessageOfKind<TKind extends BridgeMessage['kind']> = Extract<BridgeMessage, {
    kind: TKind;
}>;

describe('Devtools', () => {

    let el: HTMLDivElement;
    let scene: Scene;
    let postMessageSpy: MockInstance;

    function getBridgeMessages(): BridgeMessage[] {
        return postMessageSpy.mock.calls
            .map(([data]) => data)
            .filter(messageIsFromBridge)
            .map(envelope => envelope.payload);
    }

    function getMessagesOfKind<TKind extends BridgeMessage['kind']>(kind: TKind): MessageOfKind<TKind>[] {
        return getBridgeMessages().filter(message => message.kind === kind) as MessageOfKind<TKind>[];
    }

    function getTreeMessages(): BridgeMessage[] {
        return getBridgeMessages().filter(message => message.kind.startsWith('tree:'));
    }

    function dispatchExtensionMessage(message: ExtensionMessage): void {
        window.dispatchEvent(new MessageEvent('message', {
            data: createExtensionEnvelope(message),
            source: window,
        }));
    }

    function createTestRect(x = 10, y = 10): Rect {
        return createRect({
            x,
            y,
            width: 20,
            height: 20,
            fill: '#000000',
        });
    }

    async function waitForSnapshot(minimumBegins = 1): Promise<void> {
        await vi.waitFor(() => {
            expect(getMessagesOfKind('tree:snapshot-end').length).toBeGreaterThanOrEqual(minimumBegins);
        });
    }

    function wait(duration: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, duration));
    }

    function startEvents(contextId: string, excluded: string[] = []): void {
        dispatchExtensionMessage({
            excluded,
            kind: 'events:start',
            contextId,
        });
    }

    beforeEach(() => {
        mockCanvasContext();
        factory.set({
            createContext,
        });
        el = document.createElement('div');
        document.body.appendChild(el);
        scene = createScene(el);
        postMessageSpy = vi.spyOn(window, 'postMessage').mockImplementation(() => {});
    });

    afterEach(() => {
        dispatchExtensionMessage({
            kind: 'panel:disconnected',
        });
        getBindings().slice().forEach(binding => (binding as Devtools).dispose());
        scene.destroy();
        el.remove();
        factory.set({
            createContext: undefined,
        });
        vi.restoreAllMocks();
    });

    test('Should send bridge:hello and context:added on creation', () => {
        const devtools = createDevtools(scene.context, scene);

        const hellos = getMessagesOfKind('bridge:hello');
        const added = getMessagesOfKind('context:added');

        expect(hellos.length).toBe(1);
        expect(added.length).toBe(1);
        expect(added[0].context.contextId).toBe(devtools.id);
        expect(added[0].context.hasScene).toBe(true);
        expect(added[0].context.hasRenderer).toBe(false);
        expect(added[0].context.contextType).toBe(scene.context.type);
    });

    test('Should re-announce on pageshow only after a bfcache restore', () => {
        createDevtools(scene.context, scene);

        const dispatchPageShow = (persisted: boolean) => {
            const event = new Event('pageshow');

            Object.defineProperty(event, 'persisted', {
                value: persisted,
            });

            window.dispatchEvent(event);
        };

        dispatchPageShow(false);
        expect(getMessagesOfKind('bridge:hello').length).toBe(1);
        expect(getMessagesOfKind('context:added').length).toBe(1);

        dispatchPageShow(true);
        expect(getMessagesOfKind('bridge:hello').length).toBe(2);
        expect(getMessagesOfKind('context:added').length).toBe(2);
    });

    test('Should send no tree traffic before the panel connects', async () => {
        createDevtools(scene.context, scene);

        scene.add([createTestRect(), createTestRect(40, 40)]);

        await new Promise(resolve => requestAnimationFrame(resolve));
        await wait(80);

        expect(getTreeMessages()).toEqual([]);
    });

    test('Should stream a chunked snapshot after the panel connects', async () => {
        const devtools = createDevtools(scene.context, scene);

        scene.add([createTestRect(), createTestRect(40, 40)]);

        dispatchExtensionMessage({
            kind: 'panel:connected',
        });

        // The panel connection replays context metadata immediately.
        expect(getMessagesOfKind('context:added').length).toBe(2);

        await waitForSnapshot();

        const begins = getMessagesOfKind('tree:snapshot-begin');
        const chunks = getMessagesOfKind('tree:chunk');
        const ends = getMessagesOfKind('tree:snapshot-end');
        const nodes = chunks.flatMap(chunk => chunk.nodes);

        expect(begins.length).toBe(1);
        expect(begins[0].contextId).toBe(devtools.id);
        expect(begins[0].nodeCount).toBe(3);
        expect(ends.length).toBe(1);
        expect(ends[0].snapshotId).toBe(begins[0].snapshotId);
        expect(chunks.every(chunk => chunk.snapshotId === begins[0].snapshotId)).toBe(true);
        expect(nodes.length).toBe(3);
        expect(nodes[0].elementType).toBe('scene');
        expect(nodes[0].parentId).toBeNull();
    });

    test('Should stream a fresh snapshot when the scene graph changes while connected', async () => {
        createDevtools(scene.context, scene);

        dispatchExtensionMessage({
            kind: 'panel:connected',
        });

        await waitForSnapshot();

        scene.add(createTestRect());

        await waitForSnapshot(2);

        const begins = getMessagesOfKind('tree:snapshot-begin');

        expect(begins.length).toBe(2);
        expect(begins[1].nodeCount).toBe(2);
        expect(begins[1].snapshotId).toBeGreaterThan(begins[0].snapshotId);
    });

    test('Should stop streaming after the panel disconnects', async () => {
        createDevtools(scene.context, scene);

        dispatchExtensionMessage({
            kind: 'panel:connected',
        });

        await waitForSnapshot();

        dispatchExtensionMessage({
            kind: 'panel:disconnected',
        });

        postMessageSpy.mockClear();
        scene.add(createTestRect());

        await wait(80);

        expect(getTreeMessages()).toEqual([]);
    });

    test('Should start streaming immediately when created while the panel is connected', async () => {
        createDevtools(scene.context, scene);

        dispatchExtensionMessage({
            kind: 'panel:connected',
        });

        await waitForSnapshot();

        const otherEl = document.createElement('div');

        document.body.appendChild(otherEl);

        const otherScene = createScene(otherEl);
        const other = createDevtools(otherScene.context, otherScene);

        await vi.waitFor(() => {
            const begins = getMessagesOfKind('tree:snapshot-begin');

            expect(begins.some(begin => begin.contextId === other.id)).toBe(true);
        });

        other.dispose();
        otherScene.destroy();
        otherEl.remove();
    });

    test('Should replay context:added on state:request without snapshots', async () => {
        createDevtools(scene.context, scene);

        postMessageSpy.mockClear();

        dispatchExtensionMessage({
            kind: 'state:request',
        });

        expect(getMessagesOfKind('context:added').length).toBe(1);

        await wait(80);

        expect(getTreeMessages()).toEqual([]);
    });

    test('Should send a snapshot on tree:request', async () => {
        const devtools = createDevtools(scene.context, scene);

        scene.add(createTestRect());

        dispatchExtensionMessage({
            kind: 'tree:request',
            contextId: devtools.id,
        });

        await waitForSnapshot();

        expect(getMessagesOfKind('tree:snapshot-begin')[0].nodeCount).toBe(2);
    });

    test('Should send context:updated when the context resizes', () => {
        const devtools = createDevtools(scene.context, scene);

        scene.context.emit('resize', null);

        const updated = getMessagesOfKind('context:updated');

        expect(updated.length).toBe(1);
        expect(updated[0].context.contextId).toBe(devtools.id);
    });

    test('Should mutate the element and stream tree:props on element:set-property', async () => {
        const devtools = createDevtools(scene.context, scene);
        const rect = createTestRect();

        scene.add(rect);

        dispatchExtensionMessage({
            kind: 'panel:connected',
        });

        await waitForSnapshot();

        dispatchExtensionMessage({
            kind: 'element:set-property',
            contextId: devtools.id,
            elementId: rect.id,
            key: 'fill',
            value: '#ff0000',
        });

        expect(rect.fill).toBe('#ff0000');

        await vi.waitFor(() => {
            expect(getMessagesOfKind('tree:props').length).toBe(1);
        });

        const [props] = getMessagesOfKind('tree:props');
        const update = props.updates.find(entry => entry.elementId === rect.id);
        const fill = update?.properties.find(property => property.key === 'fill');

        expect(props.contextId).toBe(devtools.id);
        expect(update).toBeDefined();
        expect(fill?.value).toBe('#ff0000');
        expect(fill?.valueType).toBe('color');
    });

    test('Should ignore element:set-property for unknown keys', () => {
        const devtools = createDevtools(scene.context, scene);
        const rect = createTestRect();

        scene.add(rect);

        dispatchExtensionMessage({
            kind: 'element:set-property',
            contextId: devtools.id,
            elementId: rect.id,
            key: 'render',
            value: 'clobbered',
        });

        expect(typeof rect.render).toBe('function');
    });

    test('Should apply renderer debug flags on renderer:set-debug', () => {
        const renderer = createRenderer(scene, {
            autoStart: false,
        });

        const devtools = createDevtools(scene.context, scene, renderer);

        postMessageSpy.mockClear();

        dispatchExtensionMessage({
            kind: 'renderer:set-debug',
            contextId: devtools.id,
            debug: {
                fps: true,
                elementCount: false,
                boundingBoxes: false,
            },
        });

        const updated = getMessagesOfKind('context:updated');

        expect(renderer.debug.fps).toBe(true);
        expect(renderer.debug.elementCount).toBe(false);
        expect(updated.length).toBe(1);
        expect(updated[0].context.rendererDebug?.fps).toBe(true);
    });

    test('Should return element details on element:inspect', () => {
        const devtools = createDevtools(scene.context, scene);
        const rect = createTestRect();

        scene.add(rect);
        rect.on('click', () => {});

        dispatchExtensionMessage({
            kind: 'element:inspect',
            contextId: devtools.id,
            elementId: rect.id,
        });

        const details = getMessagesOfKind('element:detail');

        expect(details.length).toBe(1);

        const [detail] = details;
        const clickEvent = detail.events.find(event => event.type === 'click');
        const dragEvent = detail.events.find(event => event.type === 'drag');

        expect(detail.elementId).toBe(rect.id);
        expect(detail.properties.some(property => property.key === 'x')).toBe(true);
        expect(clickEvent?.hasListeners).toBe(true);
        expect(dragEvent?.hasListeners).toBe(false);
        expect(detail.events.length).toBe(rect.$events.length);
        expect(detail.boundingBox).toEqual({
            left: 10,
            top: 10,
            width: 20,
            height: 20,
        });
    });

    test('Should surface custom subclass events declared via $events', () => {
        interface CustomEventMap extends ElementEventMap {
            beacon: null;
        }

        class CustomElement extends Element<BaseElementState, CustomEventMap> {
            public get $events(): (keyof CustomEventMap)[] {
                return [...super.$events, 'beacon'];
            }
        }

        const devtools = createDevtools(scene.context, scene);
        const custom = new CustomElement('custom', {});

        scene.add(custom);

        dispatchExtensionMessage({
            kind: 'element:inspect',
            contextId: devtools.id,
            elementId: custom.id,
        });

        const [detail] = getMessagesOfKind('element:detail');
        const beacon = detail.events.find(event => event.type === 'beacon');

        expect(beacon).toBeDefined();
        expect(beacon?.hasListeners).toBe(false);
    });

    test('Should show and clear the highlight overlay', () => {
        const devtools = createDevtools(scene.context, scene);
        const rect = createTestRect();

        scene.add(rect);

        const getOverlay = () => Array
            .from(document.body.querySelectorAll('div'))
            .find(div => div.style.zIndex === '2147483646');

        dispatchExtensionMessage({
            kind: 'element:highlight',
            contextId: devtools.id,
            elementId: rect.id,
        });

        expect(getOverlay()).toBeDefined();

        dispatchExtensionMessage({
            kind: 'element:highlight-clear',
        });

        expect(getOverlay()).toBeUndefined();
    });

    test('Should return the existing binding for an already-bound context', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const first = createDevtools(scene.context, scene);
        const second = createDevtools(scene.context, scene);

        expect(second).toBe(first);
        expect(warn).toHaveBeenCalledTimes(1);
        expect(getBindings().length).toBe(1);
    });

    test('Should detach listeners and send context:removed on dispose', async () => {
        const devtools = createDevtools(scene.context, scene);

        dispatchExtensionMessage({
            kind: 'panel:connected',
        });

        await waitForSnapshot();

        postMessageSpy.mockClear();
        devtools.dispose();

        const removed = getMessagesOfKind('context:removed');

        expect(removed.length).toBe(1);
        expect(removed[0].contextId).toBe(devtools.id);
        expect(getBindings()).toEqual([]);

        postMessageSpy.mockClear();
        scene.add(createTestRect());

        dispatchExtensionMessage({
            kind: 'tree:request',
            contextId: devtools.id,
        });

        await wait(80);

        expect(getBridgeMessages()).toEqual([]);

        // Repeated disposal is a no-op.
        devtools.dispose();

        expect(getMessagesOfKind('context:removed').length).toBe(0);
    });

    test('Should dispose the binding when the scene is destroyed', () => {
        createDevtools(scene.context, scene);

        postMessageSpy.mockClear();
        scene.destroy();

        expect(getMessagesOfKind('context:removed').length).toBe(1);
        expect(getBindings()).toEqual([]);
    });

    test('Should advertise the events capability on context:added', () => {
        createDevtools(scene.context, scene);

        expect(getMessagesOfKind('context:added')[0].context.capabilities).toContain('events');
    });

    test('Should report the Ripl version on context:added', () => {
        createDevtools(scene.context, scene);

        expect(getMessagesOfKind('context:added')[0].context.riplVersion).toBe(RIPL_VERSION);
    });

    // The context re-emits the DOM's pointer stream, so recording it duplicates the element's own.
    test('Should not record pointer events emitted on the context', async () => {
        const devtools = createDevtools(scene.context, scene);

        startEvents(devtools.id);
        postMessageSpy.mockClear();

        scene.context.emit('mousemove', {
            x: 1,
            y: 2,
        });

        await wait(EVENT_FLUSH_INTERVAL * 2);

        expect(getMessagesOfKind('events:batch')).toEqual([]);
    });

    test('Should still record non-pointer context events', async () => {
        const devtools = createDevtools(scene.context, scene);

        startEvents(devtools.id);
        postMessageSpy.mockClear();

        scene.context.emit('resize', null);

        await wait(EVENT_FLUSH_INTERVAL * 2);

        const [batch] = getMessagesOfKind('events:batch');

        expect(batch.events.map(event => event.type)).toEqual(['resize']);
        expect(batch.events[0].source).toBe('context');
    });

    test('Should still record pointer events emitted on an element', async () => {
        const devtools = createDevtools(scene.context, scene);

        const rect = createTestRect();

        scene.add(rect);
        startEvents(devtools.id);
        postMessageSpy.mockClear();

        rect.emit('mousemove', {
            x: 1,
            y: 2,
        });

        await wait(EVENT_FLUSH_INTERVAL * 2);

        const [batch] = getMessagesOfKind('events:batch');

        expect(batch.events[0].type).toBe('mousemove');
        expect(batch.events[0].source).toBe('element');
        expect(batch.events[0].elementId).toBe(rect.id);
    });

    test('Should not record events until the devtools asks for them', async () => {
        createDevtools(scene.context, scene);

        const rect = createTestRect();

        scene.add(rect);
        postMessageSpy.mockClear();
        rect.emit('click', {
            x: 1,
            y: 2,
        });

        await wait(EVENT_FLUSH_INTERVAL * 2);

        expect(getMessagesOfKind('events:batch')).toEqual([]);
    });

    test('Should record element events bubbled to the scene, attributed to their target', async () => {
        const devtools = createDevtools(scene.context, scene);

        const rect = createTestRect();

        scene.add(rect);
        startEvents(devtools.id);
        postMessageSpy.mockClear();

        rect.emit('click', {
            x: 1,
            y: 2,
        });

        await wait(EVENT_FLUSH_INTERVAL * 2);

        const [batch] = getMessagesOfKind('events:batch');
        const [event] = batch.events;

        expect(event.type).toBe('click');
        expect(event.source).toBe('element');
        expect(event.elementId).toBe(rect.id);
        expect(event.elementType).toBe('rect');
        expect(event.bubbled).toBe(true);
        expect(event.data.map(property => property.key)).toEqual(['x', 'y']);
        expect(event.data.every(property => !property.editable)).toBe(true);
    });

    test('Should exclude filtered event types page-side', async () => {
        const devtools = createDevtools(scene.context, scene);

        const rect = createTestRect();

        scene.add(rect);
        startEvents(devtools.id, ['updated']);
        postMessageSpy.mockClear();

        rect.fill = '#ffffff';
        rect.emit('click', {
            x: 1,
            y: 2,
        });

        await wait(EVENT_FLUSH_INTERVAL * 2);

        const types = getMessagesOfKind('events:batch').flatMap(batch => batch.events.map(event => event.type));

        expect(types).toContain('click');
        expect(types).not.toContain('updated');
    });

    test('Should apply a replacement filter without restarting the recording', async () => {
        const devtools = createDevtools(scene.context, scene);

        const rect = createTestRect();

        scene.add(rect);
        startEvents(devtools.id);

        dispatchExtensionMessage({
            kind: 'events:set-filter',
            contextId: devtools.id,
            excluded: ['click'],
        });

        postMessageSpy.mockClear();
        rect.emit('click', {
            x: 1,
            y: 2,
        });
        rect.emit('mouseenter', null);

        await wait(EVENT_FLUSH_INTERVAL * 2);

        const types = getMessagesOfKind('events:batch').flatMap(batch => batch.events.map(event => event.type));

        expect(types).toContain('mouseenter');
        expect(types).not.toContain('click');
    });

    test('Should report events dropped once the page-side buffer is full', async () => {
        const devtools = createDevtools(scene.context, scene);

        const rect = createTestRect();

        scene.add(rect);
        startEvents(devtools.id);
        postMessageSpy.mockClear();

        const overflow = 5;

        for (let index = 0; index < EVENT_BUFFER_LIMIT + overflow; index++) {
            rect.emit('mouseenter', null);
        }

        await wait(EVENT_FLUSH_INTERVAL * 2);

        const [batch] = getMessagesOfKind('events:batch');

        expect(batch.dropped).toBe(overflow);
        expect(batch.events.length).toBe(EVENT_BUFFER_LIMIT);
    });

    test('Should stop recording on events:stop', async () => {
        const devtools = createDevtools(scene.context, scene);

        const rect = createTestRect();

        scene.add(rect);
        startEvents(devtools.id);

        dispatchExtensionMessage({
            kind: 'events:stop',
            contextId: devtools.id,
        });

        postMessageSpy.mockClear();
        rect.emit('click', {
            x: 1,
            y: 2,
        });

        await wait(EVENT_FLUSH_INTERVAL * 2);

        expect(getMessagesOfKind('events:batch')).toEqual([]);
    });

    test('Should stop recording when the panel disconnects', async () => {
        const devtools = createDevtools(scene.context, scene);

        const rect = createTestRect();

        scene.add(rect);
        startEvents(devtools.id);

        dispatchExtensionMessage({
            kind: 'panel:disconnected',
        });

        postMessageSpy.mockClear();
        rect.emit('click', {
            x: 1,
            y: 2,
        });

        await wait(EVENT_FLUSH_INTERVAL * 2);

        expect(getMessagesOfKind('events:batch')).toEqual([]);
    });

    // Observing a bus must stay invisible to hit testing, which dispatches only to elements that `has` the event.
    test('Should not make recorded elements look like pointer-event targets', () => {
        const devtools = createDevtools(scene.context, scene);

        const rect = createTestRect();

        scene.add(rect);
        startEvents(devtools.id);

        expect(scene.has('click')).toBe(false);
        expect(rect.has('click')).toBe(false);
    });

});
