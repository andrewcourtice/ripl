---
name: ripl-adapters
description: >-
  Build a declarative UI-framework adapter for Ripl (Svelte, Angular, Solid, Qwik, Lit, and so on) on
  the shared @ripl/adapters core, plus its 3D and charts companions. Use whenever adding a new
  adapter under adapters/, changing the framework-agnostic core under packages/adapters*, or porting
  an existing adapter's behaviour. Covers the five seams a framework has to fill, why paint order
  comes from the hidden DOM mirror rather than mount order, the element/resource construction split,
  demand-driven event subscription, the chart controller's lifecycle, the test suites to port, and
  the docs, demos and monorepo wiring that make an adapter ship-ready.
---

# Building a Ripl framework adapter

An adapter turns Ripl's imperative scene graph into components of a host framework. Ripl ships two:
`@ripl/vue` and `@ripl/react`, each with `-3d` and `-charts` companions.

**Most of an adapter is not framework code.** The state-key tables, the prop pipeline, the transition
scope, the enter/update/leave logic, the paint-ordering tree and the chart lifecycle live in
`@ripl/adapters`, `@ripl/adapters-3d` and `@ripl/adapters-charts`. A new adapter is a thin binding
over them. If you find yourself reimplementing any of it, stop: either reuse it, or widen the shared
package so both existing adapters get the change too.

Work from the closest existing adapter. Vue builds everything in `setup()` (parent-first,
synchronous, once); React has no equivalent phase and splits construction between render and layout
effects. Whichever your target framework resembles, read that one first.

## Where things live

- `packages/adapters/src/core/` — `tree.ts` (`RiplTree`, paint ordering), `transition.ts`
  (`RiplTransitionScope`), `element-transition.ts` (`createElementTransition`), `state.ts`
  (`readBoundProps`, `collectChangedProps`, `partitionProps`, `applyState`, `applyFields`),
  `events.ts` (`getBoundListeners`, `createEventForwarder`), `node-definition.ts`
  (`resolveNodeDefinition`, `elementFactory`), `constants.ts` (every state-key table),
  `class-names.ts` (`normalizeClass`, `resolveClassNames`).
- `packages/adapters-3d/src/core/` — `constants.ts` (3D key tables, `CAMERA_PROP_KEYS`,
  `LIGHT_KEYS`), `geometry.ts` (`GEOMETRY_WRITERS`), `camera.ts` (`collectChangedCameraProps`).
- `packages/adapters-charts/src/core/` — `chart-controller.ts` (`createChartController`),
  `chart-definition.ts` (`chartFactory`, `CHART_PROP_ALIASES`), `constants.ts` (all 25 charts).
- `adapters/<framework>/src/` — the binding. Mirror the React layout: `components/`,
  `core/`, a hooks/compositions entry, `types.ts`, `index.ts`.
- `adapters/<framework>/test/` — `components.test.ts` and `behaviour.test.ts`.
- `apps/website/src/docs/<framework>/` — 13 pages mirroring `docs/react/`.
- `apps/website/src/.vitepress/components/` — demo wrappers and the shared `bar-chart-demo.ts`.

`@ripl/adapters` owns the `@ripl/web` import, and with it the platform factory
(`requestAnimationFrame`, `devicePixelRatio`, `getDefaultState`, `measureText`). **Never add an
`@ripl/web` side-effect import to an adapter**: a bare side-effect import inside a
`sideEffects: false` package can be tree-shaken away, whereas the value imports in the shared package
cannot.

## Order of work

The sequence matters, because each step proves the one before it.

1. **Answer the five seams** below, by measuring. Nothing else is safe to design until they are known.
2. **Widen the shared core if you must**, as its own commit, and run the existing Vue and React
   suites untouched. They are the proof that the change was behaviour-preserving, and they only prove
   it if they run before anything new depends on it.
3. **Scaffold the package** and wire the monorepo: `tsconfig.json` paths, `vitest.config.ts` aliases,
   `tsdown.config.ts` `PEER_DEPENDENCY_GLOBALS` (so the IIFE build keeps the framework external), root
   devDependencies.
4. **Build the core adapter**, then `-3d` and `-charts` on top of it.
5. **Port both test suites**, then the docs, demos and READMEs.

Copy the manifest shape from `adapters/react/package.json`: dual `exports`, `files: ["dist"]`,
`sideEffects: false`, `"build": "tsdown"`, the shared version number, and the framework as a **peer**
dependency with a matching devDependency. Do not declare a peer the package never imports;
`@ripl/react` deliberately omits `react-dom` because it imports `react` only, and publint would be
right to flag the lie.

## The five seams

Everything framework-specific reduces to these. Answer all five before writing a component. See
[references/frameworks.md](references/frameworks.md) for the worksheet and how to *measure* each
answer rather than assume it.

