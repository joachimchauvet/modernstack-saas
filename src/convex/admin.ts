import { action, query } from './_generated/server';
import { ConvexError, v } from 'convex/values';
import { paginationOptsValidator } from 'convex/server';
import { getAutumn, isCustomerNotFound, requireAutumn, toBillingError } from './autumn';
import { type DataModel } from './_generated/dataModel';
import { type GenericCtx } from '@convex-dev/better-auth';
import { authComponent, createAuth } from './auth';
import { deleteMany, findMany, findOne } from './authAdapter';
import { normalizeOrganizationRoles } from '../lib/organizations';

/**
 * Admin-only queries over Better Auth's organization tables.
 *
 * The Better Auth organization plugin has no cross-organization admin API —
 * all of its endpoints are membership-scoped — so these queries read the
 * component tables directly through the local-install adapter, gated on the
 * admin plugin's `role` field. For interventions inside an organization
 * (rename, remove members, manage billing), admins impersonate the owner
 * from /admin/users and use the regular org UI instead.
 */

export async function requireAdmin(ctx: GenericCtx<DataModel>) {
	const user = await authComponent.safeGetAuthUser(ctx);
	if (!user || user.role !== 'admin') {
		throw new ConvexError('Admin access required');
	}
	return user;
}

const organizationSummaryValidator = v.object({
	id: v.string(),
	name: v.string(),
	slug: v.string(),
	logo: v.union(v.null(), v.string()),
	metadata: v.any(),
	createdAt: v.number(),
	memberCount: v.number(),
	owner: v.union(v.null(), v.object({ name: v.string(), email: v.string() }))
});

export const listOrganizations = query({
	args: {
		paginationOpts: paginationOptsValidator,
		search: v.optional(v.string())
	},
	returns: v.object({
		page: v.array(organizationSummaryValidator),
		isDone: v.boolean(),
		continueCursor: v.string()
	}),
	handler: async (ctx, args) => {
		await requireAdmin(ctx);
		// The Convex adapter doesn't support case-insensitive `contains`, so
		// search scans a bounded window (most recent 500 organizations) and
		// filters here instead of using cursor pagination.
		const search = args.search?.trim().toLowerCase();
		const result = await findMany(ctx, {
			model: 'organization',
			paginationOpts: search
				? { numItems: 500, cursor: null }
				: { numItems: args.paginationOpts.numItems, cursor: args.paginationOpts.cursor },
			sortBy: { field: 'createdAt', direction: 'desc' }
		});
		const matches = search
			? // eslint-disable-next-line @typescript-eslint/no-explicit-any
				result.page.filter((organization: any) =>
					`${organization.name} ${organization.slug}`.toLowerCase().includes(search)
				)
			: result.page;

		const page = await Promise.all(
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			matches.slice(0, args.paginationOpts.numItems).map(async (organization: any) => {
				const members = await findMany(ctx, {
					model: 'member',
					where: [{ field: 'organizationId', value: String(organization._id) }],
					paginationOpts: { numItems: 1000, cursor: null }
				});
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const ownerMember = members.page.find((member: any) => member.role === 'owner');
				const owner = ownerMember
					? await findOne(ctx, {
							model: 'user',
							where: [{ field: '_id', value: String(ownerMember.userId) }]
						})
					: null;
				return {
					id: String(organization._id),
					name: organization.name as string,
					slug: organization.slug as string,
					logo: (organization.logo ?? null) as string | null,
					metadata: organization.metadata ?? null,
					createdAt: organization.createdAt as number,
					memberCount: members.page.length,
					owner: owner ? { name: String(owner.name), email: String(owner.email) } : null
				};
			})
		);

		return {
			page,
			// Search results are a single page; browsing paginates normally
			isDone: search ? true : result.isDone,
			continueCursor: search ? '' : result.continueCursor
		};
	}
});

export const getOrganization = query({
	args: { organizationId: v.string() },
	returns: v.union(
		v.null(),
		v.object({
			id: v.string(),
			name: v.string(),
			slug: v.string(),
			logo: v.union(v.null(), v.string()),
			metadata: v.any(),
			createdAt: v.number(),
			members: v.array(
				v.object({
					id: v.string(),
					role: v.string(),
					createdAt: v.number(),
					user: v.object({
						name: v.string(),
						email: v.string(),
						image: v.union(v.null(), v.string())
					})
				})
			),
			invitations: v.array(
				v.object({
					id: v.string(),
					email: v.string(),
					role: v.union(v.null(), v.string()),
					status: v.string(),
					expiresAt: v.number()
				})
			)
		})
	),
	handler: async (ctx, args) => {
		await requireAdmin(ctx);
		const organization = await findOne(ctx, {
			model: 'organization',
			where: [{ field: '_id', value: args.organizationId }]
		});
		if (!organization) return null;

		const members = await findMany(ctx, {
			model: 'member',
			where: [{ field: 'organizationId', value: args.organizationId }],
			paginationOpts: { numItems: 1000, cursor: null }
		});
		const invitations = await findMany(ctx, {
			model: 'invitation',
			where: [
				{ field: 'organizationId', value: args.organizationId },
				{ field: 'status', value: 'pending' }
			],
			paginationOpts: { numItems: 200, cursor: null }
		});

		return {
			id: String(organization._id),
			name: String(organization.name),
			slug: String(organization.slug),
			logo: (organization.logo ?? null) as string | null,
			metadata: organization.metadata ?? null,
			createdAt: organization.createdAt as number,
			members: await Promise.all(
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				members.page.map(async (member: any) => {
					const user = await findOne(ctx, {
						model: 'user',
						where: [{ field: '_id', value: String(member.userId) }]
					});
					return {
						id: String(member._id),
						role: String(member.role),
						createdAt: member.createdAt as number,
						user: {
							name: String(user?.name ?? 'Unknown'),
							email: String(user?.email ?? ''),
							image: (user?.image ?? null) as string | null
						}
					};
				})
			),
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			invitations: invitations.page.map((invitation: any) => ({
				id: String(invitation._id),
				email: String(invitation.email),
				role: (invitation.role ?? null) as string | null,
				status: String(invitation.status),
				expiresAt: invitation.expiresAt as number
			}))
		};
	}
});

