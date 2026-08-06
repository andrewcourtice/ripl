# Devtools: compatibility pass, Events tab and Elements-pane upgrades — implementation plan

Six PRs across three tracks, each with scope, tests, docs and success criteria, for an
orchestrator to execute with a team of subagents. Every `file:line` reference was verified
against `claude/devtools-extension-updates-irwpis` at `6435485`; re-verify before editing,
because line numbers drift.

## Context

The devtools ships as two halves that must stay in lockstep:

- **`packages/devtools`** (`@ripl/devtools`) — the page-side runtime bridge an app opts
  into with `createDevtools(context, scene, renderer)`. It owns the wire protocol.
- **`apps/devtools-extension`** (`@ripl/devtools-extension`) — the Chrome MV3 extension:
  Vue 3 panel, popup, background router, content script.

Both were last touched substantively at `bb407bf`. Core has moved ~55 commits since, five
of them breaking. The reflection surface the bridge depends on — `Element.$state`
(`packages/core/src/core/element.ts:286`), `EventBus.$events` (`event-bus.ts:101`),
`Renderer.debug` (`renderer.ts:222`), `Scene.instructions` — is intact, so nothing is
catastrophically broken. The drift is narrower and concentrated in two places:

1. **Coordinate mapping.** `packages/devtools/src/highlight.ts:49-57` hand-rolls
   `rect.width / context.width` scaling. It predates `3261fd2` (hit tests take logical
   points) and `1c99239` (the device-pixel matrix now sits under a caller's transform),
   and AGENTS.md:76 now forbids exactly this shape of call-site scaling: *"Never multiply
   by `scaleX`/`scaleY` or a device pixel ratio at a call site."*
2. **Payload semantics that changed underneath the panel.** `3fd0115` made `drag`/`dragend`
   `deltaX`/`deltaY` cumulative since `dragstart` rather than per-move.

Separately, the panel has a capability gap. It can show the tree and edit properties, but
it cannot show **what actually happened**. There is no event log at all — the only
event-related thing it knows is *whether listeners exist*, computed on demand from
`element.$events` + `element.has(type)` at `packages/devtools/src/devtools.ts:312-315`.
A user debugging why a click did not land has nothing to look at.

Four Elements-pane papercuts compound this:

- Long attribute lists are truncated with no way to read them.
  `.tree-node__label` carries `overflow: hidden; text-overflow: ellipsis`
  (`tree-node.vue:108-113`) and `.tree-node` fills the viewport width, so the pseudo-XML
  view silently hides most of a rect's serialized state.
- There is no bulk expand/collapse; nothing is expanded by default
  (`use-tree.ts:185`), so every session starts by clicking chevrons.
- Nothing distinguishes a Ripl built-in from a consumer's custom element.
- There is no route from the panel to the documentation.

Intended outcome: a panel that is correct against current core, and that answers "what
fired, when, on which element, with what payload" as readily as it already answers "what
is in the scene".

## Decisions already taken

| Question | Decision |
|---|---|
| How to observe every event | **`eventBus.on('*', handler)`** — a subscribable wildcard event type on the existing `on`/`off`/`once` API, not a separate `$observe` method. |
| Protocol skew | **`PROTOCOL_VERSION` stays at `1`.** New kinds are additive and unknown kinds are already dropped by `dispatchMessage`. Support is advertised via a new optional `capabilities?: string[]` on `ContextInfo`. |
| Default event filter | **Exclude `updated`, `render`, `tick`. Keep `mousemove`.** Filtering is page-side so suppressed events never reach the wire. |
| Compatibility scope | **Drift only.** `Navigator` and `Context.export()` stay unsurfaced. |

Two constraints that shape several PRs, stated once here:

> **The wildcard must not be visible to `has()`.** `EventBus.has()` is consumed at exactly
> four hit-testing call sites — `packages/core/src/context/context.ts:793`, `:810`, and
> `packages/dom/src/context.ts:176`, `:183`. If a wildcard subscription made
> `has('click')` return `true`, an element would silently become a pointer-event target
> and the devtools would change the behaviour of the page it is observing.

> **Leaf docs pages require `.html`.** The site sets no `cleanUrls`, so
> `https://www.ripl.run/docs/core/elements/circle` returns 404 while
> `…/circle.html` returns 200. The apex `https://ripl.run/…` 308-redirects to `www` and
> then 404s on the extensionless path. Always build `https://www.ripl.run/…​.html`.

## Branches and pull requests

Six PRs in three tracks. **PR1 is a blocking barrier — everything else depends on the
wildcard and the protocol additions.** PR2, PR3 and PR6 are then independent; PR4 stacks
on PR2 (both touch `panel-app.vue`); PR5 lands last because it describes final behaviour.

| # | Branch | Title | Base | Size |
|---|---|---|---|---|
| 1 | `claude/devtools-extension-updates-irwpis` | Subscribe to every event on a bus with `on('*')` | `main` | M |
| 2 | `claude/devtools-panel-tabs` | Give the devtools panel Elements and Events tabs | PR1 | S |
| 3 | `claude/devtools-elements-pane` | Scroll element rows sideways and expand the tree in one click | PR1 | M |
| 4 | `claude/devtools-events-tab` | Show every event fired in a scene on a timeline | PR2 | L |
| 5 | `claude/devtools-docs-example` | Document the wildcard and the Events tab | PR4 | M (docs) |
| 6 | `claude/devtools-compat-audit` | Bring the devtools bridge back in line with core | PR1 | S |

PR1 reuses the session's designated branch (`claude/devtools-extension-updates-irwpis`);
the rest are cut from it as it merges. PR titles follow the repo convention
(sentence-style, no `type(scope):` prefix); commit messages use conventional commits. Use
the `ripl-pull-requests` skill for PR bodies.

---

### PR1 — Subscribe to every event on a bus with `on('*')`

**Branch** `claude/devtools-extension-updates-irwpis` ·
**Files** `packages/core/src/core/event-bus.ts`, `packages/devtools/src/protocol.ts`,
`constants.ts`, `serialize.ts`, `scheduler.ts`, `devtools.ts`

This is the foundation for the Events tab and the only PR that touches core. Land it
whole; nothing downstream can start without both the wildcard and the wire types.

#### 1a. The wildcard

`_listeners` is already `Map<keyof TEventMap, Set<EventHandler>>` (`event-bus.ts:91`), so
`'*'` is just another key. `emit` (`:152-174`) gains a second lookup after the typed one:

```ts
/** The wildcard event type. Subscribing to it receives every event emitted on the bus. */
export const EVENT_WILDCARD = '*';
```

Behaviour, each of which is a test:

- Fires for **every** type emitted on the bus, including custom types never declared in
  `$events`.
- Runs **after** the type's own handlers, once per bus. Bubbling re-enters `emit` on the
  parent (`:169-171`), so a wildcard listener on an ancestor sees descendant events with
  `event.target` still pointing at the originating bus — this is what makes a single
  subscription on the `Scene` see the whole tree.
- Honours `stopPropagation()`: an ancestor's wildcard listener does not see an event whose
  propagation was stopped below it.
- Honours `{ self: true }`, filtering bubbled events exactly as typed subscriptions do.
- `off('*', handler)` and `once('*', handler)` work through the existing paths unchanged.
- **`has(type)` must not return `true` because a wildcard listener exists** (see the
  constraint above).
- `$events` must not include `'*'`.
- `Element.on`'s override (`element.ts:642-657`) invalidates the context's tracked-element
  memo only for `TRACKED_EVENTS`; `'*'` is not in that list, so no invalidation fires.

Typing: keep `on<TEvent extends keyof TEventMap>` type-safe for concrete keys and add an
overload for `'*'` whose handler receives `Event<TEventMap[keyof TEventMap]>`.

#### 1b. Protocol additions

All new panel-facing types go in `protocol.ts` — the barrel (`src/index.ts`) exports only
`constants`, `devtools`, `protocol`, so nothing else is reachable from the extension.

- `ContextInfo` gains `capabilities?: string[]`, populated by `serializeContextInfo`
  (`serialize.ts:199`) from a new `DEVTOOLS_CAPABILITIES` constant. The background replays
  `context:added` to every new panel port (`background/index.ts:127-135`) but does **not**
  replay `bridge:hello`, so `ContextInfo` is the only reliable carrier.
- New `SerializedEvent`:

  ```ts
  export interface SerializedEvent {
      sequence: number;
      type: string;
      timestamp: number;
      source: 'element' | 'context' | 'renderer';
      elementId?: string;
      elementType?: string;
      elementClasses?: string[];
      bubbled: boolean;
      data: SerializedProperty[];
  }
  ```

  Serialize each payload key through the existing `serializeProperty`
  (`serialize.ts:81`) forced to `editable: false`. That single choice lets the details
  panel reuse `property-row.vue` verbatim — it already renders read-only via
  `:disabled="!property.editable"`.
- Bridge → extension: `events:batch` (`contextId`, `events`, `dropped`).
- Extension → bridge: `events:start`, `events:stop`, `events:set-filter`
  (`contextId`, `excluded: string[]`).
- `constants.ts` gains `DEFAULT_EVENT_FILTER = ['updated', 'render', 'tick']`,
  `EVENT_FLUSH_INTERVAL`, `EVENT_BUFFER_LIMIT`.

#### 1c. Bridge capture

- On `events:start`, subscribe `on('*')` to the scene, the context and the renderer (all
  three are `EventBus` subclasses), dropping excluded types **before** buffering.
- Add `createEventBuffer` to `scheduler.ts` as a sibling of `createPropsCoalescer`
  (`:144-189`) — same push/clear/dispose contract, same timer discipline, plus a ring
  buffer capped at `EVENT_BUFFER_LIMIT` that counts drops.
- Attribute each event from `event.target`: when it is an element in this binding's scene,
  record `elementId`/`elementType`/`elementClasses`. `bubbled` is
  `event.target !== theBusTheHandlerIsOn`.
- `events:stop`, `panel:disconnected` and `dispose()` all tear the subscriptions down. The
  binding must stay inert when the Events tab is not open — the existing
  `_panelDisposables` pattern (`devtools.ts:274-296`) is the model.

**Tests** — `packages/core/test/core/event-bus.test.ts` (repo style is `test('Should …')`)
and `packages/devtools/test/`.

- `Should invoke a wildcard listener for every event type`
- `Should invoke wildcard listeners after typed listeners`
- `Should see bubbled events on an ancestor wildcard listener with the original target`
- `Should not invoke an ancestor wildcard listener after stopPropagation`
- `Should honor the self option for wildcard listeners`
- `Should not report has() for a type with only a wildcard listener` ← load-bearing
- `Should not list the wildcard in $events`
- `Should unsubscribe a wildcard listener with off() and once()`
- devtools: excluded types never enter the buffer; overflow reports `dropped`;
  `events:stop` removes every subscription (assert via a spy that a later `emit` produces
  no batch); `capabilities` appears in `serializeContextInfo` output.

**Docs** — `apps/website/src/docs/core/advanced/events.md` gains a wildcard subsection
under `## EventBus` (`:65`). Deferred to PR5 only if PR1 would otherwise stall; preferred
here, since the core API and its docs should land together.

**Success criteria**

- [ ] `bus.on('*', handler)` receives an event emitted as `bus.emit('anything', data)`.
- [ ] `scene.on('*', …)` receives events emitted on a deep descendant, with
      `event.target` still the descendant.
- [ ] `element.on('*', …)` leaves `element.has('click')` false and does not invalidate the
      context's tracked-element cache.
- [ ] A page-side binding with the panel closed has zero wildcard subscriptions attached.
- [ ] `yarn test`, `yarn lint`, `yarn typecheck` pass.
- [ ] TypeDoc `notDocumented` reports nothing new for `@ripl/core` or `@ripl/devtools`
      (ignoring `SetSignature`).

---

### PR2 — Give the devtools panel Elements and Events tabs

**Branch** `claude/devtools-panel-tabs` · **Base** PR1 ·
**Files** `src/panel/components/panel-header.vue`, new `components/tab-bar.vue`, new
`composables/use-tabs.ts`, new `src/shared/docs.ts`, `src/panel/panel-app.vue`

Small and deliberately first among the UI PRs, because it establishes the shell both
later PRs render into.

- `use-tabs.ts` — module singleton mirroring `use-settings.ts:48-67` (a `ref` plus a
  `watch` writing `localStorage`), key `ripl-devtools:active-tab`, exposing
  `activeTab: Ref<'elements' | 'events'>`.
- Tabs render **immediately right of the logo**, inside the header's brand row
  (`panel-header.vue:3-8`). The header is 32px tall (`:47`) — tabs must not change that.
  Active tab uses `--ripl-accent`, inactive `--ripl-text-dim`.
- Help icon goes in `.panel-header__actions` (`:9`), **left of the gear**. Match the
  existing idiom exactly: inline `<svg viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">`
  rendered at 14×14, reusing the gear's button styling (generalize
  `.panel-header__settings` to `.panel-header__action`). **Do not add an icon library** —
  the extension has no `lucide` dependency and must not gain one.
