<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { api } from '$convex/_generated/api.js';
	import { useConvexClient } from 'convex-svelte';
	import { ConvexError } from 'convex/values';

	interface Props {
		id?: string;
		/** Whether confirmation emails are sent (drives the success copy). */
		doubleOptIn?: boolean;
	}

	const { id, doubleOptIn = false }: Props = $props();

	const client = useConvexClient();

	let name = $state('');
	let email = $state('');
	let isLoading = $state(false);
	let submitted = $state(false);
	let error = $state<string | null>(null);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		isLoading = true;
		error = null;
		try {
			await client.mutation(api.waitlist.join, { name, email });
			submitted = true;
		} catch (err) {
			if (err instanceof ConvexError && typeof err.data === 'string') {
				error = err.data;
			} else if (
				err instanceof ConvexError &&
				(err.data as { kind?: string } | null)?.kind === 'RateLimited'
			) {
				error = 'Too many attempts — please try again in a little while.';
			} else {
				error = 'Something went wrong. Please try again.';
				console.error('Waitlist join error:', err);
			}
		} finally {
			isLoading = false;
		}
	}
</script>

<Card.Root class="mx-auto w-full max-w-sm">
	<Card.Header>
		<Card.Title class="text-2xl">Join the waitlist</Card.Title>
		<Card.Description>
			Signups are currently closed. Leave your details and we'll let you know when a spot opens.
		</Card.Description>
	</Card.Header>
	<Card.Content>
		{#if submitted}
			<!-- Same message whether the address was new or already on the list,
			     so the form can't be used to test membership. -->
			<div class="rounded-md bg-muted p-4 text-sm" role="status">
				{#if doubleOptIn}
					Almost there — check your inbox and click the confirmation link to secure your spot.
				{:else}
					You're on the list! We'll email you when a spot opens.
				{/if}
			</div>
		{:else}
			<form onsubmit={handleSubmit}>
				<div class="grid gap-4">
					{#if error}
						<div class="rounded-md bg-red-50 p-3 text-sm text-red-800">
							{error}
						</div>
					{/if}

					<div class="grid gap-2">
						<Label for="waitlist-name-{id}">Name</Label>
						<Input
							id="waitlist-name-{id}"
							type="text"
							placeholder="John Doe"
							bind:value={name}
							required
						/>
					</div>
					<div class="grid gap-2">
						<Label for="waitlist-email-{id}">Email</Label>
						<Input
							id="waitlist-email-{id}"
							type="email"
							placeholder="m@example.com"
							bind:value={email}
							required
						/>
					</div>
					<Button type="submit" class="w-full" disabled={isLoading}>
						{isLoading ? 'Joining...' : 'Join Waitlist'}
					</Button>
				</div>
			</form>
		{/if}
	</Card.Content>
</Card.Root>
