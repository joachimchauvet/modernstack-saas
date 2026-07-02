import { createClient, type GenericCtx } from '@convex-dev/better-auth';
import { convex } from '@convex-dev/better-auth/plugins';
import { components } from './_generated/api';
import { type DataModel } from './_generated/dataModel';
import { query } from './_generated/server';
import { betterAuth, type BetterAuthOptions } from 'better-auth';
import { APIError } from 'better-auth/api';
import { admin, organization } from 'better-auth/plugins';
import { getAutumn, isCustomerNotFound } from './autumn';
import authSchema from './betterAuth/schema';
import authConfig from './auth.config';
import { actionEmailHtml, escapeHtml, sendEmail } from './email';
import { countOwnedOrganizations, findOne, updateMany } from './authAdapter';
import { siteConfig } from '../lib/config';
import {
	assignableOrganizationRoles,
	normalizeOrganizationRoles,
	slugifyOrganizationName
} from '../lib/organizations';

const siteUrl = process.env.SITE_URL!;

async function createAutumnCustomerForOrganization({
	organization,
	user
}: {
	organization: { id: string; name: string };
	user: { email: string };
}) {
	const autumn = getAutumn();
	if (!autumn) return;

	try {
		await autumn.customers.getOrCreate({
			customerId: organization.id,
			name: organization.name,
			email: user.email
		});
	} catch (error) {
		// Don't throw from afterCreateOrganization: Better Auth has already
		// persisted the org/member rows by then, so throwing would fail the
		// request without rolling those writes back.
		console.error('Failed to create Autumn customer:', error);
	}
}

// The component client has methods needed for integrating Convex with Better Auth,
// as well as helper methods for general use.
export const authComponent = createClient<DataModel, typeof authSchema>(components.betterAuth, {
	local: {
		schema: authSchema
	}
});

/**
 * Every user gets a default organization on sign-up. This keeps the data
 * model uniform: billing and app data always hang off an organization, so
 * the same template works for B2C (users stay in their own org) and B2B
 * (users create or join shared organizations). It's a regular organization —
 * the user can rename it, invite people into it, or delete it once they own
 * another one (see the deletion guard in `organizationHooks` below).
 */
const createDefaultOrganization = async (
	ctx: GenericCtx<DataModel>,
	user: { id: string; name?: string | null; email: string }
) => {
	const auth = createAuth(ctx);
	const slugBase = slugifyOrganizationName(user.name || user.email.split('@')[0]) || 'workspace';
	return await auth.api.createOrganization({
		body: {
			name: user.name ? `${user.name}'s Workspace` : 'My Workspace',
			slug: `${slugBase}-${crypto.randomUUID().slice(0, 8)}`,
			// Server-side call: create the organization on behalf of the new user.
			userId: user.id
		}
	});
};

/**
 * Members and invitations may only carry a single canonical role —
 * `owner` is reserved for the creator, and multi-role values (which Better
 * Auth would store as comma-separated strings) are rejected so stored roles
 * stay canonical and safe to compare by equality.
 */
const requireAssignableRole = (roles: string[]) => {
	const isValid =
		roles.length === 1 && (assignableOrganizationRoles as readonly string[]).includes(roles[0]);
	if (!isValid) {
		throw new APIError('BAD_REQUEST', {
			message: `Role must be one of: ${assignableOrganizationRoles.join(', ')}`
		});
	}
};

// Plain options factory — used both by `betterAuth()` at runtime and by
// `createApi()` in the component adapter so it can introspect the schema.

