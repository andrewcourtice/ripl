# Ripl Devtools Extension

Chrome (Manifest V3) extension providing rich devtools for [Ripl](https://www.ripl.run): a devtools **Ripl** panel with two tabs — **Elements** (live element tree, editable properties, renderer debug switches, listener info) and **Events** (a Ripl-drawn timeline, event list, and payload details) — plus a toolbar icon that lights up when Ripl is detected on the page.

Event recording rides on `EventBus`'s `'*'` wildcard subscription, which is invisible to `has()`, so observing a scene never turns its elements into hit-test targets. `updated`, `render` and `tick` are filtered out page-side by default, as are the pointer events the context re-emits from the DOM — the elements they reach already record them as they bubble.

Pages opt in by calling [`createDevtools`](../../packages/devtools) from `@ripl/devtools` — see that package's README for the page-side setup.

## Architecture

```
page (@ripl/devtools bridge)
  ⇅ window.postMessage (versioned envelopes)
content script (all_urls, document_start, ~1 KB, inert until Ripl announces)
  ⇅ chrome.runtime port
background service worker (per-tab context registry, action icon state, message router)
  ⇅ chrome.runtime ports
devtools panel · popup
```

Module preloading is off (`build.modulePreload: false`). Vite stamps `crossorigin` on the `<link rel="modulepreload">` tags it injects, and Chrome cannot match those to the module fetch on a `chrome-extension://` page — it discards the preload and warns on every page load. Every asset here is a local extension resource read from disk, so preloading saves no round trip anyway, and disabling it also drops Vite's preload polyfill, which no-ops on Chrome.

The two script entries — `src/background/service-worker.ts` and `src/content/content-script.ts` — **must keep distinct file basenames**. `@crxjs/vite-plugin` emits each manifest entry with `name: basename(file)`, and Rolldown derives the chunk's reference id by hashing that name, so two entries both called `index.ts` collide on one id and the service-worker loader ends up importing the content script — which dies on `window` at module scope. `scripts/verify-bundle.mjs` runs after every build and fails if that happens again.

## Development

```bash
# from the repo root
yarn install

# build the extension to apps/devtools-extension/dist
yarn workspace @ripl/devtools-extension build

# serve the example page (two Ripl contexts, animation, 2000-element stress test)
yarn workspace @ripl/devtools-extension dev:example
```

### Loading unpacked

1. Run the build (above).
2. Open `chrome://extensions`, enable **Developer mode**.
3. **Load unpacked** → select `apps/devtools-extension/dist`.
4. Open the example page (`dev:example`), then open Chrome devtools → **Ripl** panel. The toolbar icon turns blue when Ripl is detected; clicking it lists the detected contexts.

### Manual checklist

Everything touching `chrome.*` is verified by hand:

1. **Elements** — expand all, scroll a long row sideways, select a `circle` and confirm the Built-in badge and its docs link. An element whose type Ripl does not ship gets neither.
2. **Elements filter** — search for an element nested in a group and confirm its groups stay visible; clear the filter and confirm the tree returns to the expansion you left it in.
3. **Events** — click the chip and drag the green handle, then select an event and read its payload and **Show in Elements**. Pointer events appear once, attributed to the element, never twice.
4. **Scrub window** — drag each handle and the window body; the list count follows the window, and the timeline keeps the full time extent. A click without movement still selects the nearest event.
5. **Events filter** — search and pick a type; the list narrows while the timeline keeps every mark.
6. Tick `updated` in the toolbar and confirm rows appear; untick and confirm they stop.
7. Confirm the Ripl version shows in the toolbar popup and in the properties panel's Context section.
8. Switch back to **Elements** and confirm the event count stops growing.
9. Reload the page mid-session and confirm the panel recovers.
10. Against a page pinned to a published `@ripl/devtools` without event support, confirm Elements still works and Events shows the upgrade notice.

### Icons

`public/icons/*.png` are generated from `assets/logo/Ripl 512.svg` (blue `#459BF1` active set, gray `#9AA0A6` inactive set). Regenerate with:

```bash
node scripts/generate-icons.mjs
```

## Testing

Store and tree logic are pure TypeScript and run under the repo's root vitest:

```bash
yarn vitest run apps/devtools-extension
```

Everything touching `chrome.*` APIs is verified via the manual checklist above (build → load unpacked → example page).

## License

[MIT](../../LICENSE)
