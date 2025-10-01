## Template Logic

Svelte provides several control flow blocks to manage rendering within your templates.

### Asynchronous Data Loading (`{#await}`)

The `{#await}` block handles promises directly in your markup, managing loading, success, and error states.

```svelte
<script lang="ts">
	async function getPokemon(name: string) {
		const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`);
		if (!response.ok) throw new Error('Pokemon not found');
		return response.json();
	}
</script>

{#await getPokemon('pikachu')}
	<p>Loading...</p>
{:then pokemon}
	<h2>{pokemon.name}</h2>
	<img src={pokemon.sprites.front_default} alt={pokemon.name} />
{:catch error}
	<p>Error: {error.message}</p>
{/await}
```

### Recreating Elements (`{#key}`)

The `{#key}` block destroys and recreates its contents when the value of the expression changes. This is useful for re-triggering animations or transitions.

```svelte
<script lang="ts">
	import { fade } from 'svelte/transition';

	let value = $state(0);
</script>

{#key value}
	<div in:fade>👻</div>
{/key}

<button onclick={() => value++}>Spook</button>
```

### Local Constants (`@const`)

The `@const` tag defines block-scoped, read-only constants within your template.

```svelte
<ul>
	{#each todos as todo}
		{@const { text, done: checked } = todo}
		<li>
			<input {checked} type="checkbox" />
			<span>{text}</span>
		</li>
	{/each}
</ul>
```

## Data Binding

Svelte's `bind:` directive provides two-way data binding.

### Function Bindings

For more control over data binding, you can provide getter and setter functions. This is useful for validation or transforming values.

```svelte
<script lang="ts">
	let text = $state('I love Svelte');

	function toSpongeBobCase(text: string) {
		return text
			.split('')
			.map((c, i) => (i % 2 === 1 ? c.toUpperCase() : c.toLowerCase()))
			.join('');
	}
</script>

<textarea bind:value={() => toSpongeBobCase(text), (v: string) => (text = toSpongeBobCase(v))}
></textarea>
```

### Readonly Bindings

Svelte offers readonly bindings for element properties like `clientWidth` and `clientHeight`, which update when the element's dimensions change.

```svelte
<script lang="ts">
	let width = $state();
	let height = $state();
</script>

<div bind:clientWidth={width} bind:clientHeight={height}>
	The dimensions are {width} x {height}.
</div>
```

## Component Composition

### Snippets

Snippets are blocks of markup that can be passed to components as props, similar to slots in other frameworks. Every component has an implicit `children` snippet.

```svelte:Accordion.svelte
<script lang="ts">
	let { children } = $props()
</script>

<div class="accordion">
	{@render children?.()}
</div>
```

You can define and pass named snippets as well. Snippets can also receive parameters.

```svelte:AccordionItem.svelte
<script lang="ts">
	import type { Snippet } from 'svelte'

	interface Props {
		accordionItem?: Snippet<[accordionItem: { open: boolean; toggle: () => void }]>
	}

	let { accordionItem }: Props = $props()
	let open = $state(false)

	function toggle() {
		open = !open
	}
</script>

<div class="accordion-item">
	{@render accordionItem?.({ open, toggle })}
</div>
```

```svelte:App.svelte
<AccordionItem>
    {#snippet accordionItem({ open, toggle })}
        <button onclick={toggle}>
            {open ? 'Close' : 'Open'}
        </button>
        {#if open}
            <div>Content</div>
        {/if}
    {/snippet}
</AccordionItem>
```

### Context API

The Context API allows you to pass data between components without prop drilling.

Set the context in a parent component:

```svelte:Accordion.svelte
<script lang="ts">
	import { setContext } from 'svelte'

	let { open = $bindable() } = $props()

	setContext('accordion', {
		get open() { return open }
	})
</script>
```

Get the context in a child component:

```svelte:AccordionItem.svelte
<script lang="ts">
	import { getContext } from 'svelte'

	const accordion = getContext('accordion')
	let open = $derived(accordion.open)
</script>
```

### Module Context (`<script module>`)

Code inside a `<script module>` block is shared across all instances of a component. This is useful for shared state or exporting functions.

```svelte:Counter.svelte
<script lang="ts" module>
	let count = $state(0) // shared state

	export function reset() { // shared function
		count = 0
	}
</script>

<button onclick={() => count++}>{count}</button>
```

## Special Svelte Elements

Svelte provides special elements for interacting with the DOM.

- `<svelte:window>`: Add event listeners and bindings to the `window` object.
- `<svelte:document>`: Add event listeners to the `document` object.
- `<svelte:body>`: Add event listeners to the `<body>` element.
- `<svelte:head>`: Insert elements into the document's `<head>`.
- `<svelte:element>`: Render an element with a dynamic tag name.

Example with `<svelte:window>`:

```svelte
<script lang="ts">
	let scrollY = $state(0);
</script>

<svelte:window bind:scrollY />

<div>{scrollY}px</div>
```
