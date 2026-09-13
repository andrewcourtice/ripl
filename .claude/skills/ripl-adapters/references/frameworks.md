# Seam worksheet

Answer these five before writing a component. Each has a measurement recipe, because **the answers
are implementation details, not documented guarantees**. React's deletion-cleanup order was measured
with a throwaway test rather than reasoned about, and the answer shaped the whole teardown design.

The Vue and React columns in the main skill are worked examples. The hypotheses below are starting
points for the named frameworks, not established facts — verify each one in the target version before
building on it.

## How to measure

Write a throwaway test (delete it before committing) that renders a nested tree of components, each
logging its lifecycle callbacks with a label, then drives the scenario:

```
<Outer>          log 'outer:setup' / 'outer:mount' / 'outer:cleanup'
  <Middle>       …
    <Inner>      …
```

Mount it, assert the order of the log; unmount it, assert again. Reorder a keyed list and assert
whether components remount or move. Ten minutes of this beats any amount of reading.

For the anti-clobber question, drive a real gesture in the browser rather than a unit test: mutate a
Ripl object from outside the framework (`camera.orbit(...)`, or set a state key directly), force an
unrelated re-render, and check the mutation survived.

---

## 1. Where does reactivity live?

**Question.** What box holds a value such that descendants re-read it when it changes, and what is
the cheapest box that does *not* deep-proxy its contents?

**Why it matters.** Ripl instances are deeply mutable and carry `Set`s, `Map`s and caches. A deep
proxy over one is a correctness problem, not just a cost: Vue's `reactive()` throws when a native
`#` private field is read through a proxy, which is why every class member in this repo uses the
`private` keyword with a leading underscore instead (AGENTS.md → Code Style).

**Answered.** Vue: `shallowRef` holding `markRaw(instance)`, handed down with `provide`. React: the
instance as a context value, published through `useState`.

**Hypotheses to verify.** Svelte 5: `$state.raw` for the non-deep box, `setContext`/`getContext` for
the handoff (note context is set during init only). Angular: `signal` with an identity `equal`, DI
providers for the handoff. Solid: `createSignal` with `{ equals: false }` or a store, plus
`createContext`.

**Also decide.** Whether your context mechanism needs the `Symbol.for` registry trick. Ripl's IIFE
builds inline their workspace dependencies, so two copies of an adapter on one page would otherwise
hold unequal context keys. Vue keys injection symbols with `Symbol.for`; React holds its contexts in
a `globalThis` registry under the same scheme.

---

## 2. What is the class prop called?

**Question.** What does the framework call the attribute that would normally become `class` in the
DOM, and does it reserve any of Ripl's element prop names?

**Why it matters.** `readBoundProps`, `collectChangedProps` and `applyFields` take a `classKey`.
Ripl's own `ElementOptions` field is `class`, so a differing key is renamed in the construction
snapshot only.

**Answered.** Vue: `class`. React: `className`.

**Also check** the framework's reserved prop names. `key` is reserved by every framework this repo
has met, which is why `CHART_PROP_ALIASES` binds the chart option as `keyBy`. If your framework
reserves others (`ref`, `is`, `slot`, `style`), the same treatment applies and it belongs in the
shared alias table, not in your adapter.

---

## 3. When is the initial mount over?

**Question.** Which hook runs *after* a component's descendants have mounted, so a transition scope
can call `settle()` knowing its whole set has registered?

**Why it matters.** `appear: false` must skip the enter phase for elements present at first mount.
A tree-level "mounted" flag is wrong: a context is mounted before any descendant renders, so
`appear: false` silently leaks an enter animation. See the two strict-mode tests in
`adapters/react/test/behaviour.test.ts`.

**Answered.** Vue: `onMounted` on the transition component. React: a layout effect on the transition
component.

**Hypotheses to verify.** Svelte 5: `$effect` (post-DOM) or `onMount`. Angular:
`ngAfterViewInit`, or `afterNextRender`. Solid: `onMount`.

**Test it with** the ported case *"Should still skip the enter phase of an appear-less scope"*, and
its sibling that asserts a stagger resolves against the mounted set rather than an accumulated one.

---

## 4. When can each kind of object be constructed?

**Question, in two halves.**

- Is there a phase that runs once, parent-first, synchronously, where the host element is already in
  the document? If yes (Vue's `setup()` plus a mount hook), you can do what Vue does and build
  everything in one place.
- If not, where is it safe to build a *resource-owning* object (context, scene, renderer, chart,
  camera, light) such that the work is neither discarded nor run twice?

**Why it matters.** Building a canvas or a `ResizeObserver` in a render pass the framework may throw
away leaks it. Building an element there is free, because `createCircle()` allocates an inert object
with no listeners, no parent and no DOM.

**Answered.** Vue: everything in `setup()`; the context is built against a detached host and attached
on mount. React: resources in a layout effect and published through state (which deletes the
detached-host workaround entirely), elements during render.

**Also ask.** Does the framework ever re-run effects *without* re-rendering? React's development
double-mount does, which strands an element destroyed by its own leave cleanup. React absorbs it with
a `useRiplInstance` release/renew pair: the effect body opens by rebuilding if released and returning
early. If your framework has an equivalent, it needs an equivalent guard, and a test.

---

## 5. What is the teardown order?

**Question.** When a subtree is removed, do cleanups run parent-first or child-first? If the
framework has more than one kind of effect, do all of one kind run before any of the other?

**Why it matters.** `tree.disposing` makes a leaving element destroy itself outright instead of
starting a transition the about-to-die renderer would never finish. The context must set it before
any descendant runs its leave.

**Answered.** Vue: `onBeforeUnmount` runs parent-first, so the context disposes first and everything
else stays in the same hook. React: measured as parent-first, with all layout cleanups running before
any passive cleanup — so the context's layout cleanup calling `tree.dispose()` works directly. Had it
been children-first, the fallback was to split by effect kind instead: `tree.dispose()` in the
context's layout cleanup, `transition.leave(element)` in the element's passive cleanup, which holds
regardless of tree direction.

**Test it with** the ported case *"Should not hold a leaving element when the whole tree is being
destroyed."*

---

## 6. Does a keyed reorder remount or move?

Not one of the five, but it decides how much the DOM mirror has to do.

**Question.** When a keyed list is reordered, does the framework remount the components or move them?

**Why it matters.** A move produces no mount or attach callbacks at all, so nothing in your adapter
fires and paint order would silently go stale. The tree's `MutationObserver` over the marker subtree
is what catches it.

**Answered.** Both Vue and React move rather than remount, which is why both suites carry *"Should
reorder a keyed list without remounting."* Port it.

---

## 7. Anti-clobber: does a re-render overwrite interactive state?

**Question.** Does any component of yours write props to a live Ripl object unconditionally?

**Why it matters.** This is the bug that made the React 3D demo feel frozen. `<RiplCamera>` assigned
its whole bound prop set after every commit; the demo re-rendered 60 times a second off a tick
handler, so every frame reset the camera and undid the wheel or drag. The Vue camera had the same
unconditional write, hidden only because the compiler gave the camera vnode patch flag 0 and
`shouldUpdateComponent` bailed.

**The rule.** Diff before writing, always. `collectChangedProps` for elements,
`collectChangedCameraProps` for cameras. For vector props diff **by value, not identity** — the docs
teach `position={[0, 2, 5]}` inline, which is a fresh array on every render, so identity diffing would
not have fixed it.

**Test it with** *"Should leave an interactively moved camera alone when its props are rebuilt"*,
which exists in both `adapters/react-3d/test/` and `adapters/vue-3d/test/`. It must fail without the
fix.
