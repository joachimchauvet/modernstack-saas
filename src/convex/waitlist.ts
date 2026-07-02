import { ConvexError, v } from 'convex/values';
import { paginationOptsValidator } from 'convex/server';
import { internalAction, mutation, query } from './_generated/server';
import { components, internal } from './_generated/api';
import { RateLimiter, HOUR, MINUTE } from '@convex-dev/rate-limiter';
import { actionEmailHtml, escapeHtml, sendEmail } from './email';
import { siteConfig } from '../lib/config';
import { requireAdmin } from './admin';

/**
 * Public waitlist, shown on the sign-up page while signups are closed.
 *
 * Closing signups is controlled by the `SIGNUPS_DISABLED` env var on the
 * Convex deployment (`npx convex env set SIGNUPS_DISABLED true`) — an env
 * var rather than app config so each environment (prod / preview / dev) can
 * differ, and rather than a database flag so there's no settings table or
 * seeding involved. Flipping it takes effect immediately: enforcement reads
 * `process.env` per request (here and in the sign-up gate in `auth.ts`),
 * and the frontend follows via the `status` query below.
 *
 * Double opt-in: when Resend is configured, entries start unconfirmed
 * (`confirmedAt` unset) and a confirmation email must be clicked; without
 * Resend, entries are confirmed on creation. See the schema for details.
 * Unconfirmed entries are kept indefinitely — they're still leads.
 *
 * Anti-enumeration: `join` returns null on every outcome (new, unconfirmed,
 * already confirmed), so the form cannot be used to test whether an address
 * is on the list. Only the mailbox owner sees a difference.
 */

const signupsDisabled = () => process.env.SIGNUPS_DISABLED === 'true';

// Mirrors the requirements of `sendEmail` in `email.ts`, which throws when
// these are missing — the waitlist degrades to single opt-in instead.
const confirmationEmailsEnabled = () =>
	Boolean(process.env.RESEND_API_KEY && (process.env.EMAIL_FROM || process.env.RESET_EMAIL_FROM));

// Deliberately permissive: real validation is the confirmation email.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const rateLimiter = new RateLimiter(components.rateLimiter, {
	// The join form is public and unauthenticated. Per-IP is the primary
	// limit (the mutation is called browser → Convex directly, so the IP
	// from request metadata is the end user's); the sharded global limit is
	// a backstop against distributed abuse.
	waitlistJoinPerIp: { kind: 'token bucket', rate: 10, period: HOUR, capacity: 5 },
	waitlistJoinGlobal: { kind: 'token bucket', rate: 300, period: HOUR, shards: 5 },
	// Per-address cap on confirmation emails so the form can't be used to
	// bomb an inbox by re-submitting someone else's email.
	waitlistConfirmationEmail: { kind: 'fixed window', rate: 1, period: 15 * MINUTE },
	// Tokens are UUIDs, so guessing is hopeless anyway — this just keeps
	// brute-force traffic cheap to reject.
	waitlistConfirmPerIp: { kind: 'token bucket', rate: 20, period: MINUTE }
});

/**
 * Public flags the auth pages need: whether to show the sign-up form or the
 * waitlist, and which success copy the waitlist form should use ("check your
 * inbox" vs "you're on the list").
 */
export const status = query({
	args: {},
	returns: v.object({ signupsEnabled: v.boolean(), doubleOptIn: v.boolean() }),
	handler: async () => ({
		signupsEnabled: !signupsDisabled(),
		doubleOptIn: confirmationEmailsEnabled()
	})
});

/**
 * Join the waitlist. Always returns null — see the anti-enumeration note in
 * the file header. Differences between outcomes surface only in the mailbox:
 * new and still-pending addresses get a confirmation email (rate-limited per
 * address), already-confirmed addresses get nothing.
 */
