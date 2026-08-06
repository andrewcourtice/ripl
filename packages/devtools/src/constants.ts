/** Current version of the devtools message protocol. Messages with a different version are ignored by both sides. */
export const PROTOCOL_VERSION = 1;

/** Envelope source identifying messages posted by the page-side devtools bridge. */
export const MESSAGE_SOURCE_BRIDGE = 'ripl-devtools-bridge';

/** Envelope source identifying messages posted by the devtools browser extension. */
export const MESSAGE_SOURCE_EXTENSION = 'ripl-devtools-extension';

/** Maximum number of serialized nodes carried by a single tree chunk message. */
export const TREE_CHUNK_SIZE = 400;

/** Interval, in milliseconds, at which coalesced element property updates are flushed to the extension. */
export const PROPS_FLUSH_INTERVAL = 100;

/** Interval, in milliseconds, at which recorded events are flushed to the extension as a batch. */
export const EVENT_FLUSH_INTERVAL = 100;

/** Maximum number of recorded events held page-side between flushes; the oldest are dropped first. */
export const EVENT_BUFFER_LIMIT = 2000;

/**
 * Event types excluded from recording unless the devtools asks for them. Each fires per frame or
 * per state write, so recording them by default would swamp the log and the transport.
 */
export const DEFAULT_EVENT_FILTER = [
    'render',
    'tick',
    'updated',
];

/**
 * Optional protocol features this bridge implements, advertised on {@link ContextInfo.capabilities}
 * so a newer devtools can detect an older bridge and degrade with an explanation rather than
 * silently showing nothing.
 */
export const DEVTOOLS_CAPABILITIES = [
    'events',
];
