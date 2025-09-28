<script lang="ts">
	import { authClient } from '$lib/auth-client.js';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import type { Snippet } from 'svelte';
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';

	interface Props {
		children: Snippet;
	}

	const { children }: Props = $props();

	let isLoading = $state(true);
	let isAuthenticated = $state(false);

	onMount(async () => {
		// Check authentication status
		const { data: session } = await authClient.getSession();
		if (!session) {
			// Redirect to sign-in if not authenticated
			goto(resolve('/auth/sign-in'));
		} else {
			isAuthenticated = true;
			isLoading = false;
		}
	});
</script>

{#if isLoading}
	<div class="flex min-h-screen items-center justify-center">
		<div class="text-lg text-gray-600">Loading...</div>
	</div>
{:else if isAuthenticated}
	<Sidebar.Provider>
		<AppSidebar />
		<Sidebar.Inset>
			{@render children()}
		</Sidebar.Inset>
	</Sidebar.Provider>
{/if}
