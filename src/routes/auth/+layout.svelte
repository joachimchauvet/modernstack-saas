<script lang="ts">
	import { setContext } from 'svelte';

	// Shared email state across auth pages in this layout
	let email = $state('');
	const { children } = $props();

	setContext('auth:email', {
		get: () => email,
		set: (v: string) => (email = v)
	});
</script>

{@render children()}
