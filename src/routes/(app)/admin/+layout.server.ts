import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { api } from '$convex/_generated/api.js';
import { createConvexHttpClient } from '@mmailaender/convex-better-auth-svelte/sveltekit';
import { SITE_URL } from '$env/static/private';

if (SITE_URL && !process.env.SITE_URL) {
	process.env.SITE_URL = SITE_URL;
}

export const load: LayoutServerLoad = async ({ cookies }) => {
	// Create Convex client with cookies (automatically extracts auth token)
	const client = createConvexHttpClient({ cookies });

	try {
		// Fetch current user using Convex query
		const user = await client.query(api.auth.getCurrentUser, {});

		// Check if user is authenticated
		if (!user) {
			throw error(401, 'Unauthorized');
		}

		// Check if user has admin role
		if (user.role !== 'admin') {
			throw error(403, 'Forbidden: Admin access required');
		}

		return {
			user
		};
	} catch {
		// Handle any errors as unauthorized
		throw error(401, 'Unauthorized');
	}
};
