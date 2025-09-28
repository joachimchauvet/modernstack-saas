<script lang="ts">
	import { api } from '$convex/_generated/api.js';
	import { useQuery } from 'convex-svelte';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import SectionCards from '$lib/components/section-cards.svelte';
	import ChartAreaInteractive from '$lib/components/chart-area-interactive.svelte';
	import DataTable from '$lib/components/data-table.svelte';
	import data from './data.js';

	// Get current user from Convex
	const currentUserResponse = useQuery(api.auth.getCurrentUser, {});
	let user = $derived(currentUserResponse.data);
</script>

<svelte:head>
	<title>Dashboard | SaaS Template</title>
</svelte:head>

<!-- Header -->
<header
	class="flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12"
>
	<div class="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
		<Sidebar.Trigger class="-ml-1" />
		<Separator orientation="vertical" class="mx-2 data-[orientation=vertical]:h-4" />
		<h1 class="text-base font-medium">Dashboard</h1>
		<div class="ml-auto flex items-center gap-2">
			<span class="text-sm text-muted-foreground">Welcome back, {user?.name || 'User'}!</span>
		</div>
	</div>
</header>

<!-- Main Content -->
<div class="flex flex-1 flex-col">
	<div class="@container/main flex flex-1 flex-col gap-2">
		<div class="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
			<SectionCards />
			<div class="px-4 lg:px-6">
				<ChartAreaInteractive />
			</div>
			<DataTable {data} />
		</div>
	</div>
</div>
