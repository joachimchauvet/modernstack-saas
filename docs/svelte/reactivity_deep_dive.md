## Svelte Reactivity: How It Works

Svelte's reactivity is based on signals. A signal is a container that holds a value and a set of subscribers. When the value changes, it notifies its subscribers. The Svelte compiler transforms your code to use these signals behind the scenes, so you can work with reactive variables as if they were regular JavaScript variables.

When you declare a reactive variable with `$state`, Svelte creates a signal.

```svelte
<script lang="ts">
	let count = $state(0);
</script>

<p>{count}</p>
```

The compiler transforms this into something like this:

```ts
function App($$anchor) {
	// create signal
	let count = state(0);

	// create element
	var p = from_html(`<p> </p>`);
	var text = child(p, true);

	// update DOM when `count` changes
	template_effect(() => set_text(text, get(count)));

	// add to DOM
	append($$anchor, p);
}
```

The template is wrapped in an effect that subscribes to the `count` signal. When `count` is updated, the effect re-runs, and the DOM is updated with the new value.

## Deeply Reactive State

When you pass an object or array to `$state`, it becomes a deeply reactive `Proxy`. This allows Svelte to perform granular updates when you read or write properties.

```svelte
<script lang="ts">
	let editor = $state({
		theme: 'dark',
		content: '<h1>Svelte</h1>'
	});
</script>

<textarea
	value={editor.content}
	oninput={(e) => (editor.content = (e.target as HTMLTextAreaElement).value)}
></textarea>

{@html editor.content}
```

### `$state.raw`

If you don't want deep reactivity, you can use `$state.raw`. With `$state.raw`, the state only updates on reassignment.

```svelte
<script lang="ts">
	let editor = $state.raw({
		theme: 'dark',
		content: '<h1>Svelte</h1>'
	});

	function handleInput(e) {
		// This won't work because editor is not deeply reactive
		// editor.content = e.target.value

		// You must reassign the whole object
		editor = {
			...editor,
			content: e.target.value
		};
	}
</script>

<textarea value={editor.content} oninput={handleInput}></textarea>
```

### `$state.snapshot`

To get the plain JavaScript object from a reactive proxy, use `$state.snapshot`. This is useful when working with APIs that don't expect a `Proxy` object.

```ts
function saveEditorState(editor) {
	// structuredClone doesn't work with Proxies
	// const editorState = structuredClone(editor)

	// Use $state.snapshot to get the raw object
	const editorState = structuredClone($state.snapshot(editor));
}
```

Svelte automatically uses `$state.snapshot` when you `console.log` deeply reactive values.

### Destructuring

You can destructure deep state at the point of declaration and maintain reactivity.

```svelte
<script lang="ts">
	// 👍️ reactive
	let { theme, content } = $state({
		theme: 'dark',
		content: '<h1>Svelte</h1>'
	});

	let editor = $state({ theme: 'dark', content: '...' });
	// ⛔️ not reactive, theme and content are just initial values
	let { theme, content } = editor;
</script>
```

## Derived State (`$derived`)

The `$derived` rune creates a new signal that is derived from other signals. It re-evaluates its value whenever its dependencies change.

```svelte
<script lang="ts">
	let count = $state(0);
	let factor = $state(2);
	let result = $derived(count * factor);
</script>

<p>{count} * {factor} = {result}</p>
```

### Deriveds Are Lazy

Derived values are lazy-evaluated, meaning they only re-run when their value is read and has changed, not just when their dependencies change. This avoids unnecessary computations.

```svelte
<script lang="ts">
	let count = $state(0);
	let max = $derived(count >= 4);

	// only logs when `max` changes from false to true
	$inspect(max);
</script>

<button onclick={() => count++} disabled={max}>
	{count}
</button>
```

### Derived Dependency Tracking

Svelte automatically tracks dependencies for derived values. Any reactive variable read inside a derived calculation becomes a dependency.

```svelte
<script lang="ts">
	let count = $state(0);
	let max = $derived(limit());

	function limit() {
		return count > 4; // `count` is a dependency
	}
</script>
```

### `$derived.by`

For more complex derivations that require a function body, use `$derived.by`.

```svelte
<script lang="ts">
	let cart = $state([
		{ item: '🍎', total: 10 },
		{ item: '🍌', total: 10 }
	]);
	let total = $derived.by(() => {
		let sum = 0;
		for (let item of cart) {
			sum += item.total;
		}
		return sum;
	});
</script>
```

You cannot update state inside a derived value.

## Effects (`$effect`)

Effects run a function when the component is mounted and whenever their dependencies change. State that is read inside an effect is tracked as a dependency.

```svelte
<script lang="ts">
	let count = $state(0);

	$effect(() => {
		console.log(count); // `count` is tracked
	});
</script>
```

### When to Use Effects

Effects should be used as a last resort, for synchronizing with external systems that don't understand Svelte's reactivity (e.g., third-party libraries, DOM APIs).

Here's an example of using an effect to fetch data from an API:

```svelte
<script lang="ts">
	import { getAbortSignal } from 'svelte';

	let pokemon = $state('charizard');
	let image = $state('');

	async function getPokemon(pokemon: string) {
		const baseUrl = 'https://pokeapi.co/api/v2/pokemon';
		const response = await fetch(`${baseUrl}/${pokemon}`, {
			// aborts when effect reruns
			signal: getAbortSignal()
		});
		if (!response.ok) throw new Error('💣️ oops!');
		return response.json();
	}

	$effect(() => {
		getPokemon(pokemon).then((data) => {
			image = data.sprites.front_default;
		});
	});
</script>
```

### When NOT to Use Effects

**Do not use effects to synchronize state.** Effects are queued and run last, which can lead to state being out of sync. Use derived state instead.

```svelte
<script lang="ts">
	let count = $state(0);

	// ⛔️ Wrong: using an effect to sync state
	let double = $state(0);
	$effect(() => {
		double = count * 2;
	});

	// ✅ Correct: using derived state
	let doubleDerived = $derived(count * 2);
</script>
```

### `$effect.pre`

The `$effect.pre` rune runs an effect before the DOM updates. This is useful for tasks like measuring element dimensions before an animation.

```svelte
<script lang="ts">
	import { gsap } from 'gsap';
	import { Flip } from 'gsap/Flip';
	import { tick } from 'svelte';

	let items = $state([...Array(20).keys()]);

	$effect.pre(() => {
		items; // track `items` as a dependency
		const state = Flip.getState('.item');

		tick().then(() => {
			Flip.from(state, { duration: 1, stagger: 0.01, ease: 'power1.inOut' });
		});
	});
</script>
```

## Reactive Global State

You can create global reactive state by exporting a reactive variable from a `.svelte.ts` file.

```ts:config.svelte.ts
interface Config {
	theme: 'light' | 'dark'
}

export const config = $state<Config>({ theme: 'dark' })

export function toggleTheme() {
	config.theme = config.theme === 'light' ? 'dark' : 'light'
}
```

Then import and use it in any component:

```svelte:App.svelte
<script>
	import { config, toggleTheme } from './config.svelte'
</script>

<button onclick={toggleTheme}>
	{config.theme}
</button>
```

## Reactive Data Structures

Svelte provides reactive versions of built-in JavaScript objects like `Map` and `Set`.

```svelte
<script lang="ts">
	import { SvelteMap } from 'svelte/reactivity';

	const reactiveMap = new SvelteMap<string, number>();

	reactiveMap.set('count', 1); // this will trigger updates
</script>
```
