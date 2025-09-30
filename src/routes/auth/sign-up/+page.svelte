<script lang="ts">
	import LoginForm from '$lib/components/login-form.svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { useAuth } from '@mmailaender/convex-better-auth-svelte/svelte';

	const auth = useAuth();

	$effect(() => {
		if (!auth.isLoading && auth.isAuthenticated) {
			goto(resolve('/dashboard'));
		}
	});
</script>

<div class="flex min-h-screen items-center justify-center">
	<LoginForm mode="signup" />
</div>
