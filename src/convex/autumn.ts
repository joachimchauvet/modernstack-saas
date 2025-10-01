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
