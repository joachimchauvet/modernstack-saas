<script lang="ts">
	import { api } from '$convex/_generated/api.js';
	import { useQuery } from 'convex-svelte';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { canManageOrganization } from '$lib/organizations.js';
	import OrganizationGeneral from './organization-general.svelte';
	import OrganizationMembers from './organization-members.svelte';
	import OrganizationInvitations from './organization-invitations.svelte';
	import OrganizationDanger from './organization-danger.svelte';
	import { siteConfig } from '$lib/config.js';

	// Reactive: updates in real time when members or invitations change
	const organizationResponse = useQuery(api.organizations.getActiveOrganization, {});
	let organization = $derived(organizationResponse.data);
	let canManage = $derived(canManageOrganization(organization?.currentMemberRole));
</script>

<svelte:head>
	<title>Organization | {siteConfig.name}</title>
</svelte:head>

<!-- Header -->
<header
	class="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear"
>
	<div class="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
		<Sidebar.Trigger class="-ml-1" />
		<Separator orientation="vertical" class="mx-2 data-[orientation=vertical]:h-4" />
		<h1 class="text-base font-medium">Organization</h1>
	</div>
</header>

<!-- Main Content -->
<div class="flex flex-1 flex-col">
	<div class="flex-1 space-y-6 p-6 md:p-10">
		<div>
			<h2 class="text-2xl font-bold tracking-tight">Organization</h2>
			<p class="text-muted-foreground">Manage your organization, members, and invitations.</p>
		</div>

		<Separator />

		{#if organizationResponse.isLoading}
			<div class="space-y-6">
				<Skeleton class="h-48 w-full" />
				<Skeleton class="h-64 w-full" />
			</div>
		{:else if organization}
			<div class="space-y-6">
				<OrganizationGeneral {organization} {canManage} />
				<OrganizationMembers {organization} {canManage} />
				{#if canManage}
					<OrganizationInvitations {organization} />
				{/if}
				<OrganizationDanger {organization} />
			</div>
		{:else}
			<p class="text-muted-foreground">
				No active organization. Use the organization switcher in the sidebar to select or create
				one.
			</p>
		{/if}
	</div>
</div>
