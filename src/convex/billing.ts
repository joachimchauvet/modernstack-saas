import { action } from './_generated/server';
import { v } from 'convex/values';
import { api } from './_generated/api';
import { Autumn } from 'autumn-js';
import { authComponent } from './auth';

// Ensure SITE_URL is set for Better Auth
if (!process.env.SITE_URL && process.env.BETTER_AUTH_URL) {
	process.env.SITE_URL = process.env.BETTER_AUTH_URL;
}

// Re-export listProducts as-is
export { listProducts } from './autumn';

// Get customer subscription data using the Autumn JS SDK directly
export const getCustomer = action({
	args: {},
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	handler: async (ctx): Promise<any> => {
		try {
			// Get the authenticated user
			const user = await authComponent.getAuthUser(ctx);
			if (!user) {
				return { data: null, error: 'Not authenticated' };
			}

			// Initialize Autumn SDK with secret key
			const autumn = new Autumn({
				secretKey: process.env.AUTUMN_SECRET_KEY ?? ''
			});

			// Get customer data using the customer ID from our user
			const customerId = user._id.toString();
			const customer = await autumn.customers.get(customerId);

			return { data: customer, error: null, statusCode: 200 };
		} catch (error) {
			console.error('Error getting customer:', error);
			return { data: null, error: String(error), statusCode: 500 };
		}
	}
});

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