- `src/shared/docs.ts` centralizes every ripl.run URL, honouring the `.html` rule above.
  Help target: `https://www.ripl.run/docs/core/advanced/devtools.html`.
  Render as `<a target="_blank" rel="noreferrer">` styled as a button.
- `panel-app.vue` switches its body on `activeTab`, rendering the existing
  `SplitPane`/`TreeView`/`PropertiesPanel` for Elements and a placeholder for Events that
  PR4 replaces. Keep the existing empty state (`:12-20`) above the tab switch — "No Ripl
  detected" should not be tab-specific.

**Success criteria**

- [ ] Tabs sit right of the logo; the header is still exactly 32px with no layout shift.
- [ ] The selected tab survives closing and reopening the panel.
- [ ] The help icon opens the devtools docs page in a new tab and returns HTTP 200.
- [ ] The Elements view is byte-for-byte unchanged in behaviour.
- [ ] `yarn lint` passes (SFC block order template→script→style is lint-enforced at
      `eslint.config.js:495-497`).

---

### PR3 — Scroll element rows sideways and expand the tree in one click

**Branch** `claude/devtools-elements-pane` · **Base** PR1 ·
**Files** `components/tree/tree-view.vue`, `tree/tree-node.vue`, new
`tree/elements-pane.vue`, `composables/use-tree.ts`,
`components/properties/properties-panel.vue`, new `properties/element-badge.vue`,
new `src/shared/elements.ts`