// Billing state for any organization (admin-only). Unlike billing.ts, the
// customer id comes from the argument rather than the caller's active
// organization.
export const getOrganizationBilling = action({
	args: { organizationId: v.string() },
	returns: v.object({
		data: v.any(),
		error: v.union(v.null(), v.object({ message: v.string(), code: v.string() }))
	}),
	handler: async (ctx, args) => {
		await requireAdmin(ctx);
		try {
			const autumn = requireAutumn();
			const data = await autumn.customers.get({ customerId: args.organizationId });
			return { data, error: null };
		} catch (error) {
			if (isCustomerNotFound(error)) return { data: null, error: null };
			return { data: null, error: toBillingError(error) };
		}
	}
});

/**
 * Clean up a user's organizations, leaving the user row for the caller to
 * delete afterward. Ownership is immutable and an organization can't outlive
 * its owner:
 *
 * - An org the user solely owns that still has **other members** BLOCKS the
 *   deletion (throws before anything is deleted) — the admin must remove those
 *   members or delete the org first, so deleting one user never silently evicts
 *   a team or cancels their subscription.
 * - An org the user solely owns with **no other members** is cascade-deleted
 *   (Autumn customer, invitations, members, org row), mirroring
 *   `beforeDeleteOrganization`.
 * - Orgs where the user is a **non-owner** member: just drop the membership.
 *
 * The block check runs before any deletes, and the user itself is deleted only
 * after this returns, so a blocked deletion leaves the user able to sign in and
 * a mid-cascade failure leaves the user (and not-yet-processed orgs) intact and
 * the operation safe to retry.
 */
async function cascadeUserOrganizations(ctx: GenericCtx<DataModel>, userId: string) {
	// Collect the orgs this user owns.
	const ownedOrgIds: string[] = [];
	let cursor: string | null = null;
	do {
		const memberships = await findMany(ctx, {
			model: 'member',
			where: [{ field: 'userId', value: userId }],
			paginationOpts: { numItems: 200, cursor }
		});
		for (const member of memberships.page) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const row = member as any;
			if (normalizeOrganizationRoles(row.role).includes('owner')) {
				ownedOrgIds.push(String(row.organizationId));
			}
		}
		cursor = memberships.isDone ? null : (memberships.continueCursor ?? null);
	} while (cursor);

	// Block if any owned org still has other members (no mutations yet).
	for (const orgId of ownedOrgIds) {
		const members = await findMany(ctx, {
			model: 'member',
			where: [{ field: 'organizationId', value: orgId }],
			paginationOpts: { numItems: 1000, cursor: null }
		});
		const hasOtherMembers = members.page.some(
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(member: any) => String(member.userId) !== userId
		);
		if (hasOtherMembers) {
			throw new ConvexError(
				'This user owns organizations with other members. Remove those members or delete the organizations before deleting the user.'
			);
		}
	}

	// Cascade-delete each solo-owned org. Billing first (mirroring
	// beforeDeleteOrganization); a failure throws before the user is deleted.
	const autumn = getAutumn();
	for (const orgId of ownedOrgIds) {
		if (autumn) {
			try {
				await autumn.customers.delete({ customerId: orgId, deleteInStripe: true });
			} catch (error) {
				if (!isCustomerNotFound(error)) {
					console.error('Failed to delete Autumn customer during user deletion:', error);
					throw new ConvexError("Failed to cancel an organization's subscription");
				}
			}
		}
		await deleteMany(ctx, {
			model: 'invitation',
			where: [{ field: 'organizationId', value: orgId }]
		});
		await deleteMany(ctx, { model: 'member', where: [{ field: 'organizationId', value: orgId }] });
		await deleteMany(ctx, { model: 'organization', where: [{ field: '_id', value: orgId }] });
	}

	// Drop any remaining memberships (orgs where the user was a non-owner).
	await deleteMany(ctx, { model: 'member', where: [{ field: 'userId', value: userId }] });
}

/**
 * Delete a user (admin only), cleaning up their organizations and billing
 * first. This orchestrates the deletion rather than relying on a Better Auth
 * `user.delete` hook: `removeUser` deletes the user's sessions and accounts
 * *before* any `user` model hook runs, so a hook that blocked or failed would
 * leave the user unable to authenticate. Ordering it here keeps it correct —
 * decide and clean up org/billing state, then delete the user.
 */
export const removeUser = action({
	args: { userId: v.string() },
	returns: v.null(),
	handler: async (ctx, args) => {
		const admin = await requireAdmin(ctx);
		if (String(admin._id) === args.userId) {
			// Better Auth also rejects self-deletion, but we must catch it before
			// cascading so we don't tear down the admin's own orgs then abort.
			throw new ConvexError("You can't delete your own account");
		}
		await cascadeUserOrganizations(ctx, args.userId);
		const { auth, headers } = await authComponent.getAuth(createAuth, ctx);
		await auth.api.removeUser({ body: { userId: args.userId }, headers });
		return null;
	}
});
