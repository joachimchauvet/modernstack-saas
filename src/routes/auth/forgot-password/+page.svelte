<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { authClient } from '$lib/auth-client.js';
	import { getContext } from 'svelte';

	const authEmailCtx = getContext<{ get: () => string; set: (v: string) => void }>('auth:email');
	let email = $state(authEmailCtx?.get() ?? '');
	let isLoading = $state(false);
	let message = $state<string | null>(null);
	let error = $state<string | null>(null);

	$effect(() => {
		authEmailCtx?.set(email);
	});

	async function handleSubmit(e: Event) {
		e.preventDefault();
		isLoading = true;
		message = null;
		error = null;
		try {
			const { error: err } = await authClient.requestPasswordReset({
				email,
				redirectTo: '/auth/reset-password'
			});
			if (err) {
				error = err.message ?? 'Request failed';
			} else {
				message = 'Check your email for a reset link.';
			}
		} catch {
			error = 'Failed to request password reset';
		} finally {
			isLoading = false;
		}
	}
</script>

<div class="flex min-h-screen items-center justify-center px-4">
	<Card.Root class="mx-auto w-full max-w-sm">
		<Card.Header>
			<Card.Title class="text-2xl">Forgot password</Card.Title>
			<Card.Description>We will email you a reset link</Card.Description>
		</Card.Header>
		<Card.Content>
			<form onsubmit={handleSubmit} class="grid gap-4">
				{#if error}
					<div class="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</div>
				{/if}
				{#if message}
					<div class="rounded-md bg-green-50 p-3 text-sm text-green-800">{message}</div>
				{/if}
				<div class="grid gap-2">
					<Label for="email">Email</Label>
					<Input
						id="email"
						type="email"
						bind:value={email}
						required
						placeholder="you@example.com"
					/>
				</div>
				<Button type="submit" class="w-full" disabled={isLoading}>
					{#if isLoading}Sending...{:else}Send reset link{/if}
				</Button>
			</form>
		</Card.Content>
	</Card.Root>
</div>
