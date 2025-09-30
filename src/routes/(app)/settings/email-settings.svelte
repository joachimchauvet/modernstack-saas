<script lang="ts">
	import { authClient } from '$lib/auth-client.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { toast } from 'svelte-sonner';
	import { Info, CircleCheck } from '@lucide/svelte';

	interface Props {
		user: {
			email?: string;
			emailVerified?: boolean;
		} | null;
	}

	let { user }: Props = $props();

	let newEmail = $state('');
	let isLoading = $state(false);
	let error = $state('');

	let currentEmail = $derived(user?.email || '');
	let isEmailVerified = $derived(user?.emailVerified || false);

	async function handleChangeEmail(e: Event) {
		e.preventDefault();
		error = '';

		// Validation
		if (!newEmail || !newEmail.includes('@')) {
			error = 'Please enter a valid email address';
			return;
		}

		if (newEmail === currentEmail) {
			error = 'New email must be different from current email';
			return;
		}

		isLoading = true;

		try {
			await authClient.changeEmail({
				newEmail,
				callbackURL: '/settings?email-changed=true'
			});

			toast.success(
				isEmailVerified
					? 'Verification email sent to your current address. Please check your inbox to approve the change.'
					: 'Email updated successfully'
			);

			// Clear form
			newEmail = '';
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to change email';
			toast.error(error);
		} finally {
			isLoading = false;
		}
	}
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>Email Address</Card.Title>
		<Card.Description>
			Update your email address for account notifications and login.
		</Card.Description>
	</Card.Header>
	<Card.Content>
		<div class="space-y-4">
			<!-- Current Email Display -->
			<div class="space-y-2">
				<Label>Current Email</Label>
				<div class="flex items-center gap-2">
					<Input value={currentEmail} disabled class="bg-muted" />
					{#if isEmailVerified}
						<Badge variant="secondary" class="flex items-center gap-1">
							<CircleCheck class="h-3 w-3" />
							Verified
						</Badge>
					{:else}
						<Badge variant="outline">Unverified</Badge>
					{/if}
				</div>
			</div>

			<form onsubmit={handleChangeEmail} class="space-y-4">
				{#if error}
					<Alert.Root variant="destructive">
						<Info class="h-4 w-4" />
						<Alert.Title>Error</Alert.Title>
						<Alert.Description>{error}</Alert.Description>
					</Alert.Root>
				{/if}

				<div class="space-y-2">
					<Label for="new-email">New Email Address</Label>
					<Input
						id="new-email"
						type="email"
						bind:value={newEmail}
						placeholder="Enter new email address"
						required
						autocomplete="email"
					/>
				</div>

				{#if isEmailVerified}
					<Alert.Root>
						<Info class="h-4 w-4" />
						<Alert.Title>Verification Required</Alert.Title>
						<Alert.Description>
							A verification email will be sent to your current email address. You must approve the
							change before your new email becomes active.
						</Alert.Description>
					</Alert.Root>
				{:else}
					<Alert.Root>
						<Info class="h-4 w-4" />
						<Alert.Title>Email Not Verified</Alert.Title>
						<Alert.Description>
							Your current email is not verified. The new email will be updated immediately without
							verification.
						</Alert.Description>
					</Alert.Root>
				{/if}

				<Button type="submit" disabled={isLoading}>
					{isLoading ? 'Updating...' : 'Update Email'}
				</Button>
			</form>
		</div>
	</Card.Content>
</Card.Root>
