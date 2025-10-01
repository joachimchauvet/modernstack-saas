# Autumn Integration Guidelines

## Overview

Autumn is a billing and subscription management platform that integrates with Stripe. This guide covers how to use Autumn in a SvelteKit + Convex application.

## Setup

### 1. Installation

```bash
pnpm add autumn-js @useautumn/convex
pnpm add -D atmn
```

### 2. Initialize Autumn

Initialize Autumn to create the configuration file:

```bash
pnpm dlx atmn init
```

This creates `autumn.config.ts` in your project root where you'll define products.

### 3. Environment Configuration

Set your Autumn secret key in Convex:

```bash
pnpm dlx convex env set AUTUMN_SECRET_KEY=am_sk_xxx
```

### 4. Convex Configuration

Update `convex/convex.config.ts` to include the Autumn component:

```typescript
import { defineApp } from 'convex/server';
import betterAuth from './betterAuth/convex.config';
import autumn from '@useautumn/convex/convex.config';

const app = defineApp();
app.use(betterAuth);
app.use(autumn);

export default app;
```

### 5. Autumn Client Setup

Create `convex/autumn.ts` to initialize the Autumn client and define customer identification:

```typescript
import { components } from './_generated/api';
import { Autumn } from '@useautumn/convex';
import { authComponent } from './auth';

export const autumn = new Autumn(components.autumn, {
	secretKey: process.env.AUTUMN_SECRET_KEY ?? '',
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	identify: async (ctx: any) => {
		try {
			const user = await authComponent.getAuthUser(ctx);
			if (!user) return null;

			return {
				customerId: user._id,
				customerData: {
					name: user.name ?? '',
					email: user.email ?? ''
				}
			};
		} catch {
			// User is not authenticated, return null
			return null;
		}
	}
});

export const {
	track,
	cancel,
	query,
	attach,
	check,
	checkout,
	usage,
	setupPayment,
	createCustomer,
	listProducts,
	billingPortal,
	createReferralCode,
	redeemReferralCode,
	createEntity,
	getEntity
} = autumn.api();
```

**Key Points:**

- The `identify` function maps authenticated users to Autumn customers
- Use the Convex user's `_id` as the `customerId` for consistency
- Catch authentication errors gracefully - unauthenticated users can still view products
- Export all Autumn API methods for use in other Convex functions

## Product Configuration

### 1. Define Products

Create `autumn.config.ts` in the project root:

```typescript
import { feature, product, featureItem, priceItem } from 'atmn';

// Define Features
export const messages = feature({
	id: 'messages',
	name: 'Messages',
	type: 'single_use'
});

// Define Products
export const free = product({
	id: 'free_plan',
	name: 'Free Plan',
	items: [
		featureItem({
			feature_id: messages.id,
			included_usage: 5,
			interval: 'month'
		})
	]
});

export const pro = product({
	id: 'pro',
	name: 'Pro',
	items: [
		featureItem({
			feature_id: messages.id,
			included_usage: 100,
			interval: 'month'
		}),
		priceItem({
			price: 20,
			interval: 'month'
		})
	]
});
```

### 2. Push Products to Autumn

```bash
pnpm dlx atmn push
```

This syncs your products to Autumn's sandbox environment.

## Creating Billing Functions

Create `convex/billing.ts` to wrap Autumn functions:

```typescript
import { action } from './_generated/server';
import { v } from 'convex/values';
import { api } from './_generated/api';

// Re-export listProducts as-is (doesn't require auth)
export { listProducts } from './autumn';

// Wrapper for checkout that creates customer first
export const checkout = action({
	args: { productId: v.string() },
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	handler: async (ctx, args): Promise<any> => {
		// First ensure customer exists by calling createCustomer
		await ctx.runAction(api.autumn.createCustomer, {});

		// Now proceed with checkout
		return await ctx.runAction(api.autumn.checkout, { productId: args.productId });
	}
});

// Wrapper for billing portal that creates customer first
export const billingPortal = action({
	args: {},
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	handler: async (ctx): Promise<any> => {
		// First ensure customer exists by calling createCustomer
		await ctx.runAction(api.autumn.createCustomer, {});

		// Now proceed with billing portal
		return await ctx.runAction(api.autumn.billingPortal, {});
	}
});
```

**Important:**

- Always call `createCustomer` before `checkout` or `billingPortal` to ensure the customer exists
- `createCustomer` is idempotent - it won't error if the customer already exists
- Use wrapper actions to handle customer creation automatically

## Frontend Integration

### Loading Products

```typescript
import { useConvexClient } from 'convex-svelte';
import { api } from '$convex/_generated/api.js';
import { onMount } from 'svelte';

const client = useConvexClient();
let products = $state<Product[]>([]);

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
```

**Key Points:**

- Products are returned in `result.data.list`, not `result.data`
- `listProducts` doesn't require authentication
- Products contain `items` array with pricing and feature information

### Checkout Flow

```typescript
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
```

### Billing Portal

```typescript
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
```

## Data Structure

### Product Object

```typescript
interface Product {
	id: string;
	name: string;
	items?: Array<{
		price?: number;
		interval?: string; // 'month' | 'year'
		feature_id?: string;
		included_usage?: number;
	}>;
}
```

### Response Format

Autumn API responses follow this structure:

```typescript
{
	data: any | null;
	error: AutumnError | null;
	statusCode?: number;
}
```

## Common Patterns

### Parsing Product Data

```typescript
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
					features: [`${featureItem?.included_usage || 0} messages per month`]
				};
			})
		: []
);
```

### Feature Access Control

```typescript
import { check, track } from './autumn';

// Check if user has access to a feature
export const canAccessFeature = action({
	args: { featureId: v.string() },
	handler: async (ctx, { featureId }) => {
		const result = await ctx.runAction(check, { featureId });
		return result?.data?.allowed || false;
	}
});

// Track feature usage
export const trackUsage = action({
	args: { featureId: v.string() },
	handler: async (ctx, { featureId }) => {
		await ctx.runAction(track, { featureId });
	}
});
```

## Best Practices

1. **Customer Creation**: Always ensure customers exist before checkout or billing operations
2. **Error Handling**: Wrap Autumn calls in try-catch blocks and handle errors gracefully
3. **Authentication**: Use the `identify` function to automatically map authenticated users to customers
4. **Product IDs**: Use consistent product IDs between `autumn.config.ts` and your frontend
5. **Testing**: Use Autumn's sandbox environment for development and testing
6. **Type Safety**: Define TypeScript interfaces for products and responses

## Resources

- [Autumn Documentation](https://docs.useautumn.com)
- [Autumn Setup Guide](https://docs.useautumn.com/setup.md)
- [Autumn Convex Integration](https://docs.useautumn.com/setup/convex)
- [Better Auth Autumn Plugin (with React and without Convex)](https://www.better-auth.com/docs/plugins/autumn)