#### 3a. Horizontal scroll

`.tree-view` already has `overflow: auto` (`tree-view.vue:195`); the truncation is in the
row, not the viewport.

- `.tree-node { width: max-content; min-width: 100%; }` — `min-width` matters as much as
  `max-content`, or hover and selection backgrounds stop at the viewport edge instead of
  spanning the scrolled width.
- Remove `flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis` from
  `.tree-node__label` (`tree-node.vue:108-113`). Keep the comment above it explaining why
  the label is its own inline formatting context — that reason still holds.
- Give the two virtual-list spacers (`tree-view.vue:9`, `:20`) an explicit `width: 100%`,
  or they collapse to zero and the scroll width jitters as rows recycle.
- Verify `scrollRowIntoView` (`:111-127`) still only writes `scrollTop`, and that keyboard
  navigation never resets `scrollLeft`.

#### 3b. Expand and collapse all

`useTree(store)` is instantiated **inside `tree-view.vue:56`**, so its state is
component-local — a toolbar button outside that component cannot reach it. Lift it to a
module singleton exactly as `useDevtoolsStore` (`use-devtools-store.ts:395-411`) and
`useSettings` already are, then extend `UseTree`:

- `expandAll()` — every node id with children, across every context tree.
- `collapseAll()` — clears the set.

