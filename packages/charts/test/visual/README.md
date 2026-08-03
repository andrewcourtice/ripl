# Chart visual tests

Two Playwright suites share one Vite server and one browser:

- **`charts.spec.ts`** — snapshots of every chart against committed baselines.
- **`parity.spec.ts`** — the canvas↔SVG parity harness, which diffs the two backends **against each
  other** rather than against a baseline.

## Visual regression (`charts.spec.ts`)

Playwright snapshots of **all 18 charts**, used to catch visual regressions such as missing
titles, horizontally-clipped y-axis titles, legends overlapping the plot area, missing data
points, and unresolved (gray) segment colors.

The gallery (`gallery.ts` / `index.html`) renders each chart with `animation: false` and fixed
data so screenshots are deterministic. The list of charts lives in `chart-ids.ts` and is shared
by the gallery and the spec so the two never drift. `@ripl/*` packages are aliased to source via
`vite.config.ts` (and `@ripl/web` is imported for its platform side-effect), so no build step is
required.

## Canvas ↔ SVG parity (`parity.spec.ts`)

The audit's one outstanding deliverable: the same scene rendered through `@ripl/canvas` and
`@ripl/svg`, with the two screenshots diffed **against each other**. There is no stored baseline, so
a divergence fails even when both backends move together — and a scene both backends get equally
wrong still passes, which is the point: this suite asserts agreement, not correctness.

`parity.ts` / `parity.html` mount every scene twice, once per backend, and expose
`window.riplParity.diff`. The spec screenshots both surfaces, hands the two PNGs back into the page,
decodes them onto a canvas and counts the pixels that differ by more than the per-channel tolerance —
so the diff needs no image library. Scene ids live in `parity-ids.ts`, shared with the spec.

Seeded with the two divergences the audit named and the core/SVG work fixed: a gradient on a group
resolving against the group's composed box (`canvas.md` 3 / `svg.md` S-4), and group opacity
compositing multiplicatively (`canvas.md` 11 / `svg.md` S-5). Both currently measure a mismatch of
**0** with a maximum channel delta of 1; reverting either fix moves a quarter of the frame or more.

```bash
yarn workspace @ripl/charts test:parity
```

## Running

From the repository root (requires `yarn install` to have completed):

```bash
# Generate / update baseline snapshots
yarn workspace @ripl/charts test:visual:update

# Run the comparison against the committed baselines
yarn workspace @ripl/charts test:visual

# Diff the canvas and SVG backends against each other
yarn workspace @ripl/charts test:parity
```

`@playwright/test` is a root devDependency, so a workspace script only finds it when no other
`playwright` shadows it on `PATH`. If a run dies with "Playwright Test did not expect
test.describe() to be called here", a different Playwright is being used to load these specs —
check `which playwright` and invoke the repo's binary instead:

```bash
cd packages/charts && npx playwright test -c test/visual/playwright.config.ts parity.spec.ts
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
