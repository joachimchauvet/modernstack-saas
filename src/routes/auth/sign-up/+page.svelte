<script lang="ts">
	import LoginForm from '$lib/components/login-form.svelte';
	import WaitlistForm from '$lib/components/waitlist-form.svelte';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { useAuth } from '@mmailaender/convex-better-auth-svelte/svelte';
	import { useQuery } from 'convex-svelte';
	import { api } from '$convex/_generated/api.js';
	import { normalizeRedirect } from '$lib/utils.js';

	const auth = useAuth();

	// When signups are disabled on the Convex deployment (SIGNUPS_DISABLED),
	// this page shows the waitlist instead of the sign-up form. The form swap
	// is UX only — enforcement lives in the sign-up gate in `convex/auth.ts`.
	const waitlistStatus = useQuery(api.waitlist.status, {});

	// Optional post-auth destination (e.g. /accept-invitation/...). Only
	// same-origin paths are allowed to prevent open redirects.
	const redirectTo = $derived(normalizeRedirect(page.url.searchParams.get('redirect')));

	$effect(() => {
		if (!auth.isLoading && auth.isAuthenticated) {
			// eslint-disable-next-line svelte/no-navigation-without-resolve
			goto(redirectTo);
		}
	});
</script>

<div class="flex min-h-screen items-center justify-center">
	{#if waitlistStatus.data}
		{#if waitlistStatus.data.signupsEnabled}
			<LoginForm mode="signup" {redirectTo} />
		{:else}
			<WaitlistForm doubleOptIn={waitlistStatus.data.doubleOptIn} />
		{/if}
	{:else}
		<Skeleton class="h-96 w-full max-w-sm" />
	{/if}
</div>