| Seam | Vue | React |
| --- | --- | --- |
| Where reactivity lives | `shallowRef` + `markRaw`, provided | value in context, published through state |
| What the class prop is called | `class` | `className` |
| When the initial mount is over | `onMounted` calls `scope.settle()` | layout effect calls `scope.settle()` |
| When a Ripl object is constructed | all of it in `setup()` | elements in render, resources in a layout effect |
| Teardown order | `onBeforeUnmount` (parent-first) | layout cleanups (parent-first, before passive) |

### 1. Reactivity is yours, not the tree's

`RiplTree` holds `context`, `scene` and `renderer` as **plain properties**. Your adapter keeps
whatever reactive box the framework needs alongside them, and writes both. Never push a framework
primitive into the shared package.

### 2. The class prop is a parameter

`readBoundProps`, `collectChangedProps` and `applyFields` take a trailing `classKey`, defaulting to
`'class'`. Compose your own `ELEMENT_OPTION_KEYS` from `ELEMENT_OPTION_KEYS_BASE` and keep the result
alphabetical; both existing adapters just prepend, since `class` and `className` sort before `data`.
Ripl's own `ElementOptions` field is `class`, so if your key differs,
rename it in the construction snapshot only; later changes go through `applyFields`, which writes the
`classList` directly.

### 3. `settle()` separates *appear* from *enter*

`appear: false` must skip the enter phase for elements present at first mount. "First mount" is
scope-local, not tree-local: a context can be mounted before any descendant renders. Call
`RiplTransitionScope.settle()` from whichever hook runs **after a scope's descendants have mounted**.
Getting this wrong makes `appear: false` silently leak an enter animation.

### 4. Construction splits by what the object owns

- **A context, scene, renderer, chart, camera or light owns a real resource** (a canvas, an observer,
  an animation loop, list membership). Build it where the framework guarantees the host element is
  committed and the work will not be discarded or double-run. Render children only once it exists, so
  a descendant's hook always resolves.
- **An element owns nothing but itself.** `createCircle()` allocates an inert object with no
  listeners, no parent and no DOM, so an orphan from a discarded render is garbage. Construct it as
  early as the framework allows and only *attach* it later. That keeps element trees to a single pass
  and lets a group exist before its children need it as a parent.

### 5. Teardown order decides whether a leaving element animates

`tree.disposing` is what makes a leaving element destroy itself outright instead of starting a
transition the about-to-die renderer would never finish. The context must set it **before** any
descendant element runs its leave. Measure your framework's deletion order; if it tears down
children first, split by effect kind so the context's cleanup still runs first.

## Paint ordering: the hidden DOM mirror

Do not rely on mount order for paint order. Every element renders one `<ripl-node>` marker
(`MARKER_TAG`) into a hidden `display: none` subtree that the context renders as a sibling of the
canvas. The framework guarantees those markers land in DOM order, which is declaration order.

```
element attaches   →  parent.add(element)            membership, order possibly wrong
                   →  tree.invalidateContainer(c)    c = the marker's parentElement,
                                                     CAPTURED AT SETUP, not read at cleanup
frame buffer       →  tree.flush() → _sync(container) reads marker order, group.set(next)
```

Capture `container` when the effect runs. By cleanup time the framework may already have detached the
marker, and re-reading `parentElement` then yields `null`.

`invalidateContainer` defers through the tree's frame buffer, which is what makes a children-first
attach order harmless: every attach in the commit has run long before the next frame flushes. A
`MutationObserver` covers reorders that happen without the context re-rendering, which is what a keyed
list move produces in a framework that moves components rather than remounting them.

## Staggered enters

A phase factory receives `(element, index, length)`, and `length` must be the size of the **whole
scope**, not the siblings registered so far. If your framework attaches elements one at a time, push
each enter onto `tree.queueEnter(fn)` and let `tree.flushEnters()` drain it on a microtask: every
attach in the commit runs before the microtask, and microtasks run before any frame-buffered paint,
so no un-entered frame is ever shown. Vue does not need this because `setup()` registers the whole
set first.

## Props

```
readBoundProps(props, keys, classKey)      → construction snapshot; an unbound prop is omitted
collectChangedProps(props, keys, applied, classKey) → changed batch, or undefined; mutates `applied`
partitionProps(changed, stateKeys, paintedKeys)     → animatable state vs plain fields
applyState / applyFields                            → write them
```

Rules that fall out and belong in your docs:

- **An unbound prop is never written**, so a Ripl default or an inherited group value survives.
  Binding `undefined` is not the same as not binding.
- **Comparison is by identity.** An inline array or object literal looks like a change on every
  render. Tell consumers to hoist them.
