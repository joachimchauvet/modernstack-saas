<script lang="ts">
	import { api } from '$convex/_generated/api.js';
	import { useQuery } from 'convex-svelte';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import AccountSettings from './account-settings.svelte';
	import PasswordSettings from './password-settings.svelte';
	import EmailSettings from './email-settings.svelte';

	// Get current user from Convex
	const currentUserResponse = useQuery(api.auth.getCurrentUser, {});
	let user = $derived(currentUserResponse.data);
</script>

<svelte:head>
	<title>Settings | SaaS Template</title>
</svelte:head>

<!-- Header -->
<header
	class="flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12"
>
	<div class="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
		<Sidebar.Trigger class="-ml-1" />
		<Separator orientation="vertical" class="mx-2 data-[orientation=vertical]:h-4" />
		<h1 class="text-base font-medium">Settings</h1>
	</div>
</header>

<!-- Main Content -->
<div class="flex flex-1 flex-col">
	<div class="flex-1 space-y-6 p-6 md:p-10">
		<div>
			<h2 class="text-2xl font-bold tracking-tight">Settings</h2>
			<p class="text-muted-foreground">Manage your account settings and preferences.</p>
		</div>

		<Separator />

		<Tabs.Root value="account" class="space-y-6">
			<Tabs.List>
				<Tabs.Trigger value="account">Account</Tabs.Trigger>
				<Tabs.Trigger value="password">Password</Tabs.Trigger>
				<Tabs.Trigger value="email">Email</Tabs.Trigger>
			</Tabs.List>

			<Tabs.Content value="account" class="space-y-6">
				{#if user}
					<AccountSettings {user} />
				{/if}
			</Tabs.Content>

			<Tabs.Content value="password" class="space-y-6">
				<PasswordSettings />
			</Tabs.Content>

			<Tabs.Content value="email" class="space-y-6">
				{#if user}
					<EmailSettings {user} />
				{/if}
			</Tabs.Content>
		</Tabs.Root>
	</div>
</div>
