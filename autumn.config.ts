import { feature, product, featureItem, priceItem } from 'atmn';

// Features
export const messages = feature({
	id: 'messages',
	name: 'messages',
	type: 'single_use'
});

// Products
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

export const freePlan = product({
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
