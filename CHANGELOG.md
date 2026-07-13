# Changelog

## 2026-07-13 — Inset sidebar layout

The app shell now uses the sidebar's `inset` variant (as in shadcn's dashboard-01 block): the main content renders as a rounded, elevated card on the sidebar background.
Icon collapse is unchanged, with the collapsed rail spacing evened out, and page headers use the shared `--header-height` variable.

## 2026-07-02 — Disable signups & waitlist

Optionally close public signups (`SIGNUPS_DISABLED=true` on the Convex deployment)
and collect a waitlist instead. The sign-up page swaps to a name/email form, with
enforcement in a Better Auth hook so it covers OAuth too; invitations and
admin-created accounts still work while closed. Double opt-in when Resend is
configured, enumeration-safe joins, per-IP/per-address rate limiting, and an
`/admin/waitlist` page.

## 2026-06-26 — Back to the official convex-svelte

Replaced the community `convex-svelte` fork with the official package, now that
`@mmailaender/convex-better-auth-svelte` (`^0.8.0`) supports it. `better-auth` is
pinned to exactly `1.6.17` — `>=1.6.18` breaks the integration's client types and
fails `pnpm check` (type-only); unpin once a compatible release ships.

## 2026-06-23 — Per-PR Convex preview deployments

Every pull request now gets its own isolated full-stack preview — a fresh Convex
preview deployment plus a matching Cloudflare Pages preview
(`.github/workflows/convex-preview.yml`), with both URLs commented on the PR.

- **Optional data cloning** (off by default): import a snapshot from a source
  deployment, then `preview:postImportCleanup` clears ephemeral Better Auth state
  (sessions, verifications, invitations, jwks).
- **Project-agnostic**: which Convex project a preview uses is decided entirely by
  the deploy keys in the `preview` GitHub Environment.
- **Branch deploys**: `cloudflare-pages.yml` now runs `convex deploy` before the
  build; the unused Cloudflare Workers workflow was removed.

Previews auto-delete after 5 days (Free/Starter) or 14 days (Pro+).

## 2026-06-12 — Organizations, org-scoped billing & admin impersonation

Added multi-tenancy via the Better Auth organization plugin, with billing scoped
to the active organization instead of the user.

- **Organizations**: every user gets a default organization on sign-up (so B2C
  works unchanged), plus org switcher, settings page (rename, members, roles),
  email invitations, and an accept-invitation flow. Ownership is immutable —
  each org keeps its creator as sole owner — and you can't delete the only
  organization you own (both enforced server-side).
- **Org-scoped billing**: Autumn is keyed on the active organization; subscription
  changes are restricted to owners/admins, with members getting a read-only view.
  Deleting an organization cancels its subscription.
- **Admin**: new `/admin/organizations` page (list, search, detail with members +
  billing) and user impersonation from `/admin/users`.
- **Autumn v2**: dropped the `@useautumn/convex` component (pinned to the
  deprecated v1 API) and call the `autumn-js` 1.x SDK directly from Convex
  actions — `checkout` is now `attach`, products are now plans.

## 2026-06-10 — Vite 8 (Rolldown-powered)

Upgraded to [Vite 8](https://vite.dev/blog/announcing-vite8) (`^7` → `^8`), which
ships [Rolldown](https://vite.dev/guide/rolldown) as its built-in default bundler —
so Rolldown is used out of the box with no alias. (The separate `rolldown-vite`
preview package, used in v6/v7, was merged into Vite core in v8 and is not needed.)

This pulled the SvelteKit toolchain up to Vite-8-compatible versions:
`@sveltejs/vite-plugin-svelte`, `svelte`, `@sveltejs/kit`, and `@tailwindcss/vite` /
`tailwindcss`.

## 2026-06-10 — Better Auth / Convex dependency upgrade

Upgraded the auth/data stack:

- `@convex-dev/better-auth` `^0.9` → `^0.12`
- `better-auth` `1.3.x` → `~1.6.15`
- `convex` → `^1.40`
- Svelte Convex bindings moved from `convex-svelte` to `@mmailaender/convex-svelte`
  - `@mmailaender/convex-better-auth-svelte` (the integration the official
    Convex + Better Auth + SvelteKit guide now prescribes).

### ⚠️ One-time migration for EXISTING deployments (JWKS key rotation)

**Fresh clones are not affected** — a brand-new deployment generates its signing
keys with the current algorithm from the start. This only affects deployments
that were already running an older version of this template.

Across this upgrade, Better Auth switched the algorithm it uses to sign Convex
JWTs from **EdDSA to RS256**. The signing keys already stored in your Better
Auth database (the `jwks` table inside the `betterAuth` component) were generated
with the old algorithm, so the token endpoint cannot use them.

**Symptom:** users still appear signed in (the Better Auth session cookie is
valid), but every Convex query that needs an authenticated user returns `null` —
profile name/email are blank, dashboards are empty, and role-gated UI (e.g. the
admin menu) does not render. The Convex logs show:

```
H(GET /api/auth/convex/token) [ERROR] JOSENotSupported:
  Invalid or unsupported JWK "alg" (Algorithm) Parameter value (ERR_JOSE_NOT_SUPPORTED)
```

You must rotate the JWKS **once per deployment** (do it for `dev` and `prod`
separately — they have separate databases). Pick one option:

#### Option A — No code change (recommended)

1. Open the Convex dashboard for the deployment.
2. Go to **Data**, select the **`betterAuth`** component, open the **`jwks`** table.
3. Delete all rows in that table.
4. Load the app and sign in. The next token request regenerates a fresh RS256
   keypair automatically.

#### Option B — Temporary flag

1. In `src/convex/auth.ts`, set the flag on the Convex plugin:
   ```ts
   convex({ authConfig, jwksRotateOnTokenGenerationError: true }),
   ```
2. Deploy, then load the app once (the first token request deletes the old keys
   and regenerates RS256).
3. **Remove the flag** and redeploy. Do not leave it on permanently — it is a
   migration aid, not steady-state config (on any future token-signing error it
   would silently wipe and regenerate all signing keys instead of surfacing the
   problem).

**Notes**

- Rotation invalidates currently-issued Convex JWTs; clients re-fetch a valid one
  within seconds. Better Auth **sessions are not affected** — users stay signed in.
- Prefer a low-traffic window.
- There is no HTTP endpoint to trigger rotation (`rotateKeys` is `SERVER_ONLY`);
  both options above ultimately just clear the `jwks` table and let Better Auth
  regenerate keys on the configured algorithm.