Add `elements-pane.vue` owning a slim toolbar above the tree; `panel-app.vue` renders it
in the left slot in place of `TreeView`. Keep the toolbar outside the scroll viewport.

#### 3c. Built-in badge and docs link

`src/shared/elements.ts` maps `elementType` → docs URL. Built-in ⇔ present in the map;
absence is the signal for a custom element.

| type | URL |
| --- | --- |
| `arc` `circle` `ellipse` `image` `line` `path` `polygon` `polyline` `rect` `text` | `/docs/core/elements/<type>.html` |
| `group` | `/docs/core/essentials/group.html` |
| `scene` | `/docs/core/essentials/scene.html` |
| `context` (the synthetic root from `use-tree.ts:96`) | `/docs/core/essentials/context.html` |
| `cube` `sphere` `cylinder` `cone` `plane` `torus` | `/docs/3d/shapes/<type>.html` |
| `ribbon` | `/charts/chord.html` |
| `sankey-link` | `/charts/sankey.html` |

Render in `properties-panel.vue` beside the selected element's heading: a "Built-in" chip
plus an external-link anchor. Mirror `.context-section__badge` (`context-section.vue`)
rather than inventing new chip styling.

> **Keep the badge out of tree rows.** `ROW_HEIGHT = 22` (`tree-view.vue:53`) duplicates
> `--ripl-row-height` (`theme.css:6`), and the virtual list assumes a fixed row height.
> Anything that makes a row taller or wrapping breaks scrolling silently.

