# Chart visual tests

Three Playwright suites share one Vite server and one browser:

- **`charts.spec.ts`** — snapshots of every chart against committed baselines.
- **`parity.spec.ts`** — the canvas↔SVG parity harness, which diffs the two backends **against each
  other** rather than against a baseline.
- **`hit.spec.ts`** — canvas↔SVG hit testing, which compares what a click *reaches* rather than
  what the backends *paint*.

The directory is named for the first of those, but what the three share is needing a real browser,
not comparing pixels. `hit.spec.ts` takes no screenshots.

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

A second describe block covers `KNOWN_DIVERGENCE_SCENES` — gaps that were **decided rather than
fixed**, each asserted to stay inside a band around its measured mismatch. The assertion runs from
both sides, so a regression that widens the gap fails and so does a fix that closes it without
updating the record. Currently `group-shadow` (S-18) at 14.3% and `filter-shadow-order` (S-20) at
9.1%; see `parity-ids.ts` for why neither is fixed.

```bash
yarn workspace @ripl/charts test:parity
```

## Canvas ↔ SVG hit testing (`hit.spec.ts`)

Pins `svg.md` S-19. `SVGContext._isPointIn` used to hand `isPointInFill`/`isPointInStroke` a point
in the SVG root's user space, which SVG 2 specifies to read in the **element's own** space, so hit
testing was wrong for anything transformed. A pixel diff cannot see that, hence a separate suite.

Every scene transforms its target and clicks a point that lies inside the rendered shape but
**outside** its untransformed geometry, so a hit test that skips the mapping has to miss. Canvas maps
the point itself through `Element.getWorldTransform`, so it is the reference — and the spec asserts
canvas hits too, which is what proves the click point is valid rather than merely unreachable.

```bash
yarn workspace @ripl/charts test:hit

# Or both browser suites together, which is what CI runs
yarn workspace @ripl/charts test:browser
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

# Compare which element a click reaches on each backend
yarn workspace @ripl/charts test:hit
```

`@playwright/test` is a root devDependency, not a `@ripl/charts` one, so yarn builds no binary shim
in this workspace. Two symptoms follow from that, and both are resolution problems rather than test
failures:

- `yarn playwright …` run from `packages/charts` fails with **"Couldn't find a script named
  playwright"** — there is nothing to resolve there.
- `yarn workspace @ripl/charts test:parity` finds a `playwright` on `PATH` instead, and if it is a
  different version the specs die with **"Playwright Test did not expect test.describe() to be
  called here"**.

Run from the repository root, where the dependency is actually declared. The config derives every
path from its own location, so the working directory does not matter — this is what CI does:

```bash
yarn playwright test -c packages/charts/test/visual/playwright.config.ts parity.spec.ts hit.spec.ts
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
