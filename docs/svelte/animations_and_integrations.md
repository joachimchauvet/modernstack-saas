## Transitions

Svelte's built-in transitions make it easy to animate elements as they enter or leave the DOM.

### `transition:`, `in:`, and `out:`

Use the `transition:` directive to apply a transition when an element is added or removed. Use `in:` and `out:` for separate intro and outro transitions.

```svelte
<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { cubicInOut } from 'svelte/easing';

	let play = $state(false);
</script>

<button onclick={() => (play = !play)}>Play</button>

{#if play}
	<span in:fly={{ x: -10, duration: 600, easing: cubicInOut }} out:fade> Hello </span>
{/if}
```

### Custom Transitions

You can create custom transitions by returning a `css` or `tick` function.

```svelte
<script lang="ts">
	import { elasticOut } from 'svelte/easing';

	function customTransition(node: HTMLElement, options: { duration?: number } = {}) {
		return {
			duration: options.duration || 2000,
			easing: elasticOut,
			css: (t: number) => `
				color: hsl(${360 * t} , 100%, 80%);
				transform: scale(${t});
			`
		};
	}
</script>

{#if play}
	<div in:customTransition>Whoooo!</div>
{/if}
```

### Coordinated Transitions (`crossfade`)

The `crossfade` function from `svelte/transition` creates two transitions, `send` and `receive`, that allow you to coordinate transitions between different elements.

```svelte
<script lang="ts">
	import { crossfade } from 'svelte/transition';

	const [send, receive] = crossfade({ duration: 500 });

	let publishedPosts = $state([]);
	let archivedPosts = $state([]);
</script>

<!-- Published Posts -->
{#each publishedPosts as post (post.id)}
	<article in:receive={{ key: post.id }} out:send={{ key: post.id }}>...</article>
{/each}

<!-- Archived Posts -->
{#each archivedPosts as post (post.id)}
	<article in:receive={{ key: post.id }} out:send={{ key: post.id }}>...</article>
{/each}
```

## FLIP Animations

The `animate:flip` directive from `svelte/animate` applies a FLIP animation to elements within an `{#each}` block when their order changes.

```svelte
<script lang="ts">
	import { flip } from 'svelte/animate';
</script>

{#each items as item (item.id)}
	<div animate:flip={{ duration: 200 }}>{item.name}</div>
{/each}
```

## Tweened Values and Springs

The `svelte/motion` module provides `Tween` and `Spring` classes for animating values over time.

### `Tween`

The `Tween` class interpolates a value over a given duration with an easing function.

```svelte
<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { cubicInOut } from 'svelte/easing';

	const size = new Tween(50, { duration: 300, easing: cubicInOut });

	function onmousedown() {
		size.target = 150;
	}
</script>

<circle r={size.current} />
```

### `Spring`

The `Spring` class uses spring physics to animate a value.

```svelte
<script lang="ts">
	import { Spring } from 'svelte/motion';

	const size = new Spring(50, { stiffness: 0.1, damping: 0.25 });
</script>

<circle r={size.current} />
```

## Third-Party Library Integration

### Lifecycle Functions

Use Svelte's lifecycle functions, `onMount` and `onDestroy`, to integrate libraries that need direct DOM access.

```svelte
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import gsap from 'gsap';

	let tween: gsap.core.Tween;
	let target: HTMLElement;

	onMount(() => {
		tween = gsap.to(target, { rotation: 180, x: 100, duration: 1 });
		return () => tween.kill(); // Cleanup
	});
</script>

<div class="box" bind:this={target}></div>
```

### Attachments

Attachments are functions that run when an element is added to the DOM. They provide a powerful way to create reusable integrations.

```svelte
<script lang="ts">
	import { gsap } from 'gsap';

	function tween(vars, ref) {
		let tween: gsap.core.Tween;

		return (target: HTMLElement) => {
			tween = gsap.to(target, vars);
			ref?.(tween);
			return () => tween.kill();
		};
	}

	let animation: gsap.core.Tween;
</script>

<div {@attach tween({ rotation: 180, x: 100, duration: 1 }, (t) => (animation = t))}></div>
```

### Reactive Events (`createSubscriber`)

For event-based libraries, `createSubscriber` from `svelte/reactivity` can be used to create a reactive subscription.

```ts
import { createSubscriber } from 'svelte/reactivity';

class Timeline {
	#subscribe;

	constructor() {
		this.#subscribe = createSubscriber((update) => {
			// Subscribe to external event and call update
			// Return cleanup function
		});
	}

	get time() {
		this.#subscribe();
		// return current value
	}

	set time(v) {
		// update external value
	}
}
```
