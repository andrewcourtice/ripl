import {
    afterEach,
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import {
    MESSAGE_SOURCE_BRIDGE,
    PROTOCOL_VERSION,
} from '../src/constants';

import {
    createBridgeEnvelope,
    createExtensionEnvelope,
} from '../src/protocol';

import {
    onExtensionMessage,
    sendBridgeMessage,
} from '../src/transport';

describe('Transport', () => {

    afterEach(() => {
        vi.restoreAllMocks();
    });

    test('Should wrap outgoing messages in a versioned bridge envelope', () => {
        const postMessage = vi.spyOn(window, 'postMessage');

        sendBridgeMessage({
            kind: 'bridge:hello',
        });

        expect(postMessage).toHaveBeenCalledTimes(1);
        expect(postMessage).toHaveBeenCalledWith({
            source: MESSAGE_SOURCE_BRIDGE,
            version: PROTOCOL_VERSION,
            payload: {
                kind: 'bridge:hello',
            },
        }, '*');
    });

    test('Should invoke the handler for well-formed extension envelopes', () => {
        const handler = vi.fn();
        const subscription = onExtensionMessage(handler);

        window.dispatchEvent(new MessageEvent('message', {
            data: createExtensionEnvelope({
                kind: 'panel:connected',
            }),
            source: window,
        }));

        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler).toHaveBeenCalledWith({
            kind: 'panel:connected',
        });

        subscription.dispose();
    });

    test('Should ignore messages from other windows', () => {
        const handler = vi.fn();
        const subscription = onExtensionMessage(handler);

        window.dispatchEvent(new MessageEvent('message', {
            data: createExtensionEnvelope({
                kind: 'panel:connected',
            }),
            source: null,
        }));

        expect(handler).not.toHaveBeenCalled();

        subscription.dispose();
    });

    test('Should ignore bridge-sourced and version-mismatched envelopes', () => {
        const handler = vi.fn();
        const subscription = onExtensionMessage(handler);

        window.dispatchEvent(new MessageEvent('message', {
            data: createBridgeEnvelope({
                kind: 'bridge:hello',
            }),
            source: window,
        }));

        window.dispatchEvent(new MessageEvent('message', {
            data: {
                ...createExtensionEnvelope({
                    kind: 'panel:connected',
                }),
                version: PROTOCOL_VERSION + 1,
            },
            source: window,
        }));

        window.dispatchEvent(new MessageEvent('message', {
            data: 'not-an-envelope',
            source: window,
        }));

        expect(handler).not.toHaveBeenCalled();

        subscription.dispose();
    });

    test('Should detach the listener on dispose', () => {
        const handler = vi.fn();
        const subscription = onExtensionMessage(handler);

        subscription.dispose();

        window.dispatchEvent(new MessageEvent('message', {
            data: createExtensionEnvelope({
                kind: 'panel:connected',
            }),
            source: window,
        }));

        expect(handler).not.toHaveBeenCalled();
    });

});