export const join = mutation({
	args: { name: v.string(), email: v.string() },
	returns: v.null(),
	handler: async (ctx, args) => {
		if (!signupsDisabled()) {
			throw new ConvexError('Signups are open — you can create an account right away.');
		}
		const name = args.name.trim();
		const email = args.email.trim().toLowerCase();
		if (!name || name.length > 200) {
			throw new ConvexError('Please enter your name.');
		}
		if (email.length > 320 || !EMAIL_REGEX.test(email)) {
			throw new ConvexError('Please enter a valid email address.');
		}

		// `ip` is null when the call didn't come over HTTP (tests, CLI); those
		// share one bucket rather than bypassing the limit.
		const { ip } = await ctx.meta.getRequestMetadata();
		await rateLimiter.limit(ctx, 'waitlistJoinPerIp', { key: ip ?? 'unknown', throws: true });
		await rateLimiter.limit(ctx, 'waitlistJoinGlobal', { throws: true });

		const existing = await ctx.db
			.query('waitlist')
			.withIndex('by_email', (q) => q.eq('email', email))
			.unique();

		if (existing?.confirmedAt) return null;

		if (!confirmationEmailsEnabled()) {
			// Single opt-in: no email provider, so confirm directly. Also
			// covers entries left pending after Resend was unconfigured.
			if (existing) {
				await ctx.db.patch(existing._id, { confirmedAt: Date.now() });
			} else {
				await ctx.db.insert('waitlist', { name, email, confirmedAt: Date.now() });
			}
			return null;
		}

		// Keep the existing token on re-joins so the link in an earlier,
		// possibly delayed confirmation email stays valid.
		const token = existing?.confirmationToken ?? crypto.randomUUID();
		if (!existing) {
			await ctx.db.insert('waitlist', { name, email, confirmationToken: token });
		} else if (!existing.confirmationToken) {
			await ctx.db.patch(existing._id, { confirmationToken: token });
		}

		// Silently skip (never throw) when the per-address email limit is hit:
		// a "slow down" error here would reveal that the address is already
		// pending, which is exactly what `join` must not leak.
		const emailLimit = await rateLimiter.limit(ctx, 'waitlistConfirmationEmail', { key: email });
		if (emailLimit.ok) {
			await ctx.scheduler.runAfter(0, internal.waitlist.sendConfirmationEmail, {
				name: existing?.name ?? name,
				email,
				token
			});
		}
		return null;
	}
});

export const sendConfirmationEmail = internalAction({
	args: { name: v.string(), email: v.string(), token: v.string() },
	returns: v.null(),
	handler: async (_ctx, args) => {
		const confirmUrl = `${process.env.SITE_URL}/waitlist/confirm?token=${args.token}`;
		await sendEmail({
			to: args.email,
			subject: `Confirm your spot on the ${siteConfig.name} waitlist`,
			html: actionEmailHtml({
				greeting: `Hello ${escapeHtml(args.name)},`,
				bodyLines: [
					`Thanks for your interest in <strong>${escapeHtml(siteConfig.name)}</strong>!`,
					'Click the button below to confirm your email address and secure your spot on the waitlist:'
				],
				ctaLabel: 'Confirm My Spot',
				ctaUrl: confirmUrl,
				footerLine: "If you didn't sign up for this waitlist, you can safely ignore this email."
			})
		});
		return null;
	}
});

/**
 * Confirm a waitlist entry from the emailed link. Idempotent — the token is
 * kept after confirmation so re-clicking the link says "you're confirmed"
 * instead of "invalid link".
 */
export const confirm = mutation({
	args: { token: v.string() },
	returns: v.boolean(),
	handler: async (ctx, args) => {
		const { ip } = await ctx.meta.getRequestMetadata();
		await rateLimiter.limit(ctx, 'waitlistConfirmPerIp', { key: ip ?? 'unknown', throws: true });
		if (!args.token) return false;
		const entry = await ctx.db
			.query('waitlist')
			.withIndex('by_confirmationToken', (q) => q.eq('confirmationToken', args.token))
			.unique();
		if (!entry) return false;
		if (!entry.confirmedAt) {
			await ctx.db.patch(entry._id, { confirmedAt: Date.now() });
		}
		return true;
	}
});

const waitlistEntryValidator = v.object({
	_id: v.id('waitlist'),
	_creationTime: v.number(),
	name: v.string(),
	email: v.string(),
	confirmedAt: v.optional(v.number())
});

/**
 * Admin-only: browse waitlist entries, optionally filtered by confirmation
 * state. `confirmed` maps to the `by_confirmedAt` index — `false` selects
 * entries with the field unset (pending), `true` selects any real timestamp
 * (`confirmedAt` is always `Date.now()`, so `gte(0)` excludes the unset ones,
 * which sort before all numbers).
 */
export const list = query({
	args: {
		paginationOpts: paginationOptsValidator,
		confirmed: v.optional(v.boolean())
	},
	returns: v.object({
		page: v.array(waitlistEntryValidator),
		isDone: v.boolean(),
		continueCursor: v.string()
	}),
	handler: async (ctx, args) => {
		await requireAdmin(ctx);
		const query =
			args.confirmed === undefined
				? ctx.db.query('waitlist')
				: ctx.db
						.query('waitlist')
						.withIndex('by_confirmedAt', (q) =>
							args.confirmed ? q.gte('confirmedAt', 0) : q.eq('confirmedAt', undefined)
						);
		const result = await query.order('desc').paginate(args.paginationOpts);
		return {
			page: result.page.map((entry) => ({
				_id: entry._id,
				_creationTime: entry._creationTime,
				name: entry.name,
				email: entry.email,
				confirmedAt: entry.confirmedAt
			})),
			isDone: result.isDone,
			continueCursor: result.continueCursor
		};
	}
});

/** Admin-only: remove an entry (e.g. after inviting the person). */
export const remove = mutation({
	args: { id: v.id('waitlist') },
	returns: v.null(),
	handler: async (ctx, args) => {
		await requireAdmin(ctx);
		await ctx.db.delete(args.id);
		return null;
	}
});
