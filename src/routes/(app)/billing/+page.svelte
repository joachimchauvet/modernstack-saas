<script lang="ts">
	import { api } from '$convex/_generated/api.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Check } from '@lucide/svelte';

	import { invalidateAll } from '$app/navigation';
	import { useConvexClient, useQuery } from 'convex-svelte';
	import { showErrorToast } from '$lib/toast.js';
	import { canManageOrganization } from '$lib/organizations.js';
	import type { Customer, ListPlansList } from 'autumn-js';
	import type { PageData } from './$types';
	import { siteConfig } from '$lib/config.js';

	const { data }: { data: PageData } = $props();

	// Billing is scoped to the active organization. Members can view the
	// current plan; only owners and admins can manage the subscription
	// (also enforced server-side in convex/billing.ts).
	const organizationResponse = useQuery(api.organizations.getActiveOrganization, {});
	let organization = $derived(organizationResponse.data);
	let canManageBilling = $derived(canManageOrganization(organization?.currentMemberRole));

	interface Plan {
		id: string;
		name: string;
		price: number;
		interval: string;
		features: string[];
		isCurrent: boolean;
	}

	// Get Convex client for actions (attach/portal)
	const client = useConvexClient();

	// Derived from the server load data so they stay in sync if `data` changes
	// (e.g. on client-side navigation / invalidation), rather than capturing only
	// the initial value.
	let availablePlans = $derived<ListPlansList[]>(data.plans || []);
	// The Autumn customer for the active organization (null until provisioned),
	// typed by autumn-js via the api.billing.getCustomer return type
	let customerData = $derived<Customer | null>(data.customerData?.data ?? null);

	async function handleAttach(planId: string) {
		try {
			const result = await client.action(api.billing.attach, { planId });
			if (result?.error) throw new Error(result.error.message);
			if (result?.data?.paymentUrl) {
				window.location.href = result.data.paymentUrl;
			} else {
				// Plan changes that need no payment input apply immediately
				await invalidateAll();
			}
		} catch (error) {
			showErrorToast(error, 'Failed to start checkout');
		}
	}

	async function handleManageSubscription() {
		try {
			const result = await client.action(api.billing.billingPortal, {});
			if (result?.error) throw new Error(result.error.message);
			if (result?.data?.url) {
				window.location.href = result.data.url;
			}
		} catch (error) {
			showErrorToast(error, 'Failed to open the billing portal');
		}
	}

	// Plan IDs of the organization's active subscriptions (the auto-enabled
	// free plan shows up here too)
	let activePlanIds = $derived<string[]>(
		(customerData?.subscriptions ?? [])
			.filter((subscription) => subscription.status === 'active')
			.map((subscription) => subscription.planId)
	);

	// Map plans to display format
	let plans = $derived<Plan[]>(
		availablePlans.map((plan) => {
			const messagesItem = plan.items?.find((item) => item.featureId === 'messages');
			const included = messagesItem?.unlimited ? 'Unlimited' : (messagesItem?.included ?? 0);

			return {
				id: plan.id,
				name: plan.name,
				price: plan.price?.amount ?? 0,
				interval: plan.price?.interval ?? 'month',
				features: [
					`${included} messages per month`,
					plan.id === 'pro' ? 'Priority support' : 'Basic support',
					plan.id === 'pro' ? 'Advanced features' : 'Community access'
				],
				isCurrent: activePlanIds.includes(plan.id)
			};
		})
	);

	let currentPlan = $derived<Plan | null>(plans.find((plan) => plan.isCurrent) ?? null);
</script>

<svelte:head>
	<title>Billing | {siteConfig.name}</title>
</svelte:head>

<!-- Header -->
<header
	class="flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12"
>
	<div class="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
		<Sidebar.Trigger class="-ml-1" />
		<Separator orientation="vertical" class="mx-2 data-[orientation=vertical]:h-4" />
		<h1 class="text-base font-medium">Billing</h1>
	</div>
</header>

<!-- Main Content -->
<div class="flex flex-1 flex-col">
	<div class="flex-1 space-y-6 p-6 md:p-10">
		<div>
			<h2 class="text-2xl font-bold tracking-tight">Billing</h2>
			<p class="text-muted-foreground">
				{#if organization}
					Manage the subscription and billing information for <span class="font-medium"
						>{organization.name}</span
					>.
				{:else}
					Manage your subscription and billing information.
				{/if}
			</p>
		</div>

		<Separator />

		{#if data.billingError}
			<Alert.Root variant="destructive">
				<Alert.Title>Billing is unavailable</Alert.Title>
				<Alert.Description>{data.billingError}</Alert.Description>
			</Alert.Root>
		{/if}

		<!-- Current Plan Section -->
		<div class="space-y-4">
			<h3 class="text-lg font-semibold">Current Plan</h3>
			{#if currentPlan}
				<Card.Root>
					<Card.Header>
						<Card.Title>{currentPlan.name}</Card.Title>
						<Card.Description>
							{#if currentPlan.price > 0}
								${currentPlan.price}/{currentPlan.interval} · Active subscription
							{:else}
								You're currently on the {currentPlan.name.toLowerCase()}
							{/if}
						</Card.Description>
					</Card.Header>
					<Card.Content>
						<ul class="space-y-2">
							{#each currentPlan.features as feature, i (i)}
								<li class="flex items-center gap-2">
									<Check class="h-4 w-4 text-primary" />
									<span class="text-sm">{feature}</span>
								</li>
							{/each}
						</ul>
					</Card.Content>
					<Card.Footer>
						{#if canManageBilling}
							<Button variant="outline" onclick={handleManageSubscription}>
								Manage Subscription
							</Button>
						{:else}
							<p class="text-sm text-muted-foreground">
								Contact an organization owner or admin to manage the subscription.
							</p>
						{/if}
					</Card.Footer>
				</Card.Root>
			{:else}
				<Card.Root>
					<Card.Header>
						<Card.Title>No Active Plan</Card.Title>
						<Card.Description>
							{canManageBilling
								? 'Choose a plan below to get started'
								: 'Contact an organization owner or admin to choose a plan.'}
						</Card.Description>
					</Card.Header>
				</Card.Root>
			{/if}
		</div>

		<!-- Available Plans Section (owners and admins only) -->
		{#if canManageBilling}
			<div class="space-y-4">
				<h3 class="text-lg font-semibold">Available Plans</h3>
				<div class="grid gap-6 md:grid-cols-2">
					{#each plans as plan (plan.id)}
						<Card.Root class="relative">
							{#if plan.isCurrent}
								<Badge class="absolute top-4 right-4">Current Plan</Badge>
							{/if}
							<Card.Header>
								<Card.Title>{plan.name}</Card.Title>
								<Card.Description>
									<span class="text-3xl font-bold">${plan.price}</span>
									<span class="text-muted-foreground">/{plan.interval}</span>
								</Card.Description>
							</Card.Header>
							<Card.Content>
								<ul class="space-y-2">
									{#each plan.features as feature, i (i)}
										<li class="flex items-center gap-2">
											<Check class="h-4 w-4 text-primary" />
											<span class="text-sm">{feature}</span>
										</li>
									{/each}
								</ul>
							</Card.Content>
							<Card.Footer>
								{#if plan.isCurrent}
									<Button variant="outline" disabled class="w-full">Current Plan</Button>
								{:else}
									<Button class="w-full" onclick={() => handleAttach(plan.id)}>
										{plan.price === 0 ? 'Downgrade' : 'Upgrade'}
									</Button>
								{/if}
							</Card.Footer>
						</Card.Root>
					{/each}
				</div>
			</div>
		{/if}
	</div>
</div>
