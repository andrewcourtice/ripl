---
outline: "deep"
---

# Task

<p class="api-package-badge"><code>@ripl/core</code></p>

Cancellable promise with AbortController integration.

## Overview

**Classes:** [`TaskAbortError`](#taskaborterror) · [`Task`](#task)

**Type Aliases:** [`TaskResolve`](#taskresolve) · [`TaskReject`](#taskreject) · [`TaskAbortCallback`](#taskabortcallback) · [`TaskExecutor`](#taskexecutor)

### TaskAbortError `class`

Error thrown when a task is aborted, carrying the abort reason.

```ts
class TaskAbortError extends Error
```


**Constructor:**

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `reason?` | `any` |  |

**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `reason` | `any` |  |
| `name` | `string` |  |
| `message` | `string` |  |
| `stack` | `string \| undefined` |  |
| `cause` | `unknown` |  |
---

### Task `class`

A cancellable promise with `AbortController` integration, supporting abort callbacks and chaining.

```ts
class Task<TResult = void> extends Promise<TResult>
```


**Constructor:**

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `executor` | `TaskExecutor&lt;TResult&gt;` |  |
| `controller?` | `AbortController` |  |

**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `signal` | `AbortSignal` | The `AbortSignal` associated with this task's controller. |
| `hasAborted` | `boolean` | Whether this task has already been aborted. |
| `readonly __@toStringTag@81` | `string` |  |

**Methods:**

#### `abort(reason: unknown): Task&lt;TResult&gt;`

Aborts the task with an optional reason, triggering all registered abort callbacks.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `reason` | `unknown` |  |

#### `then(onfulfilled: ((value: TResult) =&gt; TResult1 \| PromiseLike&lt;TResult1&gt;) \| null \| undefined, onrejected: ((reason: any) =&gt; TResult2 \| PromiseLike&lt;TResult2&gt;) \| null \| undefined): Promise&lt;TResult1 \| TResult2&gt;`

Attaches callbacks for the resolution and/or rejection of the Promise.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `onfulfilled` | `((value: TResult) =&gt; TResult1 \| PromiseLike&lt;TResult1&gt;) \| null \| undefined` | The callback to execute when the Promise is resolved. |
| `onrejected` | `((reason: any) =&gt; TResult2 \| PromiseLike&lt;TResult2&gt;) \| null \| undefined` | The callback to execute when the Promise is rejected. |

#### `catch(onrejected: ((reason: any) =&gt; TResult \| PromiseLike&lt;TResult&gt;) \| null \| undefined): Promise&lt;TResult \| TResult&gt;`

Attaches a callback for only the rejection of the Promise.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `onrejected` | `((reason: any) =&gt; TResult \| PromiseLike&lt;TResult&gt;) \| null \| undefined` | The callback to execute when the Promise is rejected. |

#### `finally(onfinally: (() =&gt; void) \| null \| undefined): Promise&lt;TResult&gt;`

Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
resolved value cannot be modified from the callback.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `onfinally` | `(() =&gt; void) \| null \| undefined` | The callback to execute when the Promise is settled (fulfilled or rejected). |

---

### TaskResolve `type`

Callback to resolve a task with a value or promise.

```ts
type TaskResolve<TResult> = (value: TResult | PromiseLike<TResult>) => void;
```

---

### TaskReject `type`

Callback to reject a task with an optional reason.

```ts
type TaskReject = (reason?: unknown) => unknown;
```

---

### TaskAbortCallback `type`

Callback invoked when a task is aborted, receiving the abort reason.

```ts
type TaskAbortCallback = (reason?: unknown) => void;
```

---

### TaskExecutor `type`

Executor function for a task, providing resolve, reject, abort registration, and the underlying `AbortController`.

```ts
type TaskExecutor<TResult> = (
    resolve: TaskResolve<TResult>,
    reject: TaskReject,
    onAbort: (callback: TaskAbortCallback) => void,
    controller: AbortController
) => void;
```

---

