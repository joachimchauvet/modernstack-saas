<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { api } from '$convex/_generated/api.js';
	import { useConvexClient } from 'convex-svelte';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { siteConfig } from '$lib/config.js';

	const client = useConvexClient();
	const token = page.url.searchParams.get('token') ?? '';

	let result = $state<'loading' | 'confirmed' | 'invalid' | 'error'>('loading');

	onMount(async () => {
		if (!token) {
			result = 'invalid';
			return;
		}
		try {
			const confirmed = await client.mutation(api.waitlist.confirm, { token });
			result = confirmed ? 'confirmed' : 'invalid';
		} catch (err) {
			console.error('Waitlist confirmation error:', err);
			result = 'error';
		}
	});
</script>

<svelte:head>
	<title>Confirm your spot | {siteConfig.name}</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center">
	<Card.Root class="mx-auto w-full max-w-sm">
		<Card.Header>
			<Card.Title class="text-2xl">
				{#if result === 'loading'}
					Confirming...
				{:else if result === 'confirmed'}
					You're on the list!
				{:else}
					Something's not right
				{/if}
			</Card.Title>
		</Card.Header>
		<Card.Content class="space-y-4">
			{#if result === 'loading'}
				<p class="text-sm text-muted-foreground">Confirming your spot on the waitlist...</p>
			{:else if result === 'confirmed'}
				<p class="text-sm text-muted-foreground">
					Your email address is confirmed. We'll let you know as soon as a spot opens up.
				</p>
			{:else if result === 'invalid'}
				<p class="text-sm text-muted-foreground">
					This confirmation link is invalid or no longer active. You can join the waitlist again
					from the sign-up page.
				</p>
				<Button href={resolve('/auth/sign-up')} variant="outline" class="w-full">
					Back to sign-up
				</Button>
			{:else}
				<p class="text-sm text-muted-foreground">
					We couldn't confirm your email right now. Please try the link again in a few minutes.
				</p>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
