<script lang="ts">
	import { api } from '$convex/_generated/api.js';
	import { useConvexClient, useQuery } from 'convex-svelte';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import { Debounced } from 'runed';
	import { showErrorToast } from '$lib/toast.js';

	const PAGE_SIZE = 20;

	const client = useConvexClient();

	let search = $state('');
	const debouncedSearch = new Debounced(() => search.trim(), 300);

	let cursor = $state<string | null>(null);
	let previousCursors = $state<Array<string | null>>([]);

	// Reset pagination when the search changes. Done in the search field's
	// input handler (below) rather than a state-syncing $effect, per the
	// project's guidance against effects — and it avoids a transient query
	// with the previous cursor before the effect would have reset it.
	function resetPagination() {
		cursor = null;
		previousCursors = [];
	}

	const organizationsResponse = useQuery(api.admin.listOrganizations, () => ({
		paginationOpts: { numItems: PAGE_SIZE, cursor },
		...(debouncedSearch.current ? { search: debouncedSearch.current } : {})
	}));
	let organizations = $derived(organizationsResponse.data);

	function nextPage() {
		if (!organizations || organizations.isDone) return;
		previousCursors = [...previousCursors, cursor];
		cursor = organizations.continueCursor;
	}

	function previousPage() {
		if (previousCursors.length === 0) return;
		cursor = previousCursors[previousCursors.length - 1];
		previousCursors = previousCursors.slice(0, -1);
	}

	// Detail sheet — 'skip' keeps a single stable query that only subscribes
	// while an organization is selected
	let selectedOrganizationId = $state<string | null>(null);
	const detailResponse = useQuery(api.admin.getOrganization, () =>
		selectedOrganizationId ? { organizationId: selectedOrganizationId } : 'skip'
	);
	let detail = $derived(detailResponse.data ?? null);

	interface BillingSummary {
		customerExists: boolean;
		plans: Array<{ name: string; status: string }>;
	}

	let billing = $state<BillingSummary | null>(null);
	let billingError = $state<string | null>(null);
	let isBillingLoading = $state(false);

	async function openOrganization(organizationId: string) {
		selectedOrganizationId = organizationId;
		billing = null;
		billingError = null;
		isBillingLoading = true;
		try {
			const result = await client.action(api.admin.getOrganizationBilling, { organizationId });
			if (selectedOrganizationId !== organizationId) return;
			// Distinguish a billing failure (misconfigured/unreachable Autumn)
			// from an organization that genuinely has no customer yet.
			if (result?.error) {
				billingError = result.error.message;
				return;
			}
			billing = {
				customerExists: Boolean(result?.data),
				plans: (result?.data?.subscriptions ?? []).map(
					(subscription: { plan?: { name?: string | null }; planId: string; status: string }) => ({
						name: subscription.plan?.name ?? subscription.planId,
						status: subscription.status
					})
				)
			};
		} catch (error) {
			if (selectedOrganizationId !== organizationId) return;
			showErrorToast(error, 'Failed to load billing information');
		} finally {
			if (selectedOrganizationId === organizationId) {
				isBillingLoading = false;
			}
		}
	}

	const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });
</script>

<svelte:head>
	<title>Organizations | Admin</title>
</svelte:head>

<!-- Header -->
<header
	class="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear"
>
	<div class="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
		<Sidebar.Trigger class="-ml-1" />
		<Separator orientation="vertical" class="mx-2 data-[orientation=vertical]:h-4" />
		<h1 class="text-base font-medium">Organizations</h1>
	</div>
</header>

