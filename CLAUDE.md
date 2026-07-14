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
cd app
yarn typedoc --entryPointStrategy resolve \
  --entryPoints ../packages/<pkg>/src/index.ts --tsconfig ../packages/<pkg>/tsconfig.json \
  --validation.notDocumented --excludePrivate --excludeProtected --excludeInternal --emit none \
  | grep 'does not have any documentation' | grep -v SetSignature
```

## Before you commit

- `yarn test` and `yarn lint` pass.
- New/changed public API is fully documented (above).
- Keep changes focused; no runtime dependencies without explicit approval.
