<script lang="ts">
	import { api } from '$convex/_generated/api.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Check } from '@lucide/svelte';

	import { useConvexClient } from 'convex-svelte';
	import { onMount } from 'svelte';

	interface Product {
		id: string;
		name: string;
		items?: Array<{
			price?: number;
			interval?: string;
			feature_id?: string;
			included_usage?: number | 'inf';
		}>;
	}

	interface Plan {
		id: string;
		name: string;
		price: number;
		interval: string;
		features: string[];
		isCurrent: boolean;
	}

	// Get Convex client for actions
	const client = useConvexClient();

	let products = $state<Product[]>([]);

	// Load products on mount
	onMount(async () => {
		try {
			const result = await client.action(api.billing.listProducts, {});
			if (result?.data?.list) {
				products = result.data.list;
			}
		} catch (error) {
			console.error('Error loading products:', error);
		}
	});

	async function handleCheckout(productId: string) {
		try {
			const result = await client.action(api.billing.checkout, { productId });
			if (result?.data?.url) {
				window.location.href = result.data.url;
			}
		} catch (error) {
			console.error('Checkout error:', error);
		}
	}

	async function handleManageSubscription() {
		try {
			const result = await client.action(api.billing.billingPortal, {});
			if (result?.data?.url) {
				window.location.href = result.data.url;
			}
		} catch (error) {
			console.error('Billing portal error:', error);
		}
	}

	// Map products to display format
	let plans = $derived<Plan[]>(
		Array.isArray(products)
			? products.map((product) => {
					const priceItem = product.items?.find((item) => item.price);
					const featureItem = product.items?.find((item) => item.feature_id === 'messages');

					return {
						id: product.id,
						name: product.name,
						price: priceItem?.price || 0,
						interval: priceItem?.interval || 'month',
						features: [
							`${featureItem?.included_usage || 0} messages per month`,
							product.id === 'pro' ? 'Priority support' : 'Basic support',
							product.id === 'pro' ? 'Advanced features' : 'Community access'
						],
						isCurrent: false // TODO: Get actual subscription status
					};
				})
			: []
	);
</script>

<svelte:head>
	<title>Billing | SaaS Template</title>
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
			<p class="text-muted-foreground">Manage your subscription and billing information.</p>
		</div>

		<Separator />

		<!-- Current Plan Section -->
		<div class="space-y-4">
			<h3 class="text-lg font-semibold">Current Plan</h3>
			<Card.Root>
				<Card.Header>
					<Card.Title>Free Plan</Card.Title>
					<Card.Description>You're currently on the free plan</Card.Description>
				</Card.Header>
				<Card.Content>
					<p class="text-sm text-muted-foreground">
						Upgrade to Pro for more features and higher limits.
					</p>
				</Card.Content>
				<Card.Footer>
					<Button variant="outline" onclick={handleManageSubscription}>Manage Subscription</Button>
				</Card.Footer>
			</Card.Root>
		</div>

		<!-- Available Plans Section -->
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
								<Button class="w-full" onclick={() => handleCheckout(plan.id)}>
									{plan.price === 0 ? 'Downgrade' : 'Upgrade'}
								</Button>
							{/if}
						</Card.Footer>
					</Card.Root>
				{/each}
			</div>
		</div>
	</div>
</div>
