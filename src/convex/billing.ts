import { action } from './_generated/server';
import { v } from 'convex/values';
import { api } from './_generated/api';

// Re-export listProducts as-is
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
