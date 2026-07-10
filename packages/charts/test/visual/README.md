# Chart visual-regression tests

Playwright snapshots of **all 18 charts**, used to catch visual regressions such as missing
titles, horizontally-clipped y-axis titles, legends overlapping the plot area, missing data
points, and unresolved (grey) segment colours.

The gallery (`gallery.ts` / `index.html`) renders each chart with `animation: false` and fixed
data so screenshots are deterministic. The list of charts lives in `chart-ids.ts` and is shared
by the gallery and the spec so the two never drift. `@ripl/*` packages are aliased to source via
`vite.config.ts` (and `@ripl/web` is imported for its platform side-effect), so no build step is
required.

## Running

From the repository root (requires `yarn install` to have completed):

```bash
# Generate / update baseline snapshots
yarn workspace @ripl/charts test:visual:update

# Run the comparison against the committed baselines
yarn workspace @ripl/charts test:visual
```

### Browser binary

Playwright 1.56 ships Chromium revision 1194. If Playwright's bundled browser is unavailable,
point the runner at an existing Chromium via the `CHROMIUM_PATH` env var (it is wired into
`launchOptions.executablePath`). In the managed remote environment the matching build is
pre-installed:

```bash
CHROMIUM_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome \
  yarn workspace @ripl/charts test:visual
```

Baselines are written to `__snapshots__/` and are committed. They are rendered with the
pre-installed Linux Chromium; regenerate them (`test:visual:update`) if you run on a platform
whose font rendering differs.
