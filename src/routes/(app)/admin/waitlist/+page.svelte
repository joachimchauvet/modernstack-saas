<script lang="ts">
	import { api } from '$convex/_generated/api.js';
	import type { Id } from '$convex/_generated/dataModel.js';
	import { useConvexClient, useQuery } from 'convex-svelte';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import { showErrorToast } from '$lib/toast.js';

	const PAGE_SIZE = 20;

	const client = useConvexClient();

	const statusFilters = [
		{ label: 'All', value: undefined },
		{ label: 'Pending', value: false },
		{ label: 'Confirmed', value: true }
	] as const;
	let confirmedFilter = $state<boolean | undefined>(undefined);

	let cursor = $state<string | null>(null);
	let previousCursors = $state<Array<string | null>>([]);

	// Reset pagination when the filter changes — done in the click handler
	// rather than a state-syncing $effect, per the project's guidance.
	function setFilter(value: boolean | undefined) {
		confirmedFilter = value;
		cursor = null;
		previousCursors = [];
	}

	const waitlistResponse = useQuery(api.waitlist.list, () => ({
		paginationOpts: { numItems: PAGE_SIZE, cursor },
		...(confirmedFilter === undefined ? {} : { confirmed: confirmedFilter })
	}));
	let waitlist = $derived(waitlistResponse.data);

	function nextPage() {
		if (!waitlist || waitlist.isDone) return;
		previousCursors = [...previousCursors, cursor];
		cursor = waitlist.continueCursor;
	}

	function previousPage() {
		if (previousCursors.length === 0) return;
		cursor = previousCursors[previousCursors.length - 1];
		previousCursors = previousCursors.slice(0, -1);
	}

	let removingId = $state<Id<'waitlist'> | null>(null);

	async function removeEntry(id: Id<'waitlist'>) {
		removingId = id;
		try {
			await client.mutation(api.waitlist.remove, { id });
		} catch (error) {
			showErrorToast(error, 'Failed to remove waitlist entry');
		} finally {
			removingId = null;
		}
	}

	const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });
</script>

<svelte:head>
	<title>Waitlist | Admin</title>
</svelte:head>

<!-- Header -->
<header
	class="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear"
>
	<div class="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
		<Sidebar.Trigger class="-ml-1" />
		<Separator orientation="vertical" class="mx-2 data-[orientation=vertical]:h-4" />
		<h1 class="text-base font-medium">Waitlist</h1>
	</div>
</header>

<!-- Main Content -->
<div class="flex flex-1 flex-col">
	<div class="flex-1 space-y-6 p-6 md:p-10">
		<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
			<div>
				<h2 class="text-2xl font-bold tracking-tight">Waitlist</h2>
				<p class="text-muted-foreground">
					People waiting for signups to open. To let someone in, invite them to an organization —
					invited addresses can create an account even while signups are closed.
				</p>
			</div>
			<div class="flex gap-2">
				{#each statusFilters as filter (filter.label)}
					<Button
						variant={confirmedFilter === filter.value ? 'default' : 'outline'}
						size="sm"
						onclick={() => setFilter(filter.value)}
					>
						{filter.label}
					</Button>
				{/each}
			</div>
		</div>

		<Separator />

		{#if waitlistResponse.isLoading}
			<div class="space-y-3">
				<Skeleton class="h-10 w-full" />
				<Skeleton class="h-10 w-full" />
				<Skeleton class="h-10 w-full" />
			</div>
		{:else if waitlist}
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head>Name</Table.Head>
						<Table.Head>Email</Table.Head>
						<Table.Head>Status</Table.Head>
						<Table.Head>Joined</Table.Head>
						<Table.Head class="w-0"></Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each waitlist.page as entry (entry._id)}
						<Table.Row>
							<Table.Cell class="font-medium">{entry.name}</Table.Cell>
							<Table.Cell>{entry.email}</Table.Cell>
							<Table.Cell>
								{#if entry.confirmedAt}
									<Badge variant="secondary">Confirmed</Badge>
								{:else}
									<Badge variant="outline">Pending</Badge>
								{/if}
							</Table.Cell>
							<Table.Cell class="text-muted-foreground">
								{dateFormatter.format(entry._creationTime)}
							</Table.Cell>
							<Table.Cell>
								<Button
									variant="ghost"
									size="icon"
									aria-label="Remove {entry.email} from the waitlist"
									disabled={removingId === entry._id}
									onclick={() => removeEntry(entry._id)}
								>
									<Trash2Icon class="size-4" />
								</Button>
							</Table.Cell>
						</Table.Row>
					{:else}
						<Table.Row>
							<Table.Cell colspan={5} class="text-center text-muted-foreground">
								No waitlist entries.
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>

			<div class="flex items-center justify-end gap-2">
				<Button
					variant="outline"
					size="sm"
					onclick={previousPage}
					disabled={previousCursors.length === 0}
				>
					<ChevronLeftIcon class="size-4" />
					Previous
				</Button>
				<Button variant="outline" size="sm" onclick={nextPage} disabled={waitlist.isDone}>
					Next
					<ChevronRightIcon class="size-4" />
				</Button>
			</div>
		{/if}
	</div>
</div>
