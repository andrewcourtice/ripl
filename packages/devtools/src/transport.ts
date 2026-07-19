import {
    createBridgeEnvelope,
    messageIsFromExtension,
} from './protocol';

import type {
    BridgeMessage,
    ExtensionMessage,
} from './protocol';

import {
    functionNoop,
} from '@ripl/utilities';

import type {
    Disposable,
} from '@ripl/utilities';

function getWindow(): Window | undefined {
    return typeof window === 'undefined'
        ? undefined
        : window;
}

/**
 * Posts a bridge message to the page's `window`, wrapped in a versioned bridge envelope, for
 * the devtools extension's content script to pick up. A no-op outside browser environments.
 *
 * @param message - The bridge message to post.
 */
export function sendBridgeMessage(message: BridgeMessage): void {
    getWindow()?.postMessage(createBridgeEnvelope(message), '*');
}

/**
 * Subscribes to extension messages arriving on the page's `window`, filtering out messages
 * from other windows and envelopes that are not well-formed, version-matched extension
 * envelopes. Returns a no-op disposable outside browser environments.
 *
 * @param handler - Invoked with each extension message's payload.
 * @returns A disposable that detaches the underlying `message` listener.
 */
export function onExtensionMessage(handler: (message: ExtensionMessage) => void): Disposable {
    const target = getWindow();

    if (!target) {
        return {
            dispose: functionNoop,
        };
    }

    const listener = (event: MessageEvent) => {
        if (event.source === target && messageIsFromExtension(event.data)) {
            handler(event.data.payload);
        }
    };

    target.addEventListener('message', listener);

    return {
        dispose: () => target.removeEventListener('message', listener),
    };
}
