## State in Functions and Classes

While runes are often used at the top-level of components, you can also use them inside regular JavaScript/TypeScript functions and classes to create powerful, reusable state stores. To do this, place your code in files with a `.svelte.ts` or `.svelte.js` extension. This tells the Svelte compiler to process the runes within them.

### State in Functions

You can create functions that encapsulate reactive logic. These are often called "stores" or "services".

```ts:counter.svelte.ts
export function createCounter(initial: number) {
	let count = $state(initial)

	$effect(() => {
		console.log(`The count is ${count}`)
	})

	const increment = () => count++
	const decrement = () => count--

	return {
		get count() { return count },
		set count(v) { count = v },
		increment,
		decrement
	}
}
```

By returning `get` and `set` accessors for `count`, you ensure that consumers of this store interact with it reactively.

```svelte:App.svelte
<script lang="ts">
	import { createCounter } from './counter.svelte'

	const counter = createCounter(0)
</script>

<button onclick={counter.decrement}>-</button>
<span>{counter.count}</span>
<button onclick={counter.increment}>+</button>
```

### State in Classes

Classes provide a more structured way to manage state. When you use `$state` to declare a class field, Svelte automatically turns it into a private field with matching `get`/`set` methods.

```ts:counter.svelte.ts
export class Counter {
    count = $state(0) // Automatically gets getter/setter

	constructor(initial: number) {
		this.count = initial
	}

	// Use arrow functions for methods to correctly bind `this`
	increment = () => {
		this.count++
	}

	decrement = () => {
		this.count--
	}
}
```

Usage in a component:

```svelte:App.svelte
<script lang="ts">
	import { Counter } from './counter.svelte'

	const counter = new Counter(0)
</script>

<button onclick={counter.decrement}>-</button>
<span>{counter.count}</span>
<button onclick={counter.increment}>+</button>
```

### Passing State Into Functions And Classes

Remember that reactive state variables are just regular values. If you pass them directly to a function or class constructor, you are only passing their initial value. To maintain reactivity, you must pass a function that returns the value (a closure).

```svelte
<script lang="ts">
	class Doubler {
		value = $derived(0);
		constructor(count: () => number) {
			// Expects a function
			this.value = $derived(count() * 2);
		}
	}

	let count = $state(0);
	// Pass a function that returns the reactive value
	const doubler = new Doubler(() => count);
</script>

<button onclick={() => count++}>
	{doubler.value}
</button>
```

## Why You Should Avoid Effects

It's easy to overcomplicate your code with effects because they seem like the right tool for handling side-effects. However, they should be a last resort. The main problem is that effects are tied to the component lifecycle.

Let's look at an example where we want to persist a counter to `localStorage`.

### The Problem: Orphaned Effects

If you try to use an effect inside a class that is instantiated outside of a component's initialization phase, you'll get an error: `effect_orphan: $effect can only be used inside an effect (e.g. during component initialisation)`.

```ts:counter.svelte.ts
class Counter {
	count = $state(0)
	constructor() {
		$effect(() => { // This will throw an error if Counter is instantiated globally
			localStorage.setItem('count', this.count.toString())
		})
	}
}

// ⚠️ This will cause an orphaned effect error
export const counter = new Counter()
```

This happens because effects need a parent (the component's root effect) to handle cleanup. When created globally, there is no parent.

### The Wrong Solution: `$effect.root` and `$effect.tracking`

Svelte provides advanced runes like `$effect.root` to create your own root effect, but this requires manual cleanup and is a sign you're fighting the framework.

```ts
// Manual cleanup is required
this.cleanup = $effect.root(() => { ... });
```

Another advanced rune is `$effect.tracking`, which checks if you are inside a tracking context. You might think to use it to conditionally create an effect, but this leads to more complexity and bugs, like effects that never run or effects that are created on every read.

The point is: **if you find yourself reaching for `$effect.root` or `$effect.tracking`, you're probably doing something wrong.**

### The Right Solution: Side-effects in Accessors or Event Handlers

Instead of relying on effects to sync with external systems, perform side-effects directly where the state is changed or read. This makes the code simpler, more predictable, and decoupled from the component lifecycle.

Here is the correct way to implement the `localStorage` counter:

```ts:counter.svelte.ts
export class Counter {
	#count = $state(0)
	#hydrated = false

	constructor(initial: number) {
		this.#count = initial
	}

	get count() {
		if (!this.#hydrated) {
			const savedCount = localStorage.getItem('count')
			if (savedCount) {
				this.#count = parseInt(savedCount)
			}
			this.#hydrated = true
		}
		return this.#count
	}

	set count(v: number) {
		localStorage.setItem('count', v.toString())
		this.#count = v
	}
}
```

In this version, we read from `localStorage` the first time `count` is accessed (lazy hydration) and write to `localStorage` every time `count` is set. There are no effects, no manual cleanup, and the logic can be used anywhere, inside or outside of a component.
