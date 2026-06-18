import { internalAction } from './_generated/server';
import { components } from './_generated/api';
import { v } from 'convex/values';
import { type FunctionArgs, type FunctionReturnType } from 'convex/server';

/**
 * Post-import cleanup for Convex **preview** deployments.
 *
 * Run after importing a snapshot from a source deployment into a preview
 * deployment (the opt-in data-copy path in `.github/workflows/convex-preview.yml`).
 * It clears Better Auth state that is ephemeral or coupled to the source
 * deployment's domain/secret and must not carry over:
 *
 *   - `session`      — source sessions are meaningless on the preview origin
 *   - `verification` — pending email/password-reset tokens, stale on import
 *   - `invitation`   — pending org invites point at the source app
 *   - `jwks`         — private keys are encrypted with the source's
 *                      BETTER_AUTH_SECRET; a preview using a different secret
 *                      can't use them, so we drop them and let Better Auth
 *                      regenerate a fresh keypair on demand
 *
 * `user` / `account` / `organization` / `member` are intentionally **kept** so
 * copied users can still sign in and see their organizations.
 *
 * Safety: refuses to run unless `CONVEX_DEPLOYMENT_KIND === 'preview'` so it can
 * never wipe auth state on a dev or production deployment. The workflow sets
 * that env var on the preview before invoking this.
 *
 * Invoked from CI as:
 *   pnpm convex run --preview-name "<slug>" preview:postImportCleanup
 */

// Better Auth tables live in the `betterAuth` component, so they're reached
// through the component's adapter (the same one `authAdapter.ts` reads from),
// not `ctx.db`.
const EPHEMERAL_MODELS = ['session', 'verification', 'invitation', 'jwks'] as const;

type DeleteManyInput = FunctionArgs<typeof components.betterAuth.adapter.deleteMany>['input'];
// Annotated explicitly to break the TypeScript circularity that arises from
// feeding the previous result's cursor back into the next call (see docs/convex.md).
type DeleteManyResult = FunctionReturnType<typeof components.betterAuth.adapter.deleteMany>;

export const postImportCleanup = internalAction({
	args: {},
	returns: v.object({ cleared: v.record(v.string(), v.number()) }),
	handler: async (ctx) => {
		if (process.env.CONVEX_DEPLOYMENT_KIND !== 'preview') {
			throw new Error(
				'postImportCleanup refuses to run: CONVEX_DEPLOYMENT_KIND is not "preview". ' +
					'This guard prevents wiping Better Auth state on dev/production deployments.'
			);
		}

		const cleared: Record<string, number> = {};

		for (const model of EPHEMERAL_MODELS) {
			// `deleteMany` is paginated and deletes one page per mutation. Running
			// the loop from an action means each page is its own transaction, so we
			// never hit the per-transaction document limit on large tables.
			const input = { model } as DeleteManyInput;
			let cursor: string | null = null;
			let total = 0;

			for (;;) {
				const result: DeleteManyResult = await ctx.runMutation(
					components.betterAuth.adapter.deleteMany,
					{ input, paginationOpts: { numItems: 500, cursor } }
				);
				total += result.count;
				if (result.isDone) break;
				cursor = result.continueCursor;
			}

			cleared[model] = total;
			console.log(`Cleared ${total} ${model} document(s).`);
		}

		return { cleared };
	}
});
