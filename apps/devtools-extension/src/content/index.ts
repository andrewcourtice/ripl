import {
    createExtensionEnvelope,
    messageIsFromBridge,
} from '@ripl/devtools';

import type {
    ExtensionMessage,
} from '@ripl/devtools';

const PORT_NAME = 'ripl-content';

let port: chrome.runtime.Port | null = null;

/**
 * Lazily connects the background port on the first bridge message so the
 * service worker is only woken on pages that actually run Ripl. Reconnects
 * transparently after a service worker restart (the old port disconnects and
 * the next bridge message re-establishes it).
 */
function getPort(): chrome.runtime.Port | null {
    if (port) {
        return port;
    }

    try {
        port = chrome.runtime.connect({
            name: PORT_NAME,
        });
    } catch {
        // Extension context invalidated (extension reloaded); give up quietly.
        return null;
    }

    port.onMessage.addListener(message => {
        window.postMessage(createExtensionEnvelope(message as ExtensionMessage), '*');
    });

    port.onDisconnect.addListener(() => {
        port = null;
    });

    return port;
}

window.addEventListener('message', event => {
    if (event.source !== window || !messageIsFromBridge(event.data)) {
        return;
    }

    try {
        getPort()?.postMessage(event.data.payload);
    } catch {
        // The port raced a service worker shutdown; retry once on a fresh port.
        port = null;
        getPort()?.postMessage(event.data.payload);
    }
});
