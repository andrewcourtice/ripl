# Ripl Terminal Demo

Demonstrates Ripl rendering in a Node.js terminal via `@ripl/terminal` and `@ripl/node`.

## Running

From the monorepo root:

```bash
# Static scene — circle, rect, line, text
npx tsx apps/node-demo/static.ts

# Animated shapes — circle transitions across the screen
npx tsx apps/node-demo/animated.ts

# Bar chart — full chart with axes, grid, labels
npx tsx apps/node-demo/chart.ts
```

## Requirements

- Node.js 22+
- Terminal with Unicode/braille support (most modern terminals)
- Truecolor support for full color rendering