export const createOptions = (ctx: GenericCtx<DataModel>) =>
	({
		baseURL: siteUrl,
		database: authComponent.adapter(ctx),
		advanced: {
			database: {
				// Convex generates document ids; without this, flows that generate
				// ids up front (e.g. organization invitations) fail validation.
				generateId: false
			}
		},
		// User configuration
		user: {
			changeEmail: {
				enabled: true,
				sendChangeEmailConfirmation: async ({ user, newEmail, url }) => {
					await sendEmail({
						to: user.email,
						subject: 'Approve email change',
						html: actionEmailHtml({
							greeting: `Hello ${escapeHtml(user.name ?? 'there')},`,
							bodyLines: [
								`We received a request to change your email address to <strong>${escapeHtml(newEmail)}</strong>.`,
								'Click the button below to approve this change:'
							],
							ctaLabel: 'Approve Email Change',
							ctaUrl: url,
							footerLine:
								"If you didn't request this change, please ignore this email or contact support."
						})
					});
				}
			}
		},
		// Configure simple, non-verified email/password to get started
		emailAndPassword: {
			enabled: true,
			requireEmailVerification: false,
			// Send password reset emails via Resend
			sendResetPassword: async ({ user, url }) => {
				await sendEmail({
					to: user.email,
					subject: 'Reset your password',
					html: actionEmailHtml({
						greeting: `Hello ${escapeHtml(user.name ?? 'there')},`,
						bodyLines: [
							'We received a request to reset your password. Click the button below to set a new password:'
						],
						ctaLabel: 'Reset Password',
						ctaUrl: url,
						footerLine: "If you didn't request this, you can safely ignore this email."
					})
				});
			}
		},
		socialProviders: {
			...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
				? {
						google: {
							clientId: process.env.GOOGLE_CLIENT_ID,
							clientSecret: process.env.GOOGLE_CLIENT_SECRET
						}
					}
				: {})
		},
		databaseHooks: {
			user: {
				create: {
					// Sign-up gate: when the SIGNUPS_DISABLED env var is set on the
					// Convex deployment, public account creation is blocked and the
					// sign-up page shows the waitlist instead (see `waitlist.ts`).
					// Every sign-up path (email/password and OAuth) funnels through
					// user creation, so this is the single enforcement point. Two
					// exemptions keep "closed" meaning closed to the *public*:
					// admins provisioning accounts, and addresses holding a pending
					// organization invitation — so inviting someone (e.g. to let
					// them off the waitlist) still works while signups are closed.
					before: async (user, hookCtx) => {
						if (process.env.SIGNUPS_DISABLED !== 'true') return;
						if (hookCtx?.path === '/admin/create-user') return;
						const invitation = (await findOne(ctx, {
							model: 'invitation',
							where: [
								// Exact-match lookup: invitation emails are lowercased on
								// creation (see `beforeCreateInvitation` below) because the
								// Convex adapter only supports case-sensitive equality.
								{ field: 'email', value: user.email.trim().toLowerCase() },
								{ field: 'status', value: 'pending' }
							]
						})) as { expiresAt: number } | null;
						if (invitation && invitation.expiresAt > Date.now()) return;
						throw new APIError('FORBIDDEN', {
							message:
								'Signups are currently closed. Join the waitlist to get notified when a spot opens.'
						});
					},
					after: async (user, hookCtx) => {
						try {
							const organization = await createDefaultOrganization(ctx, user);
							// `create.after` hooks run after the sign-up transaction, so the
							// first session already exists by now — backfill its active
							// organization (the `session.create.before` hook below covers
							// all subsequent sign-ins).
							if (organization && hookCtx) {
								await hookCtx.context.adapter.updateMany({
									model: 'session',
									where: [{ field: 'userId', value: user.id }],
									update: { activeOrganizationId: organization.id }
								});
							}
						} catch (e) {
							// Don't fail sign-up if organization creation fails; the user
							// can still create an organization manually.
							console.error('Failed to create default organization:', e);
						}
					}
				}
			},
			session: {
				create: {
					// Sessions always start with an active organization so that
					// org-scoped queries and billing have an unambiguous context.
					before: async (session, hookCtx) => {
						if (session.activeOrganizationId || !hookCtx) return;
						const membership = await hookCtx.context.adapter.findOne<{
							organizationId: string;
						}>({
							model: 'member',
							where: [{ field: 'userId', value: session.userId }]
						});
						if (!membership) return;
						return {
							data: { ...session, activeOrganizationId: membership.organizationId }
						};
					}
				}
			}
		},
		plugins: [
			// The Convex plugin is required for Convex compatibility
			convex({ authConfig }),
			// Admin plugin for roles/impersonation/banning APIs
			admin(),
			// Organizations with invitations; billing is scoped to the active organization
			organization({
				invitationExpiresIn: 60 * 60 * 24 * 7, // 7 days
				// The template ships with email verification disabled; if you enable
				// `requireEmailVerification` above, flip this to true as well so only
				// verified addresses can view and accept invitations.
				requireEmailVerificationOnInvitation: false,
				// Ownership is immutable: every organization has exactly one owner,
				// forever — its creator. Combined with the deletion guard below
				// (you can't delete the only organization you own) and Better
				// Auth's sole-owner-can't-leave rule, this guarantees every user
				// always keeps an organization as their billing/data scope.
				// Relax `beforeUpdateMemberRole` if a project needs ownership
				// transfer.
				//
				// Better Auth accepts `string | string[]` roles and stores arrays
				// as comma-separated strings, so all checks normalize roles and
				// granted roles are restricted to a single canonical value —
				// `"owner,member"`-style values would otherwise smuggle owner
				// permissions past equality checks.
				organizationHooks: {
					afterCreateOrganization: async ({ organization, user }) => {
						await createAutumnCustomerForOrganization({ organization, user });
					},
					beforeAddMember: async ({ member, organization }) => {
						const roles = normalizeOrganizationRoles(member.role);
						if (!roles.includes('owner')) {
							requireAssignableRole(roles);
							return;
						}
						// The only owner-role member is the creator, added while the
						// organization is still empty at creation time.
						const existingMember = await findOne(ctx, {
							model: 'member',
							where: [{ field: 'organizationId', value: organization.id }]
						});
						if (existingMember || roles.length > 1) {
							throw new APIError('BAD_REQUEST', {
								message: 'Organizations have a single owner'
							});
						}
					},
					beforeCreateInvitation: async ({ invitation }) => {
						// Invitation acceptance bypasses beforeAddMember, so validate
						// the role at the source.
						requireAssignableRole(normalizeOrganizationRoles(invitation.role));
						// Store the invitee address lowercased: the Convex adapter only
						// supports case-sensitive equality, and the sign-up gate above
						// looks pending invitations up by normalized email. (Better Auth
						// itself compares case-insensitively on acceptance, so this
						// changes nothing else.)
						return { data: { email: invitation.email.trim().toLowerCase() } };
					},
					beforeUpdateMemberRole: async ({ member, newRole }) => {
						if (normalizeOrganizationRoles(member.role).includes('owner')) {
							throw new APIError('BAD_REQUEST', {
								message: "The organization owner can't be changed"
							});
						}
						requireAssignableRole(normalizeOrganizationRoles(newRole));
					},
					beforeRemoveMember: async ({ member }) => {
						if (normalizeOrganizationRoles(member.role).includes('owner')) {
							throw new APIError('BAD_REQUEST', {
								message: "The organization owner can't be removed"
							});
						}
					},
					beforeDeleteOrganization: async ({ organization, user }) => {
						// Deleting your only organization would leave you without a
						// billing/data scope. Ownership can't be transferred, so the
						// set of organizations a user owns only changes here.
						if ((await countOwnedOrganizations(ctx, user.id)) <= 1) {
							// Better Auth clears the session's activeOrganizationId
							// before this hook runs — restore it so a rejected
							// deletion doesn't leave the session without an active org.
							await updateMany(ctx, {
								model: 'session',
								where: [
									{ field: 'userId', value: user.id },
									{ field: 'activeOrganizationId', value: null }
								],
								update: { activeOrganizationId: organization.id }
							});
							throw new APIError('BAD_REQUEST', {
								message: "You can't delete the only organization you own"
							});
						}
						// Clean up billing before the organization disappears. Failing
						// here aborts the deletion rather than orphaning a paid
						// subscription. Autumn's delete does NOT touch Stripe on its
						// own; `deleteInStripe` deletes the Stripe customer, which
						// immediately cancels any active subscriptions.
						const autumn = getAutumn();
						if (!autumn) return;
						try {
							await autumn.customers.delete({
								customerId: organization.id,
								deleteInStripe: true
							});
						} catch (error) {
							if (isCustomerNotFound(error)) return;
							console.error('Failed to delete Autumn customer:', error);
							throw new APIError('INTERNAL_SERVER_ERROR', {
								message: "Failed to cancel the organization's subscription"
							});
						}
					}
				},
				sendInvitationEmail: async (data) => {
					await sendEmail({
						to: data.email,
						subject: `Join ${data.organization.name} on ${siteConfig.name}`,
						html: actionEmailHtml({
							greeting: 'Hello,',
							bodyLines: [
								`<strong>${escapeHtml(data.inviter.user.name || data.inviter.user.email)}</strong> has invited you to join <strong>${escapeHtml(data.organization.name)}</strong>.`,
								'This invitation expires in 7 days.'
							],
							ctaLabel: 'Accept Invitation',
							ctaUrl: `${siteUrl}/accept-invitation/${data.id}`,
							footerLine:
								"If you weren't expecting this invitation, you can safely ignore this email."
						})
					});
				}
			})
		]
	}) satisfies BetterAuthOptions;

export const createAuth = (ctx: GenericCtx<DataModel>, { optionsOnly } = { optionsOnly: false }) =>
	betterAuth({
		// disable logging when createAuth is called just to generate options.
		// this is not required, but there's a lot of noise in logs without it.
		logger: { disabled: optionsOnly },
		...createOptions(ctx)
	});

// Example function for getting the current user
// Feel free to edit, omit, etc.
export const getCurrentUser = query({
	args: {},
	handler: async (ctx) => {
		try {
			return await authComponent.getAuthUser(ctx);
		} catch {
			// Return null when unauthenticated
			return null;
		}
	}
});
