import './styles/theme.css';
import './styles/panel.css';

import PanelApp from './panel-app.vue';

import {
    initializeDevtoolsStore,
} from './composables/use-devtools-store';

import {
    createApp,
} from 'vue';

import type {
    BridgeMessage,
} from '@ripl/devtools';

const RECONNECT_DELAY = 500;

const tabId = chrome.devtools.inspectedWindow.tabId;

let port: chrome.runtime.Port | null = null;

const store = initializeDevtoolsStore(message => port?.postMessage(message));

function connect(): void {
    port = chrome.runtime.connect({
        name: `ripl-panel:${tabId}`,
    });

    store.setConnected(true);

    port.onMessage.addListener(message => store.handleMessage(message as BridgeMessage));

    // The background service worker was restarted — reconnect so the port-based
    // routing (and the registry replay) is re-established.
    port.onDisconnect.addListener(() => {
        port = null;
        store.setConnected(false);
        setTimeout(connect, RECONNECT_DELAY);
    });
}

connect();

createApp(PanelApp).mount('#app');
