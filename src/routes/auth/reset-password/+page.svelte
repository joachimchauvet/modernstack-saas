<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { authClient } from '$lib/auth-client.js';
	import { resolve } from '$app/paths';

	let password = $state('');
	let confirmPassword = $state('');
	let isLoading = $state(false);
	let message = $state<string | null>(null);
	let error = $state<string | null>(null);

	function getTokenFromUrl() {
		try {
			const url = new URL(window.location.href);
			return url.searchParams.get('token');
		} catch {
			return null;
		}
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		error = null;
		message = null;
		if (password.length < 8) {
			error = 'Password must be at least 8 characters';
			return;
		}
		if (password !== confirmPassword) {
			error = 'Passwords do not match';
			return;
		}
		const token = getTokenFromUrl();
		if (!token) {
			error = 'Missing or invalid token';
			return;
		}
		isLoading = true;
		try {
			const { error: err } = await authClient.resetPassword({
				newPassword: password,
				token
			});
			if (err) {
				error = err.message ?? 'Reset failed';
			} else {
				message = 'Your password has been reset. You can now sign in.';
			}
		} catch {
			error = 'Failed to reset password';
		} finally {
			isLoading = false;
		}
	}
</script>

<div class="flex min-h-screen items-center justify-center px-4">
	<Card.Root class="mx-auto w-full max-w-sm">
		<Card.Header>
			<Card.Title class="text-2xl">Reset password</Card.Title>
			<Card.Description>Enter your new password</Card.Description>
		</Card.Header>
		<Card.Content>
			<form onsubmit={handleSubmit} class="grid gap-4">
				{#if error}
					<div class="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</div>
				{/if}
				{#if message}
					<div class="rounded-md bg-green-50 p-3 text-sm text-green-800">
						Your password has been reset. You can now
						<a href={resolve('/auth/sign-in')} class="underline">sign in</a>.
					</div>
				{/if}
				<div class="grid gap-2">
					<Label for="password">New password</Label>
					<Input id="password" type="password" bind:value={password} required />
				</div>
				<div class="grid gap-2">
					<Label for="confirm">Confirm new password</Label>
					<Input id="confirm" type="password" bind:value={confirmPassword} required />
				</div>
				<Button type="submit" class="w-full" disabled={isLoading}>
					{#if isLoading}Resetting...{:else}Reset password{/if}
				</Button>
			</form>
		</Card.Content>
	</Card.Root>
</div>
