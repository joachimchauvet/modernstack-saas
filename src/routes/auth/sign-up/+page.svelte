<script lang="ts">
	import LoginForm from '$lib/components/login-form.svelte';
	import { authClient } from '$lib/auth-client.js';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';

	onMount(async () => {
		// Check if user is already authenticated
		const { data: session } = await authClient.getSession();
		if (session) {
			// Redirect to dashboard if already logged in
			goto(resolve('/dashboard'));
		}
	});
</script>

<div class="flex min-h-screen items-center justify-center">
	<LoginForm mode="signup" />
</div>
