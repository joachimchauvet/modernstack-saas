import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

// Better Auth tables live in the `betterAuth` component and are defined in
// `betterAuth/schema.ts` — this schema only covers the app's own tables.
export default defineSchema({
	// Waitlist signups collected while public signups are closed
	// (see `SIGNUPS_DISABLED` in `waitlist.ts` and the sign-up gate in
	// `auth.ts`). Confirmation state is derived from `confirmedAt`: unset
	// means pending (double opt-in email not yet clicked), set means
	// confirmed. When Resend isn't configured, entries are confirmed on
	// creation (single opt-in). Unconfirmed entries are kept indefinitely —
	// they're still leads.
	waitlist: defineTable({
		name: v.string(),
		// Normalized (trimmed, lowercased) — `by_email` lookups rely on it.
		email: v.string(),
		// Present once confirmed. The confirmation token is kept afterwards so
		// re-clicking the emailed link stays idempotent.
		confirmationToken: v.optional(v.string()),
		confirmedAt: v.optional(v.number())
	})
		.index('by_email', ['email'])
		.index('by_confirmationToken', ['confirmationToken'])
		// Filter pending (confirmedAt unset) vs confirmed in the admin UI.
		.index('by_confirmedAt', ['confirmedAt'])
});
