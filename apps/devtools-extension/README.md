# Ripl Devtools Extension

Chrome (Manifest V3) extension providing rich devtools for [Ripl](https://www.ripl.run): a devtools **Ripl** panel with a live element tree, editable properties, renderer debug switches, and event listener info, plus a toolbar icon that lights up when Ripl is detected on the page.

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

### Icons

`public/icons/*.png` are generated from `assets/logo/Ripl 512.svg` (blue `#459BF1` active set, grey `#9AA0A6` inactive set). Regenerate with:

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