**Tests** — `apps/devtools-extension/test/tree.test.ts` gains `expandAll`/`collapseAll`
cases; new `test/elements.test.ts` asserts the map covers every core built-in element type
and returns `undefined` for an unknown type.

**Success criteria**

- [ ] On the example page's spawned 2,000-element swarm, a row whose attributes exceed the
      pane width scrolls horizontally and its selection background spans the full width.
- [ ] Expand-all on that swarm renders without dropping frames; collapse-all returns to
      roots only.
- [ ] Selecting a `circle` shows the badge and a link to
      `https://www.ripl.run/docs/core/elements/circle.html` (200, with the `.html`).
- [ ] Selecting a custom-typed element shows neither badge nor link.
- [ ] Row height is still exactly 22px; keyboard navigation and virtualization are intact.

---

### PR4 — Show every event fired in a scene on a timeline

**Branch** `claude/devtools-events-tab` · **Base** PR2 ·
**Files** new `components/events/{events-pane,event-timeline,event-list,event-details}.vue`,
new `composables/use-event-log.ts`, `components/split-pane.vue`,
`composables/use-devtools-store.ts`

The largest PR. Split across subagents by the four components if needed, but land as one.

#### 4a. `split-pane.vue` gains an orientation

It is horizontal-only and hardcodes `STORAGE_KEY` and `DEFAULT_RATIO` (`:34-36`). Add
props `orientation?: 'horizontal' | 'vertical'`, `storageKey?: string`,
`defaultRatio?: number`, defaulting to today's behaviour so PR3's layout is untouched.
Vertical mode swaps `width`→`height`, `clientX`→`clientY`, `col-resize`→`row-resize` and
adds `flex-direction: column`.

#### 4b. Store

