# CLAUDE.md

This project's full coding practices, architecture, and conventions live in
[`AGENTS.md`](./AGENTS.md). **Read it before contributing** — everything there
applies here.

## Always: document the public API

When you add or change any **publicly exposed** member — a method, config
option, property, accessor, factory (`createX`), type guard, interface/type
property, enum member, or exported constant — you **must** add a JSDoc
(`/** ... */`) comment so consumers get complete IDE intellisense. An
undocumented public member is an incomplete change.

Key rules (full details in [AGENTS.md → Public API Documentation](./AGENTS.md#public-api-documentation)):

- Document every public member, **including each property** of options/config
  interfaces (`*Options`, `*State`, `*EventMap`).
- **Getter-only** for accessor pairs — document the `get`, not the `set`
  (TypeScript surfaces the getter's doc for both). Mirror the wording between an
  `XState` field and its class accessor.
- Never document `private`/`protected`/`_`-prefixed/`#` members.
- Use `{@link}` (exported symbols only), `@param`/`@returns`/`@typeParam` where
  non-trivial, and `@example` on primary entry points (`createXChart`,
  `createContext`, `createScene`, `createRenderer`, base `Chart`).
- Match the exemplars: `packages/core/src/elements/arc.ts`,
  `packages/core/src/core/scene.ts`, `packages/charts/src/charts/bar.ts`.

Verify coverage with TypeDoc's `notDocumented` validation (ignore
`SetSignature` warnings — the getter's doc covers them):

```bash
cd apps/website
yarn typedoc --entryPointStrategy resolve \
  --entryPoints ../../packages/<pkg>/src/index.ts --tsconfig ../../packages/<pkg>/tsconfig.json \
  --validation.notDocumented --excludePrivate --excludeProtected --excludeInternal --emit none \
  | grep 'does not have any documentation' | grep -v SetSignature
```

## Always: keep comments to one line

The two rules pull in opposite directions and both hold. **JSDoc on the public
API is mandatory** (above). A `//` comment inside a function body is the
opposite — the maintainer of this project writes very few, and prefers that
style. Most code you write should carry none at all.

Key rules (full details in [AGENTS.md → Comments](./AGENTS.md#comments)):

- **Never write a multi-line `//` block.** One line, or delete it. Accuracy is
  not the bar — necessity is.
- **Why, never what.** If the code already says it, the comment is noise. A
  comment earns its line by recording a browser quirk, a constraint, or the bug
  the code prevents.
- If the point will not fit on one line, **extract a named function** instead of
  writing a paragraph.
- **Do not narrate tests.** The `it('...')` title covers it; comment only the
  regression the test exists to catch.
- State a rationale **once**, at the thing it describes — never copied across
  sibling files.
- Pragmas (`eslint-disable`, `@ts-expect-error`, `TODO`) are exempt.

## Before you commit

- `yarn test`, `yarn lint` and `yarn typecheck` pass.
- New/changed public API is fully documented (above).
- No multi-line `//` comment blocks were added (above).
- Keep changes focused; no runtime dependencies without explicit approval.
