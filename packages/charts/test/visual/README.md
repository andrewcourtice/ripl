# Chart visual-regression tests

Playwright snapshots of the flagship charts, used to catch visual regressions such as missing
titles, horizontally-clipped y-axis titles, and legends overlapping the plot area.

The gallery (`gallery.ts` / `index.html`) renders each chart with `animation: false` and fixed
data so screenshots are deterministic. `@ripl/*` packages are aliased to source via
`vite.config.ts`, so no build step is required.

## Running

From the repository root (requires `yarn install` to have completed):

```bash
# Install Playwright's browser the first time (skip in environments where Chromium
# is pre-installed; instead set CHROMIUM_PATH to the existing binary).
npx playwright install chromium

# Generate / update baseline snapshots
npx playwright test -c packages/charts/test/visual/playwright.config.ts --update-snapshots

# Run the comparison
npx playwright test -c packages/charts/test/visual/playwright.config.ts
```

In the managed remote environment Chromium is pre-installed at `/opt/pw-browsers`; point the
runner at it instead of downloading:

```bash
CHROMIUM_PATH=/opt/pw-browsers/chromium npx playwright test \
  -c packages/charts/test/visual/playwright.config.ts
```

Baselines are written to `__snapshots__/`.