<!-- Main Content -->
<div class="flex flex-1 flex-col">
	<div class="flex-1 space-y-6 p-6 md:p-10">
		<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
			<div>
				<h2 class="text-2xl font-bold tracking-tight">Organizations</h2>
				<p class="text-muted-foreground">
					All organizations across the app. To act inside an organization, impersonate its owner
					from the Users page.
				</p>
			</div>
			<Input
				bind:value={search}
				oninput={resetPagination}
				placeholder="Search by name..."
				class="sm:max-w-xs"
			/>
		</div>

		<Separator />

		{#if organizationsResponse.isLoading}
			<div class="space-y-3">
				<Skeleton class="h-10 w-full" />
				<Skeleton class="h-10 w-full" />
				<Skeleton class="h-10 w-full" />
			</div>
		{:else if organizations}
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head>Organization</Table.Head>
						<Table.Head>Members</Table.Head>
						<Table.Head>Owner</Table.Head>
						<Table.Head>Created</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each organizations.page as organization (organization.id)}
						<Table.Row class="cursor-pointer" onclick={() => openOrganization(organization.id)}>
							<Table.Cell>
								<div class="flex items-center gap-3">
									<Avatar.Root class="size-8 rounded-md">
										{#if organization.logo}
											<Avatar.Image src={organization.logo} alt={organization.name} />
										{/if}
										<Avatar.Fallback class="rounded-md text-xs">
											{organization.name.charAt(0).toUpperCase()}
										</Avatar.Fallback>
									</Avatar.Root>
									<div class="grid leading-tight">
										<span class="font-medium">{organization.name}</span>
										<span class="text-xs text-muted-foreground">{organization.slug}</span>
									</div>
								</div>
							</Table.Cell>
							<Table.Cell>{organization.memberCount}</Table.Cell>
							<Table.Cell>
								{#if organization.owner}
									<div class="grid leading-tight">
										<span>{organization.owner.name}</span>
										<span class="text-xs text-muted-foreground">{organization.owner.email}</span>
									</div>
								{:else}
									<span class="text-muted-foreground">—</span>
								{/if}
							</Table.Cell>
							<Table.Cell class="text-muted-foreground">
								{dateFormatter.format(organization.createdAt)}
							</Table.Cell>
						</Table.Row>
					{:else}
						<Table.Row>
							<Table.Cell colspan={4} class="text-center text-muted-foreground">
								No organizations found.
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
				<Button variant="outline" size="sm" onclick={nextPage} disabled={organizations.isDone}>
					Next
					<ChevronRightIcon class="size-4" />
				</Button>
			</div>
		{/if}
	</div>
</div>

<Sheet.Root
	open={selectedOrganizationId !== null}
	onOpenChange={(open) => {
		if (!open) selectedOrganizationId = null;
	}}
>
	<Sheet.Content class="overflow-y-auto sm:max-w-lg">
		{#if detailResponse.isLoading}
			<div class="space-y-3 p-4">
				<Skeleton class="h-8 w-2/3" />
				<Skeleton class="h-24 w-full" />
				<Skeleton class="h-24 w-full" />
			</div>
		{:else if detail}
			<Sheet.Header>
				<Sheet.Title>{detail.name}</Sheet.Title>
				<Sheet.Description>
					{detail.slug} · created {dateFormatter.format(detail.createdAt)}
				</Sheet.Description>
			</Sheet.Header>

			<div class="space-y-6 px-4 pb-4">
				<div class="space-y-2">
					<h3 class="text-sm font-semibold">Billing</h3>
					{#if isBillingLoading}
						<Skeleton class="h-6 w-1/2" />
					{:else if billingError}
						<p class="text-sm text-destructive">{billingError}</p>
					{:else if billing?.plans.length}
						<div class="flex flex-wrap gap-2">
							{#each billing.plans as plan (plan.name)}
								<Badge variant="outline">{plan.name} · {plan.status}</Badge>
							{/each}
						</div>
					{:else if billing?.customerExists}
						<p class="text-sm text-muted-foreground">Customer exists, no plans attached.</p>
					{:else}
						<p class="text-sm text-muted-foreground">No billing customer yet.</p>
					{/if}
					<p class="text-xs text-muted-foreground">Autumn customer id: {detail.id}</p>
				</div>

				<div class="space-y-2">
					<h3 class="text-sm font-semibold">
						Members ({detail.members.length})
					</h3>
					<div class="space-y-2">
						{#each detail.members as member (member.id)}
							<div class="flex items-center gap-3">
								<Avatar.Root class="size-8">
									{#if member.user.image}
										<Avatar.Image src={member.user.image} alt={member.user.name} />
									{/if}
									<Avatar.Fallback class="text-xs">
										{(member.user.name || member.user.email).charAt(0).toUpperCase()}
									</Avatar.Fallback>
								</Avatar.Root>
								<div class="grid flex-1 leading-tight">
									<span class="text-sm font-medium">{member.user.name}</span>
									<span class="text-xs text-muted-foreground">{member.user.email}</span>
								</div>
								<Badge variant="secondary" class="capitalize">{member.role}</Badge>
							</div>
						{/each}
					</div>
				</div>

				{#if detail.invitations.length > 0}
					<div class="space-y-2">
						<h3 class="text-sm font-semibold">
							Pending Invitations ({detail.invitations.length})
						</h3>
						<div class="space-y-2">
							{#each detail.invitations as invitation (invitation.id)}
								<div class="flex items-center justify-between gap-3">
									<span class="text-sm">{invitation.email}</span>
									<span class="text-xs text-muted-foreground">
										{invitation.role ?? 'member'} · expires {dateFormatter.format(
											invitation.expiresAt
										)}
									</span>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		{/if}
	</Sheet.Content>
</Sheet.Root>
