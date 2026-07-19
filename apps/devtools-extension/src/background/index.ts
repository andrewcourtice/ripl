import type {
    BridgeMessage,
    ContextInfo,
    ExtensionMessage,
} from '@ripl/devtools';

interface TabState {
    contexts: Map<string, ContextInfo>;
    contentPort?: chrome.runtime.Port;
    panelPorts: Set<chrome.runtime.Port>;
    popupPorts: Set<chrome.runtime.Port>;
}

const CONTENT_PORT_NAME = 'ripl-content';
const PANEL_PORT_PREFIX = 'ripl-panel:';
const POPUP_PORT_PREFIX = 'ripl-popup:';

const ICON_SIZES = [16, 32, 48, 128];

const tabStates = new Map<number, TabState>();

function getTabState(tabId: number): TabState {
    let state = tabStates.get(tabId);

    if (!state) {
        state = {
            contexts: new Map(),
            panelPorts: new Set(),
            popupPorts: new Set(),
        };

        tabStates.set(tabId, state);
    }

    return state;
}

function getIconPaths(variant: 'active' | 'grey'): Record<string, string> {
    return Object.fromEntries(ICON_SIZES.map(size => [
        size.toString(),
        `icons/icon-${variant}-${size}.png`,
    ]));
}

function updateAction(tabId: number): void {
    const count = tabStates.get(tabId)?.contexts.size ?? 0;
    const variant = count > 0 ? 'active' : 'grey';
    const suffix = count === 1 ? '' : 's';
    const title = count > 0
        ? `Ripl — ${count} context${suffix} detected`
        : 'Ripl Devtools';

    chrome.action.setIcon({
        tabId,
        path: getIconPaths(variant),
    });

    chrome.action.setTitle({
        tabId,
        title,
    });
}

function sendToContent(state: TabState, message: ExtensionMessage): void {
    state.contentPort?.postMessage(message);
}

function broadcast(ports: Set<chrome.runtime.Port>, message: BridgeMessage): void {
    ports.forEach(target => target.postMessage(message));
}

function updateRegistry(state: TabState, message: BridgeMessage): void {
    switch (message.kind) {
        case 'context:added':
        case 'context:updated':
            state.contexts.set(message.context.contextId, message.context);
            break;
        case 'context:removed':
            state.contexts.delete(message.contextId);
            break;
        case 'bridge:bye':
            state.contexts.clear();
            break;
    }
}

function handleBridgeMessage(tabId: number, message: BridgeMessage): void {
    const state = getTabState(tabId);

    updateRegistry(state, message);
    updateAction(tabId);
    broadcast(state.panelPorts, message);
    broadcast(state.popupPorts, message);
}

/** Clears a tab's context registry (navigation/unload) and tells listeners the bridge is gone. */
function resetTab(tabId: number): void {
    const state = tabStates.get(tabId);

    if (!state || state.contexts.size === 0) {
        return;
    }

    state.contexts.clear();
    updateAction(tabId);

    const bye: BridgeMessage = {
        kind: 'bridge:bye',
    };

    broadcast(state.panelPorts, bye);
    broadcast(state.popupPorts, bye);
}

function replayContexts(state: TabState, port: chrome.runtime.Port): void {
    state.contexts.forEach(context => {
        const added: BridgeMessage = {
            kind: 'context:added',
            context,
        };

        port.postMessage(added);
    });
}

function parsePortTabId(name: string, prefix: string): number | undefined {
    const tabId = Number.parseInt(name.slice(prefix.length), 10);

    return Number.isNaN(tabId) ? undefined : tabId;
}

function connectContentPort(port: chrome.runtime.Port): void {
    const tabId = port.sender?.tab?.id;

    if (typeof tabId !== 'number') {
        port.disconnect();
        return;
    }

    const state = getTabState(tabId);

    state.contentPort = port;

    // A panel opened before the page's bridge connected — let it start streaming now.
    if (state.panelPorts.size > 0) {
        sendToContent(state, {
            kind: 'panel:connected',
        });
    }

    port.onMessage.addListener(message => handleBridgeMessage(tabId, message as BridgeMessage));

    port.onDisconnect.addListener(() => {
        if (state.contentPort === port) {
            state.contentPort = undefined;
        }

        resetTab(tabId);
    });
}

function connectPanelPort(port: chrome.runtime.Port, tabId: number): void {
    const state = getTabState(tabId);

    state.panelPorts.add(port);

    if (state.panelPorts.size === 1) {
        sendToContent(state, {
            kind: 'panel:connected',
        });
    }

    replayContexts(state, port);

    port.onMessage.addListener(message => sendToContent(state, message as ExtensionMessage));

    port.onDisconnect.addListener(() => {
        state.panelPorts.delete(port);

        if (state.panelPorts.size === 0) {
            sendToContent(state, {
                kind: 'panel:disconnected',
            });
        }
    });
}

function connectPopupPort(port: chrome.runtime.Port, tabId: number): void {
    const state = getTabState(tabId);

    state.popupPorts.add(port);

    replayContexts(state, port);

    // Ask the page for a fresh replay in case the registry is stale.
    sendToContent(state, {
        kind: 'state:request',
    });

    port.onMessage.addListener(message => sendToContent(state, message as ExtensionMessage));

    port.onDisconnect.addListener(() => state.popupPorts.delete(port));
}

chrome.runtime.onConnect.addListener(port => {
    if (port.name === CONTENT_PORT_NAME) {
        connectContentPort(port);
        return;
    }

    if (port.name.startsWith(PANEL_PORT_PREFIX)) {
        const tabId = parsePortTabId(port.name, PANEL_PORT_PREFIX);

        if (tabId !== undefined) {
            connectPanelPort(port, tabId);
        }

        return;
    }

    if (port.name.startsWith(POPUP_PORT_PREFIX)) {
        const tabId = parsePortTabId(port.name, POPUP_PORT_PREFIX);

        if (tabId !== undefined) {
            connectPopupPort(port, tabId);
        }
    }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.status === 'loading') {
        resetTab(tabId);
    }
});

chrome.tabs.onRemoved.addListener(tabId => {
    tabStates.delete(tabId);
});