`use-devtools-store.ts` gains an event ring buffer (panel-side, independent of the
bridge's), `eventsDropped`, `selectedEvent`, senders for
`events:start`/`events:stop`/`events:set-filter`, and an `events:batch` handler in the
existing `messageHandlers` map (`:301-315`). Follow the file's manual-reactivity
discipline — bump a revision counter as `treeRevision` does (`:234`); deep reactivity is
deliberately not used here.

Streaming starts when the Events tab activates and stops when it deactivates or the panel
disconnects. Nothing streams while Elements is showing.

If the active context's `capabilities` omits `'events'`, render an "update
`@ripl/devtools` to see events" notice instead of the timeline — this is the whole point
of keeping `PROTOCOL_VERSION` at 1.

#### 4c. Timeline, built with Ripl

Top ~1/3 of a vertical split.

- `createContext` + `createScene` from `@ripl/web` (already a dependency).
- **Do not create a `Renderer`.** The timeline is not animating; call `scene.render()` on
  demand — on navigator `change`, on a throttled batch arrival, and on resize. This avoids
  a `requestAnimationFrame` loop competing with the panel's 2–8 Hz property poll
  (`panel-app.vue:56-72`) and removes all teardown and `document.hidden` risk. Dispose the
  context on unmount.
- Gestures: `createNavigator(context, { interactions: { pan: true, zoom: true } })`.
  `@ripl/web` re-exports it from `@ripl/dom`, `@ripl/web` already depends on `@ripl/dom`,
  and `vite.aliases.ts:3-11` already maps it — **no new dependency**. Consume only
  `transform.k` and `transform.x`; ignore `transform.y`, since the navigator is a
  uniform-scale view model and a timeline only zooms in time.
- Time axis: `scaleContinuous([t0, t1], [0, width])` plus
  `rescaleDomain(scale, transform, [0, width])` (`core/navigator.ts:145`) to derive the
  visible window. This is the same mechanism the cartesian charts use; do not hand-roll it.
- Lanes by `source`; one mark per event; hover readout; selecting a mark selects the event
  in the list below.

> **Time origin.** `Event.timestamp` is `factory.now()` — `performance.now()` in the
> *page's* time origin, not the panel's. Never compare it against panel-side `Date.now()`
> or `performance.now()`. Anchor the axis at the first event of the current recording and
> render everything relative to it (`+123.4ms`).

#### 4d. List and details

- Bottom ~2/3: a virtualized list reusing `use-virtual-list.ts` at `--ripl-row-height`.
  Columns: event name, timestamp, element.
- Right panel mirroring the Elements properties panel — reuse `split-pane.vue` for the
  outer horizontal split and **reuse `property-row.vue`** for the payload, which renders
  read-only for free because payload properties carry `editable: false`.
- Clicking the element in the details panel switches to the Elements tab and selects it.
  Note `panel.css:19` sets `user-select: none` panel-wide; allow selection inside the
  payload so values can be copied.

**Tests** — new `apps/devtools-extension/test/events.test.ts`: batch ingestion, ring-buffer
eviction, dropped-count surfacing, selection, and the capability gate.

**Success criteria**

- [ ] With the example page open and Events active, moving the pointer over the canvas
      produces context-level `mousemove` rows in real time.
- [ ] Clicking the example's `chip` produces a `click` row attributed to that element.
- [ ] `updated`, `render` and `tick` are absent by default, and re-enabling one changes
      what arrives **over the wire**, not just what is displayed (assert the bridge-side
      filter in a unit test).
- [ ] The timeline scrubs by drag and zooms by wheel; windowing the timeline does not
      filter the list.
- [ ] Selecting a `drag` event shows `x, y, startX, startY, deltaX, deltaY`.
- [ ] Switching back to Elements stops the stream — no `events:batch` arrives.
- [ ] A page on the published `@ripl/devtools@1.0.0` (no `capabilities`) shows the upgrade
      notice, and its Elements tab still works unchanged.

---

### PR5 — Document the wildcard and the Events tab

**Branch** `claude/devtools-docs-example` · **Base** PR4 ·
**Files** `apps/website/src/docs/core/advanced/events.md`, `…/devtools.md`,
`packages/devtools/README.md`, `apps/devtools-extension/README.md`,
`apps/devtools-extension/example/main.ts`, `tsconfig.typecheck.json`

- **`events.md`** — the wildcard section under `## EventBus` (`:65`) if PR1 did not land
  it: `on('*', handler)`, that it fires after typed handlers, and that it does not affect
  `has()` or hit testing. While there, fix `## Event Bubbling` (`:198`), which shows
  `event.source.type`; the property is `event.target`.
- **`devtools.md`** — the Events tab, and the `capabilities` handshake including the
  older-`@ripl/devtools` degradation path.
- **Both READMEs** — new panel features; the extension README's manual checklist
  (`:53-55`) gains the Events-tab steps.
- **`example/main.ts`** — must exercise the new tab. Only `chip` has a listener today
  (`:113`), and pointer events are only *emitted on an element* that has one, because
  `Context.hitTest` filters by `element.has(event)` (`context.ts:810`). Add hover, drag and
  click handlers across several elements so the Events tab shows element-attributed
  traffic rather than only context-level noise.
- **`tsconfig.typecheck.json`** covers only `packages/*/src/**/*.ts`, so the extension app
  is never typechecked by `yarn typecheck`. Add `apps/devtools-extension/src/**/*.ts`.
  Full `.vue` checking needs `vue-tsc`; propose it as a follow-up rather than adding a
  devDependency here.

**Success criteria**

- [ ] `yarn workspace @ripl/website build` succeeds and both edited pages render.
- [ ] Every docs link added by PR2 and PR3 returns 200.
- [ ] The example page produces at least one element-attributed event per interaction type
      (click, hover, drag).
- [ ] `yarn typecheck` now covers the extension's `.ts` sources and passes.

---

### PR6 — Bring the devtools bridge back in line with core

**Branch** `claude/devtools-compat-audit` · **Base** PR1 ·
**Files** `packages/devtools/src/highlight.ts`, `serialize.ts`,
`packages/devtools/test/highlight.test.ts`

Independent of the feature PRs and safe to run in parallel.

1. **Highlight coordinate mapping** (`highlight.ts:49-57`). Audit against `3261fd2` and
   `1c99239`. Two facts to reason from: `Navigator` is a *view model* that does not apply
   a context transform automatically, so a panned scene's boxes are already correct via
   `getBoundingBox()`; and abstract elements never enter `renderedElements`
   (`context.ts:157-162`). Verify with a test that a CSS-scaled canvas highlights the
   right region. **Fix only if genuinely wrong**, and if so route through
   `Context.toLogicalPoint`/`toSurfacePoint` (`context.ts:697`, `:710`) rather than
   reading `scaleX`/`scaleY`, per AGENTS.md:76.
2. **New context types.** `serializeContextInfo` passes `context.type` straight through,
   so `canvas3d`, `webgpu` and `terminal` already flow. Confirm `context-section.vue`'s
   `[data-type]` badge has a sane fallback for a type it has no rule for.
3. **Drag payload semantics.** `3fd0115` made the deltas cumulative. Nothing in the bridge
   interprets them, but PR4 now displays them — ensure the wording says "total since
   `dragstart`", not "since last move".
4. **`attached` / `detached`.** Declared in `ElementEventMap` (`element.ts:95-99`) and
   listed by `$events`, but never emitted anywhere in core, so `events-section.vue` shows
   dots that can never light. Record an explicit verdict — either stop listing them or
   document the gap. **Do not change core to emit them**; that is a separate design call.
5. Produce a short written audit in the PR body: every core API the bridge touches, with a
   verdict per item. That audit is the deliverable for "compatible with the latest library
   changes".

**Success criteria**

- [ ] Every item above has an explicit verdict recorded in the PR body.
- [ ] `packages/devtools/test/highlight.test.ts` gains a case pinning whichever mapping is
      correct, on a CSS-scaled canvas.
- [ ] Hovering a tree row on the example page's SVG *and* canvas contexts places the
      overlay exactly over the element.

---

## Verification

No `node_modules` in this sandbox — start with `yarn install` at the repo root.

```bash
# gates, all must pass before every commit
yarn test
yarn lint
yarn typecheck

# focused
yarn vitest run packages/core packages/devtools apps/devtools-extension

# public-API doc coverage for each package touched
cd apps/website
yarn typedoc --entryPointStrategy resolve \
  --entryPoints ../../packages/core/src/index.ts --tsconfig ../../packages/core/tsconfig.json \
  --validation.notDocumented --excludePrivate --excludeProtected --excludeInternal --emit none \
  | grep 'does not have any documentation' | grep -v SetSignature

# build and run
yarn workspace @ripl/devtools-extension build
yarn workspace @ripl/devtools-extension dev:example
```

**Manual checklist.** Everything touching `chrome.*` is unit-untestable by design and the
repo already defers it here (`apps/devtools-extension/README.md:55`):

1. `chrome://extensions` → Developer mode → **Load unpacked** → `apps/devtools-extension/dist`.
2. Open the example page; the toolbar icon turns blue and the popup lists 2 contexts.
3. Devtools → **Ripl** panel. Elements tab: expand-all, scroll a long row sideways, select
   a `circle` → Built-in badge and a working docs link.
4. Events tab: move the pointer over the canvas (context `mousemove`), click the `chip`
   (element-attributed `click`), drag the timeline, wheel-zoom it, select an event and read
   its payload, then click through to the element in Elements.
5. Enable `updated` in the filter → rows appear; disable → they stop.
6. Switch back to Elements and confirm the event count stops growing.
7. Reload the page mid-session and confirm the `bridge:bye`/`hello` recovery path.
8. Backward compatibility: serve a page pinned to the published `@ripl/devtools@1.0.0` and
   confirm Elements works unchanged while Events shows the upgrade notice.

## Non-goals

- Surfacing `Navigator` (transform/brush state, `zoom`/`pan`/`brush` events) — needs a
  public change to `createDevtools`'s signature.
- Surfacing `Context.export()` as a "capture surface" panel action.
- `vue-tsc` for full SFC typechecking.
- Making core emit `attached`/`detached`, which `$events` already advertises.
- Auto-discovery of unbound scenes; `createDevtools` stays an explicit opt-in.
