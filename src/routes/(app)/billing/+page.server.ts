import { createConvexHttpClient } from '@mmailaender/convex-better-auth-svelte/sveltekit';
import { api } from '$convex/_generated/api';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies }) => {
	const client = createConvexHttpClient({ cookies });

	try {
		// Fetch products and customer data in parallel
		const [productsResult, customerResult] = await Promise.all([
			client.action(api.billing.listProducts, {}),
			client.action(api.billing.getCustomer, {})
		]);

		return {
			products: productsResult?.data?.list || [],
			customerData: customerResult || null
		};
	} catch (error) {
		console.error('Error loading billing data:', error);
		return {
			products: [],
			customerData: null
		};
	}
};
