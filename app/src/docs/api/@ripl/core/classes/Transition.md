[Documentation](../../../packages.md) / [@ripl/core](../index.md) / Transition

# Class: Transition

Defined in: [packages/core/src/animation/transition.ts:29](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/animation/transition.ts#L29)

A `Task`-based animation that drives a callback over time with easing, looping, and abort support.

## Extends

- [`Task`](Task.md)

## Constructors

### Constructor

> **new Transition**(`executor`, `controller?`): `Transition`

Defined in: [packages/core/src/task/index.ts:43](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/task/index.ts#L43)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `executor` | [`TaskExecutor`](../type-aliases/TaskExecutor.md)\<`void`\> |
| `controller` | `AbortController` |

#### Returns

`Transition`

#### Inherited from

[`Task`](Task.md).[`constructor`](Task.md#constructor)

## Properties

| Property | Modifier | Type | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-tostringtag"></a> `[toStringTag]` | `readonly` | `string` | [`Task`](Task.md).[`[toStringTag]`](Task.md#property-tostringtag) | node\_modules/typescript/lib/lib.es2015.symbol.wellknown.d.ts:176 |
| <a id="property-species"></a> `[species]` | `readonly` | `PromiseConstructor` | [`Task`](Task.md).[`[species]`](Task.md#property-species) | node\_modules/typescript/lib/lib.es2015.symbol.wellknown.d.ts:180 |

## Accessors

### hasAborted

#### Get Signature

> **get** **hasAborted**(): `boolean`

Defined in: [packages/core/src/task/index.ts:102](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/task/index.ts#L102)

Whether this task has already been aborted.

##### Returns

`boolean`

#### Inherited from

[`Task`](Task.md).[`hasAborted`](Task.md#hasaborted)

***

### signal

#### Get Signature

> **get** **signal**(): `AbortSignal`

Defined in: [packages/core/src/task/index.ts:97](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/task/index.ts#L97)

The `AbortSignal` associated with this task's controller.

##### Returns

`AbortSignal`

#### Inherited from

[`Task`](Task.md).[`signal`](Task.md#signal)

## Methods

### abort()

> **abort**(`reason?`): `this`

Defined in: [packages/core/src/task/index.ts:107](https://github.com/andrewcourtice/ripl/blob/bc5e0c58d332ae38e6a8809ca70cac73c20fa408/packages/core/src/task/index.ts#L107)

Aborts the task with an optional reason, triggering all registered abort callbacks.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `reason?` | `unknown` |

#### Returns

`this`

#### Inherited from

[`Task`](Task.md).[`abort`](Task.md#abort)

***

### catch()

> **catch**\<`TResult`\>(`onrejected?`): `Promise`\<`void` \| `TResult`\>

Defined in: node\_modules/typescript/lib/lib.es5.d.ts:1564

Attaches a callback for only the rejection of the Promise.

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TResult` | `never` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `onrejected?` | (`reason`) => `TResult` \| `PromiseLike`\<`TResult`\> \| `null` | The callback to execute when the Promise is rejected. |

#### Returns

`Promise`\<`void` \| `TResult`\>

A Promise for the completion of the callback.

#### Inherited from

[`Task`](Task.md).[`catch`](Task.md#catch)

***

### finally()

> **finally**(`onfinally?`): `Promise`\<`void`\>

Defined in: node\_modules/typescript/lib/lib.es2018.promise.d.ts:29

Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
resolved value cannot be modified from the callback.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `onfinally?` | () => `void` \| `null` | The callback to execute when the Promise is settled (fulfilled or rejected). |

#### Returns

`Promise`\<`void`\>

A Promise for the completion of the callback.

#### Inherited from

[`Task`](Task.md).[`finally`](Task.md#finally)

***

### then()

> **then**\<`TResult1`, `TResult2`\>(`onfulfilled?`, `onrejected?`): `Promise`\<`TResult1` \| `TResult2`\>

Defined in: node\_modules/typescript/lib/lib.es5.d.ts:1557

Attaches callbacks for the resolution and/or rejection of the Promise.

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TResult1` | `void` |
| `TResult2` | `never` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `onfulfilled?` | (`value`) => `TResult1` \| `PromiseLike`\<`TResult1`\> \| `null` | The callback to execute when the Promise is resolved. |
| `onrejected?` | (`reason`) => `TResult2` \| `PromiseLike`\<`TResult2`\> \| `null` | The callback to execute when the Promise is rejected. |

#### Returns

`Promise`\<`TResult1` \| `TResult2`\>

A Promise for the completion of which ever callback is executed.

#### Inherited from

[`Task`](Task.md).[`then`](Task.md#then)

***

### all()

#### Call Signature

> `static` **all**\<`T`\>(`values`): `Promise`\<`Awaited`\<`T`\>[]\>

Defined in: node\_modules/typescript/lib/lib.es2015.iterable.d.ts:255

Creates a Promise that is resolved with an array of results when all of the provided Promises
resolve, or rejected when any Promise is rejected.

##### Type Parameters

| Type Parameter |
| ------ |
| `T` |

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `values` | `Iterable`\<`T` \| `PromiseLike`\<`T`\>\> | An iterable of Promises. |

##### Returns

`Promise`\<`Awaited`\<`T`\>[]\>

A new Promise.

##### Inherited from

[`Task`](Task.md).[`all`](Task.md#all)

#### Call Signature

> `static` **all**\<`T`\>(`values`): `Promise`\<\{ -readonly \[P in string \| number \| symbol\]: Awaited\<T\[P\]\> \}\>

Defined in: node\_modules/typescript/lib/lib.es2015.promise.d.ts:39

Creates a Promise that is resolved with an array of results when all of the provided Promises
resolve, or rejected when any Promise is rejected.

##### Type Parameters

| Type Parameter |
| ------ |
| `T` *extends* \[\] \| readonly `unknown`[] |

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `values` | `T` | An array of Promises. |

##### Returns

`Promise`\<\{ -readonly \[P in string \| number \| symbol\]: Awaited\<T\[P\]\> \}\>

A new Promise.

##### Inherited from

[`Task`](Task.md).[`all`](Task.md#all)

***

### allSettled()

#### Call Signature

> `static` **allSettled**\<`T`\>(`values`): `Promise`\<\{ -readonly \[P in string \| number \| symbol\]: PromiseSettledResult\<Awaited\<T\[P\]\>\> \}\>

Defined in: node\_modules/typescript/lib/lib.es2020.promise.d.ts:38

Creates a Promise that is resolved with an array of results when all
of the provided Promises resolve or reject.

##### Type Parameters

| Type Parameter |
| ------ |
| `T` *extends* \[\] \| readonly `unknown`[] |

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `values` | `T` | An array of Promises. |

##### Returns

`Promise`\<\{ -readonly \[P in string \| number \| symbol\]: PromiseSettledResult\<Awaited\<T\[P\]\>\> \}\>

A new Promise.

##### Inherited from

[`Task`](Task.md).[`allSettled`](Task.md#allsettled)

#### Call Signature

> `static` **allSettled**\<`T`\>(`values`): `Promise`\<`PromiseSettledResult`\<`Awaited`\<`T`\>\>[]\>

Defined in: node\_modules/typescript/lib/lib.es2020.promise.d.ts:46

Creates a Promise that is resolved with an array of results when all
of the provided Promises resolve or reject.

##### Type Parameters

| Type Parameter |
| ------ |
| `T` |

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `values` | `Iterable`\<`T` \| `PromiseLike`\<`T`\>\> | An array of Promises. |

##### Returns

`Promise`\<`PromiseSettledResult`\<`Awaited`\<`T`\>\>[]\>

A new Promise.

##### Inherited from

[`Task`](Task.md).[`allSettled`](Task.md#allsettled)

***

### any()

#### Call Signature

> `static` **any**\<`T`\>(`values`): `Promise`\<`Awaited`\<`T`\[`number`\]\>\>

Defined in: node\_modules/typescript/lib/lib.es2021.promise.d.ts:40

The any function returns a promise that is fulfilled by the first given promise to be fulfilled, or rejected with an AggregateError containing an array of rejection reasons if all of the given promises are rejected. It resolves all elements of the passed iterable to promises as it runs this algorithm.

##### Type Parameters

| Type Parameter |
| ------ |
| `T` *extends* \[\] \| readonly `unknown`[] |

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `values` | `T` | An array or iterable of Promises. |

##### Returns

`Promise`\<`Awaited`\<`T`\[`number`\]\>\>

A new Promise.

##### Inherited from

[`Task`](Task.md).[`any`](Task.md#any)

#### Call Signature

> `static` **any**\<`T`\>(`values`): `Promise`\<`Awaited`\<`T`\>\>

Defined in: node\_modules/typescript/lib/lib.es2021.promise.d.ts:47

The any function returns a promise that is fulfilled by the first given promise to be fulfilled, or rejected with an AggregateError containing an array of rejection reasons if all of the given promises are rejected. It resolves all elements of the passed iterable to promises as it runs this algorithm.

##### Type Parameters

| Type Parameter |
| ------ |
| `T` |

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `values` | `Iterable`\<`T` \| `PromiseLike`\<`T`\>\> | An array or iterable of Promises. |

##### Returns

`Promise`\<`Awaited`\<`T`\>\>

A new Promise.

##### Inherited from

[`Task`](Task.md).[`any`](Task.md#any)

***

### race()

#### Call Signature

> `static` **race**\<`T`\>(`values`): `Promise`\<`Awaited`\<`T`\>\>

Defined in: node\_modules/typescript/lib/lib.es2015.iterable.d.ts:263

Creates a Promise that is resolved or rejected when any of the provided Promises are resolved
or rejected.

##### Type Parameters

| Type Parameter |
| ------ |
| `T` |

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `values` | `Iterable`\<`T` \| `PromiseLike`\<`T`\>\> | An iterable of Promises. |

##### Returns

`Promise`\<`Awaited`\<`T`\>\>

A new Promise.

##### Inherited from

[`Task`](Task.md).[`race`](Task.md#race)

#### Call Signature

> `static` **race**\<`T`\>(`values`): `Promise`\<`Awaited`\<`T`\[`number`\]\>\>

Defined in: node\_modules/typescript/lib/lib.es2015.promise.d.ts:50

Creates a Promise that is resolved or rejected when any of the provided Promises are resolved
or rejected.

##### Type Parameters

| Type Parameter |
| ------ |
| `T` *extends* \[\] \| readonly `unknown`[] |

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `values` | `T` | An array of Promises. |

##### Returns

`Promise`\<`Awaited`\<`T`\[`number`\]\>\>

A new Promise.

##### Inherited from

[`Task`](Task.md).[`race`](Task.md#race)

***

### reject()

> `static` **reject**\<`T`\>(`reason?`): `Promise`\<`T`\>

Defined in: node\_modules/typescript/lib/lib.es2015.promise.d.ts:60

Creates a new rejected promise for the provided reason.

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | `never` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `reason?` | `any` | The reason the promise was rejected. |

#### Returns

`Promise`\<`T`\>

A new rejected Promise.

#### Inherited from

[`Task`](Task.md).[`reject`](Task.md#reject)

***

### resolve()

#### Call Signature

> `static` **resolve**(): `Promise`\<`void`\>

Defined in: node\_modules/typescript/lib/lib.es2015.promise.d.ts:66

Creates a new resolved promise.

##### Returns

`Promise`\<`void`\>

A resolved promise.

##### Inherited from

[`Task`](Task.md).[`resolve`](Task.md#resolve)

#### Call Signature

> `static` **resolve**\<`T`\>(`value`): `Promise`\<`Awaited`\<`T`\>\>

Defined in: node\_modules/typescript/lib/lib.es2015.promise.d.ts:72

Creates a new resolved promise for the provided value.

##### Type Parameters

| Type Parameter |
| ------ |
| `T` |

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `value` | `T` | A promise. |

##### Returns

`Promise`\<`Awaited`\<`T`\>\>

A promise whose internal state matches the provided promise.

##### Inherited from

[`Task`](Task.md).[`resolve`](Task.md#resolve)

#### Call Signature

> `static` **resolve**\<`T`\>(`value`): `Promise`\<`Awaited`\<`T`\>\>

Defined in: node\_modules/typescript/lib/lib.es2015.promise.d.ts:78

Creates a new resolved promise for the provided value.

##### Type Parameters

| Type Parameter |
| ------ |
| `T` |

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `value` | `T` \| `PromiseLike`\<`T`\> | A promise. |

##### Returns

`Promise`\<`Awaited`\<`T`\>\>

A promise whose internal state matches the provided promise.

##### Inherited from

[`Task`](Task.md).[`resolve`](Task.md#resolve)

***

### try()

> `static` **try**\<`T`, `U`\>(`callbackFn`, ...`args`): `Promise`\<`Awaited`\<`T`\>\>

Defined in: node\_modules/typescript/lib/lib.esnext.promise.d.ts:33

Takes a callback of any kind (returns or throws, synchronously or asynchronously) and wraps its result
in a Promise.

#### Type Parameters

| Type Parameter |
| ------ |
| `T` |
| `U` *extends* `unknown`[] |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `callbackFn` | (...`args`) => `T` \| `PromiseLike`\<`T`\> | A function that is called synchronously. It can do anything: either return a value, throw an error, or return a promise. |
| ...`args` | `U` | Additional arguments, that will be passed to the callback. |

#### Returns

`Promise`\<`Awaited`\<`T`\>\>

A Promise that is:
- Already fulfilled, if the callback synchronously returns a value.
- Already rejected, if the callback synchronously throws an error.
- Asynchronously fulfilled or rejected, if the callback returns a promise.

#### Inherited from

[`Task`](Task.md).[`try`](Task.md#try)

***

### withResolvers()

> `static` **withResolvers**\<`T`\>(): `PromiseWithResolvers`\<`T`\>

Defined in: node\_modules/typescript/lib/lib.es2024.promise.d.ts:34

Creates a new Promise and returns it in an object, along with its resolve and reject functions.

#### Type Parameters

| Type Parameter |
| ------ |
| `T` |

#### Returns

`PromiseWithResolvers`\<`T`\>

An object with the properties `promise`, `resolve`, and `reject`.

```ts
const { promise, resolve, reject } = Promise.withResolvers<T>();
```

#### Inherited from

[`Task`](Task.md).[`withResolvers`](Task.md#withresolvers)
