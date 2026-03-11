# @ripl/vdom

Virtual DOM utilities for [Ripl](https://www.ripl.rocks) — a unified API for 2D graphics rendering in the browser.

## Installation

```bash
npm install @ripl/vdom
```

## Overview

A lightweight virtual DOM reconciler used internally by `@ripl/svg` to efficiently diff and patch SVG elements. This package is primarily an internal dependency — most users won't need to interact with it directly.

## API

### `reconcileNode(domParent, vnode, domCache, options)`

Reconciles a virtual node tree against the real DOM, creating, updating, and removing elements as needed.

### `ensureGroupPath(root, groupIds, defaultTag?)`

Ensures a nested group structure exists within the virtual tree, creating intermediate nodes as needed.

### `getAncestorGroupIds(element)`

Returns the chain of ancestor group IDs for a given element reference.

### `createVNode(id, tag, children?, element?)`

Creates a new virtual node.

## Documentation

Full documentation is available at [ripl.rocks](https://www.ripl.rocks).

## License

[MIT](../../LICENSE)