- **Construction-only keys** (`CONSTRUCTION_ONLY_KEYS`) are read once and never synced.
- `resolveNodeDefinition(definition, optionKeys)` gives you `propKeys`, `stateKeys`, `syncKeys`,
  `constructionOnlyKeys` and `paintedKeys` for any element. `elementFactory` wraps a `createX`.

## Events

`getBoundListeners(props)` returns a `Map` of lower-cased event name to the prop key it came from.
`createEventForwarder(source)` owns the subscribe/unsubscribe diff and returns `{ sync, release }`.

**Demand-driven subscription is not an optimisation.** `Element.on` invalidates the context's
tracked-element cache for pointer events, so subscribing to everything silently makes every element a
hit-test target and changes which element receives a click. Subscribe only to what the consumer bound.

If your framework rebuilds handler identities every render, dispatch through a ref-like holder and key
the subscription on the *set* of bound names, so an inline arrow does not churn the subscription.
Invocation is always `handler(payload, event)`.

## Transitions

`createElementTransition({ tree, scope, getRenderer, writers, classKey })` returns the three phases.
Your job is only to supply the injected values. Behaviour that comes free and must not be
reimplemented: the enter target read *before* the enter state is applied, the `…:leave:…` id retag so
a key re-entering mid-fade cannot collide, forced `loop: false` on leave, single-`looping` eviction,
and the swallowed abort rejection.

## The companion packages

**3D.** `@ripl/adapters-3d` holds the key tables, `GEOMETRY_WRITERS` (payloads replaced through a
method, not an assignment), and `collectChangedCameraProps`. A 3D scene is driven by the core scene,
renderer and transition components unchanged, so re-export them. Keep: lights bound to any array
(even `[]`) clear the default rig; a 3D shape has no `zIndex`; a group's transform is a plain field,
not element state.

