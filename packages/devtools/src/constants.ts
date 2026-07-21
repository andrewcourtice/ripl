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