**Charts.** `createChartController` owns the whole lifecycle and is the single most valuable thing to
reuse. It handles `CHART_PROP_ALIASES` (`key` is reserved by every UI framework, so it is bound as
`keyBy` and renamed on the way in), the forced `autoRender: false` at construction with the first
paint held until the surface has a size, update-never-rebuild, and ownership-aware teardown
(`Chart.destroy()` calls `scene.destroy(true)` and would take someone else's context with it).

## Testing

Port both suites from the closest adapter, keeping the same `describe` names and `Should …` titles so
the three sets read as one. Use `mockCanvasContext()` and `polyfillPath2D()` from `@ripl/test-utils`,
import through the package alias, and mount with a `Probe` component that calls the hook so assertions
see what a consumer sees.

`components.test.ts` covers the tiers and graph structure. `behaviour.test.ts` covers the invariants,
and every one of these must survive the port:

- Context resolves in a descendant.
- A keyed list reorder without remount reorders the group.
- Only bound events are subscribed.
- Enter state applied immediately; `appear: false` skips it on first mount.
- A leaving element is retained until its transition finishes, and **not** retained during a
  whole-tree destroy.
- All six looping-transition cases.
- A staggered enter resolves against the whole set on the initial mount.
- The class list is not rebuilt when an unrelated prop changes.
- `interpolators` reaches the element and stays out of the sync path.
- All three nested-context isolation cases (a nested context must not inherit the enclosing scene).
- 3D: uniform `scale` writes all three axes; mesh `faces` go through `setFaces`; no `zIndex`; a group
  transform applies outside element state; **an interactively moved camera survives a re-render**.
- Charts: update-not-rebuild; `keyBy` renames to `key`; an unbound option keeps the chart default;
  binding to an enclosing context leaves it alive; a chart that made its own context destroys it.

Add whatever your framework's own hazard is, the way React added two StrictMode cases. Anything the
framework does that Vue and React do not, test it.

**A regression test must fail without its fix.** Write it first, watch it fail, then fix.

## Documentation

Three READMEs (`adapters/<framework>*/README.md`) mirroring the existing ones section for section:
badges, Features, Installation, Quick start, the three tiers, Transitions, the hooks/compositions
entry, Notes, Extending, Documentation, License.

Thirteen pages under `apps/website/src/docs/<framework>/`, same titles and structure as
`docs/react/`: `index`, `essentials/{rendering,components,transitions,events,<hooks>,examples}`,
`3d/{index,components,camera,lighting}`, `charts/{index,components}`. Each gets `title` and
`description` frontmatter, an H1, a prose lede, prop tables and a "Where to go next" list.

House style, enforced by eye rather than a linter:

- **Write for a user of that framework, not for someone comparing frameworks.** No page compares
  adapters or explains what the other one does.
- **No em dashes in prose.** The existing pages have none outside table cells and README feature
  bullets.
- **Explain mechanism only where it changes what the reader writes**, then immediately say what they
  get or what to do. Layout effects, microtasks, marker nodes and double-mount semantics belong in
  the package READMEs under `packages/adapters*`, not in a usage guide.
- Short declarative sentences. One-sentence explanations rather than three chained clauses. No
  headings that announce their own structure ("Three things differ…").

Wire the site up: `config.mts` needs three `SECTION_HUBS` entries, a nav entry, a sidebar key and
three dev `resolve.alias` entries; `apps/website/package.json` needs the packages and the framework's
runtime; `typedoc.json` needs three entry points; the packages table in `README.md` and
`docs/api/index.md` needs three rows.

### Demos

Four live demos, mounted into Vue wrapper components in `apps/website/src/.vitepress/components/` and
registered in `theme/index.ts`: quick start, bar chart, 3D scene, charts. Each keeps the site's
`.ripl-example` / `__root` / `__mount` / `__footer` chrome with controls in the footer inside a
`RiplControlGroup` (enforced by `yarn workspace @ripl/website check-demo-controls`).

The bar chart demo **must** build on `apps/website/src/.vitepress/components/bar-chart-demo.ts`,
which owns the constants, the data helpers and `createBarLayout` for every framework's version. Two
demos of the same chart that each hold their own copy of the palette and durations will drift, and
have. Your demo holds framework wiring and nothing else.

Whatever the code tab of an Examples page shows must match the demo running beside it.

## Verification

The repo requires Node >= 24.18.1, installed here under `/opt/nvm`:

```bash
export PATH="/opt/nvm/versions/node/v24.18.1/bin:$PATH"
```

Then, from the repo root:

```bash
yarn lint && yarn typecheck && yarn test
yarn build && yarn typecheck:dist
yarn workspace @ripl/website build
```

`yarn typecheck:dist` matters more than it looks: it typechecks every published `.d.ts` with
`types: []` and `skipLibCheck: false`, catching both a shared package leaking a type it never declared
and framework types arriving through anything other than the peer dependency.

**Never pipe the website build through `tail`** — it masks the exit code, and builds have appeared to
pass that way while VitePress had actually failed. Redirect to a log and check `$?`.

JSDoc coverage is a hard requirement (AGENTS.md). Run it per new package; output must be empty:

```bash
cd apps/website
yarn typedoc --entryPointStrategy resolve \
  --entryPoints ../../adapters/<framework>/src/index.ts --tsconfig ../../adapters/<framework>/tsconfig.json \
  --validation.notDocumented --excludePrivate --excludeProtected --excludeInternal --emit none \
  | grep 'does not have any documentation' | grep -v SetSignature
```

Then drive every demo in headless Chromium at
`/opt/pw-browsers/chromium-1194/chrome-linux/chrome`, asserting a non-blank canvas and **zero console
and page errors**. Three real bugs on the React port were found only this way and by nothing else.

When a gesture is part of what you are checking, read the canvas rect from inside the page
immediately before gesturing and confirm the point with `document.elementFromPoint`. A rect captured
earlier goes stale, the events land elsewhere, and the run reports working behaviour as broken.

## Pitfalls

These each cost a debugging session on the React port.

- **A prop written unconditionally on every render clobbers interactive state.** The camera took its
  props through a bare `Object.assign` after every commit, so a scene re-rendering at 60fps reset the
  camera every frame and zoom and pan looked frozen. Diff before writing, and for vector props diff
  **by value**: the docs teach `position={[0, 2, 5]}` inline, which is a fresh array each render.
- **A surface can already be sized before anything listens for a resize.** A framework that commits
  its host element before the Ripl object is built will never see the resize that would announce a
  size. Render immediately when the surface already has one, with `once('resize')` as the fallback.
  This bit the chart controller and a demo separately.
- **Deferring a demo's mount point breaks the mount.** A wrapper that hides its host until after mount
  leaves the mount ref empty when the wrapper's own mount hook runs.
- **`tree.mounted` is not "my subtree mounted".** Use `scope.settle()`; see seam 3.
- **Measure framework ordering, don't reason about it.** React's deletion-cleanup order is an
  implementation detail; a throwaway test settled it in minutes and the answer shaped the teardown
  design. Do the same for your framework.
- Prop tables, the state-key tables and the docs all have to agree. When you add a key to a shared
  table, both existing adapters inherit it.

## Commit and PR hygiene

Commits keep the conventional `type(scope): subject` format per AGENTS.md, with the attribution
trailers your session requires. Commit per logical change: the shared-core widening separately from
the adapter that needs it, so the Vue and React suites prove the core change was behaviour-preserving
before anything is built on it.

PR titles are sentences, not commit subjects — see the `ripl-pull-requests` skill.
