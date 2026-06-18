# Convex + Cloudflare Pages Deployment Plan

> **Revision note.** This revision makes the design **key-driven rather than project-aware**:
> the workflows never know which Convex project anything lives in — they consume deploy keys
> injected per GitHub Environment. It also drops the `--deployment "$SOURCE"` /
> cross-project ref syntax, corrects the Better Auth URL var to `SITE_URL` (verified against
> `src/convex/auth.ts`), and adds caveats for schema drift, OAuth on previews, and teardown.

## Goals

- Deploy Convex and Cloudflare Pages together so frontend builds always point at the matching backend.
- Keep pull request previews isolated from shared development data by default.
- Support optional preview data cloning from a chosen Convex source deployment.
- Make production deploys deliberate and auditable.
- Remove unused Cloudflare Workers workflow surface from the starter.
- Stay project-agnostic: the same workflows work for any repo/fork by configuring environment secrets, not by editing YAML.

## Recommended Branch Model

| Branch/event                    | Convex target                         | Cloudflare Pages target  | Deployment gate             |
| ------------------------------- | ------------------------------------- | ------------------------ | --------------------------- |
| Pull request to `dev` or `main` | Convex preview deployment             | Pages preview deployment | Automatic                   |
| Push/merge to `dev`             | Shared development/staging deployment | Pages `dev` branch       | Automatic                   |
| Push/merge to `main`            | Production deployment                 | Pages production branch  | GitHub environment approval |

For production, use GitHub Environments with required reviewers. Merging to `main` should create the deployment run, but production secrets should only become available after approval.

## Key-Driven, Project-Agnostic Design

The workflows do not encode which Convex project (production, staging, etc.) is involved. Each Convex CLI step targets whatever deployment its **deploy key** belongs to, and those keys come from GitHub Environment secrets. A given repo or fork wires its own projects by setting secrets; the YAML never changes.

There are exactly two key **roles** in the preview flow:

| Role        | Secret                      | Purpose                                                                                 | Notes                                                                                                                                                  |
| ----------- | --------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Preview key | `CONVEX_PREVIEW_DEPLOY_KEY` | Create the preview deployment, import data into it, set its env, run cleanup.           | A preview-scoped key. Manages many per-branch previews, so commands that act on a preview need a selector (see below).                                 |
| Source key  | `CONVEX_SOURCE_DEPLOY_KEY`  | Export the snapshot to copy into the preview. Only needed when data cloning is enabled. | Must be a **non-preview** key (prod or staging). A preview key cannot read a source deployment's data, and does not map to a single stable deployment. |

Consequences of this model:

- **No `--deployment`/cross-project ref syntax is needed.** A deploy key selects its own deployment, so `convex export` with `CONVEX_DEPLOY_KEY=$CONVEX_SOURCE_DEPLOY_KEY` exports exactly that deployment — no `--deployment` flag, no `team:project:ref` strings. The preview and the source may be in the same project or different projects; the workflow does not care.
- **The source is a per-repo choice, not a template decision.** Whoever configures the `preview` environment decides whether `CONVEX_SOURCE_DEPLOY_KEY` points at staging (safe, default-friendly) or production (realistic, but copies real user PII and dangling billing customer IDs). The template stays neutral and documents the trade-off; it does not hardcode it.
- **Two distinct keys are required for cloning**; you cannot collapse to one. Both are just environment secrets.

### Open verification item (do before writing the workflow)

The exact flag for targeting a specific preview on **`convex import` / `convex run` / `convex env`** must be pinned against the installed CLI (currently `convex ^1.41.0`). `convex import --help` on this version lists `--deployment` and `--prod` but **not** `--preview-name`, while older references (and Convex docs) use `--preview-name`. Confirm empirically by creating one throwaway preview and checking which selector the installed CLI accepts:

- Candidate A: `--preview-name "$SLUG"`
- Candidate B: `--deployment "<preview-ref>"` (resolve the exact ref form the CLI prints)

`convex export` needs **no** selector (the source key picks the deployment), so this item only affects import/run/env.

## Workflows

### 1. Delete Unused Workers Workflow

Remove `.github/workflows/deploy-workers.yml` from the starter. Cloudflare Pages is the only supported target; the Workers workflow is currently non-functional.

Why:

- It avoids stale deployment guidance.
- It reduces secret and environment variable confusion.
- It keeps the starter's deployment path focused.

### 2. Main Pages Deploy Workflow

Update `.github/workflows/cloudflare-pages.yml` to handle only branch deployments:

- Trigger on pushes to `dev` and `main`.
- Select GitHub environment:
  - `development` for `dev`
  - `production` for `main`
- Install dependencies with `pnpm install --frozen-lockfile`.
- Deploy Convex first with `pnpm convex deploy`.
- Build SvelteKit with the environment's Convex URLs (from environment **variables**).
- Deploy Cloudflare Pages.

The key order is:

```sh
pnpm install --frozen-lockfile
CONVEX_DEPLOY_KEY=$CONVEX_DEPLOY_KEY pnpm convex deploy
pnpm run build
wrangler pages deploy ./.svelte-kit/cloudflare --project-name "$CLOUDFLARE_PROJECT_NAME" --branch "$GITHUB_REF_NAME"
```

Why Convex deploys before the build: for branch deployments `PUBLIC_CONVEX_URL` / `PUBLIC_CONVEX_SITE_URL` are **fixed environment variables** (the deployment URL doesn't change per run), so the build reads them from GitHub vars — not from the deploy output. The reason to deploy the backend first is **ordering safety**: push schema/index/function changes before the frontend that depends on them goes live, so the site never points at an un-migrated backend. (URL-from-output only applies to previews, where the URL is created on the fly.)

### 3. Pull Request Preview Workflow

Add a separate `.github/workflows/convex-preview.yml` for PRs, using the `preview` GitHub Environment.

Recommended flow:

1. Compute a Convex-safe preview slug from the PR branch (lowercase; non-alphanumerics → `-`; collapse/trim dashes; fall back to `pr-<number>` if empty).
2. Create or update the preview deployment with the preview key:
   ```sh
   CONVEX_DEPLOY_KEY=$CONVEX_PREVIEW_DEPLOY_KEY \
     pnpm convex deploy --preview-create "$SLUG"
   ```
   This pushes the **PR branch's** schema/functions to a fresh isolated deployment.
3. Capture from the deploy output:
   - `PUBLIC_CONVEX_URL`, ending in `.convex.cloud`
   - `PUBLIC_CONVEX_SITE_URL`, derived by swapping the suffix to `.convex.site`
4. (Optional, gated on `CONVEX_PREVIEW_COPY_DATA=true`) Export from the source deployment — no selector flag, the key picks the deployment:
   ```sh
   CONVEX_DEPLOY_KEY=$CONVEX_SOURCE_DEPLOY_KEY \
     pnpm convex export --path ./snapshot \
     ${CONVEX_PREVIEW_INCLUDE_FILE_STORAGE:+--include-file-storage}
   ```
5. (Optional) Import the snapshot into the preview with `--replace-all`, **tolerating failure** (see Schema Drift):
   ```sh
   CONVEX_DEPLOY_KEY=$CONVEX_PREVIEW_DEPLOY_KEY \
     pnpm convex import <PREVIEW_SELECTOR> --replace-all -y ./snapshot/*.zip \
     || echo "::warning::Import failed (likely schema drift); leaving preview empty"
   ```
   `<PREVIEW_SELECTOR>` is the verified flag from the Open Verification Item.
6. Run the guarded post-import cleanup function (only meaningful when data was copied):
   ```sh
   CONVEX_DEPLOY_KEY=$CONVEX_PREVIEW_DEPLOY_KEY \
     pnpm convex run <PREVIEW_SELECTOR> preview:postImportCleanup
   ```
7. (Optional, when copy is off) Run a small synthetic seed so the preview isn't empty (see "Empty vs Seeded Previews").
8. Build Cloudflare Pages with the preview Convex URLs.
9. Deploy the Pages preview.
10. Patch the preview's Convex runtime env with the actual Cloudflare Pages alias URL (handles branch-name truncation — see Better Auth section).
11. Comment on the PR with the Convex and Pages preview URLs.
12. On `pull_request: closed`, delete the preview deployment (teardown — see below).

Data cloning is **optional and off by default** so the starter is safe for public reuse. Teams that want realistic preview data opt in by setting `CONVEX_PREVIEW_COPY_DATA=true` and providing `CONVEX_SOURCE_DEPLOY_KEY`.

## Environment Variables and Secrets

### GitHub Environment: development

Secrets:

- `CONVEX_DEPLOY_KEY`: deploy key for the shared development/staging Convex deployment
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Variables:

- `PUBLIC_CONVEX_URL`
- `PUBLIC_CONVEX_SITE_URL`
- `SITE_URL`
- `CLOUDFLARE_PROJECT_NAME`

### GitHub Environment: production

Secrets:

- `CONVEX_DEPLOY_KEY`: deploy key for the production Convex deployment
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Variables:

- `PUBLIC_CONVEX_URL`
- `PUBLIC_CONVEX_SITE_URL`
- `SITE_URL`
- `CLOUDFLARE_PROJECT_NAME`

Enable required reviewers on this environment.

### GitHub Environment: preview

Secrets:

- `CONVEX_PREVIEW_DEPLOY_KEY`: preview deploy key (creates/imports/runs against previews)
- `CONVEX_SOURCE_DEPLOY_KEY`: **optional**, only when `CONVEX_PREVIEW_COPY_DATA=true`. A non-preview key for the deployment to export from. May belong to the same project as the preview key or a different one.
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Variables:

- `CLOUDFLARE_PROJECT_NAME`
- `CONVEX_PREVIEW_COPY_DATA` (default `false`)
- `CONVEX_PREVIEW_INCLUDE_FILE_STORAGE` (default `false`)
- Optional: `BETTER_AUTH_TRUSTED_ORIGINS_EXTRA`

Notes:

- **Do not set live billing secrets (`AUTUMN_SECRET_KEY`) in previews by default.** This is safe: `afterCreateOrganization` tolerates a missing Autumn client (`src/convex/auth.ts` — `getAutumn()` returns `null`, the hook returns early and never throws), and billing reads degrade to "Billing is not configured." If you want working billing in previews, point this at an Autumn **sandbox** key, never production.
- Set preview-only Convex runtime secrets that are the **same for every preview** (e.g. `BETTER_AUTH_SECRET`, the cleanup guard `CONVEX_DEPLOYMENT_KIND=preview`) via Convex's **default environment variables for preview deployments** (dashboard), not GitHub secrets. Per-preview values that change (e.g. `SITE_URL`) are set per run via `convex env set`.
- The `CONVEX_PREVIEW_SOURCE_DEPLOYMENT` variable from the previous revision is **removed** — the source key replaces it.

## Better Auth and URL Mapping

`src/convex/auth.ts` reads `const siteUrl = process.env.SITE_URL!` and uses it as Better Auth's `baseURL`, and builds invitation links as `${siteUrl}/accept-invitation/...`. So **`SITE_URL` is the load-bearing var** — it must be set on every Convex deployment to the public app origin, or auth and email links break. `BETTER_AUTH_URL` is compatibility-only here.

| Purpose                   | Env var                                     | Example                             |
| ------------------------- | ------------------------------------------- | ----------------------------------- |
| Convex client URL         | `PUBLIC_CONVEX_URL`                         | `https://abc.convex.cloud`          |
| Convex HTTP/auth site URL | `PUBLIC_CONVEX_SITE_URL`, `CONVEX_SITE_URL` | `https://abc.convex.site`           |
| Public app origin         | `SITE_URL` (and optional `BETTER_AUTH_URL`) | `https://feature.example.pages.dev` |

Preview workflow should:

1. Build Pages with:
   ```sh
   PUBLIC_CONVEX_URL=<preview .convex.cloud>
   PUBLIC_CONVEX_SITE_URL=<preview .convex.site>
   SITE_URL=<best-guess Pages preview origin>
   ```
2. Set Convex preview env before build/deploy:
   ```sh
   CONVEX_SITE_URL=<preview .convex.site>
   SITE_URL=<best-guess Pages preview origin>
   ```
3. After Cloudflare returns `pages-deployment-alias-url`, patch the preview env again with the **actual** alias:
   ```sh
   SITE_URL=<actual Pages alias origin>
   ```

The two-phase patch is deliberate: Cloudflare truncates branch names longer than 28 characters in the alias, so the alias can't be reliably computed up front. Patching after deploy is the robust path and ensures Better Auth redirects, cookies, email links, and callback URLs use the real preview origin.

### OAuth on previews (known limitation)

`src/convex/auth.ts` wires Google OAuth (`auth.ts:154`). Ephemeral preview origins are **not** registered redirect URIs in the Google app, so Google sign-in will fail on previews with `redirect_uri_mismatch`. **Email/password auth works; OAuth does not** unless specifically configured. Document this, and word the validation checklist accordingly.

### Trusted origins (hardening, not load-bearing)

Better Auth already trusts the `baseURL` origin by default, and we set `SITE_URL` (= `baseURL`) to the preview alias, so the primary origin is trusted automatically. `BETTER_AUTH_TRUSTED_ORIGINS` is only needed for **additional** origins — e.g. Cloudflare's unique per-deploy URL alongside the branch alias, or a `https://*.pages.dev` wildcard. Add support for it in `src/convex/auth.ts` as robustness, but it is not required for the basic flow to work.

## Preview Data Copying

Data copying is useful, but explicit and opt-in.

Recommended defaults:

- Do not copy data by default (`CONVEX_PREVIEW_COPY_DATA=false`).
- When enabled, copy from whatever `CONVEX_SOURCE_DEPLOY_KEY` points at (a per-repo choice). Prefer staging over production.
- If the source is production: document that copied auth/user/org rows contain **real personal data**, and require an anonymization pass in cleanup.
- Never copy live billing provider secrets into previews.

When enabled (note: no `--deployment` flag — the source key selects the deployment):

```sh
# Export from source (key selects the deployment)
CONVEX_DEPLOY_KEY=$CONVEX_SOURCE_DEPLOY_KEY pnpm convex export --path ./snapshot

# Import into the preview (preview key + verified preview selector)
CONVEX_DEPLOY_KEY=$CONVEX_PREVIEW_DEPLOY_KEY \
  pnpm convex import <PREVIEW_SELECTOR> --replace-all -y ./snapshot/*.zip
```

If file storage is needed (the starter stores uploaded avatars in Convex file storage — `src/convex/storage.ts` uses `_storage`, and Better Auth `user.image` can point at those URLs):

```sh
CONVEX_DEPLOY_KEY=$CONVEX_SOURCE_DEPLOY_KEY \
  pnpm convex export --include-file-storage --path ./snapshot
```

Without file-storage export, copied profiles may point at source-deployment assets or missing assets.

### Schema drift (important caveat)

`convex import --replace-all` validates imported data against the **deployed** schema, and the preview deploys the **PR branch's** schema _before_ import. A PR that adds a required field or changes a table can make import of an older snapshot fail — which is exactly when an isolated preview is most valuable. Mitigation:

- Make the import step **non-fatal**: on failure, log a warning and leave the preview empty rather than failing the whole preview job.
- Document that schema-changing PRs may get an empty (or partially populated) preview.

### Empty vs seeded previews

With copy off, every preview starts with **zero users**, so a tester must sign up fresh each time. Optionally provide a tiny synthetic seed function (one organization + one test user) that runs when copy is off, so default-safe previews are still usable without touching any real data. This is the recommended middle ground between "copy real data" and "completely empty."

## Post-Import Cleanup

Add a guarded Convex function, e.g. `src/convex/preview.ts` exporting `postImportCleanup`.

Suggested cleanup targets for this starter (the relevant state is **Better Auth state**, not booking tables):

- Clear `session`
- Clear `verification`
- Clear pending `invitation`
- Regenerate rather than copy `jwks` private key material if it is carried in the snapshot and the preview uses a different `BETTER_AUTH_SECRET` (mismatched secret + copied keys breaks token validation)
- If the source is production: anonymize user PII (emails, names, images) here

Note: do **not** blindly copy Booking's cleanup list — Booking clears booking-specific tables that don't exist here.

Safety requirements:

- The function must refuse to run unless a preview-only env var is present, e.g. `CONVEX_DEPLOYMENT_KIND=preview`, set as a Convex default env var for preview deployments only.
- Never leave a public mutation that can erase data on dev or prod by accident.

## Teardown

On `pull_request: closed`, delete the preview deployment so previews don't accumulate:

- Convex auto-expires idle previews after ~14 days, but explicit teardown is cleaner.
- Add a small job/step keyed on the closed event that removes the preview by its slug (confirm the exact CLI command alongside the Open Verification Item).

## Plan / Cost Note

Convex **preview deployments require a paid plan**, and every open PR consumes a preview deployment in the preview key's project (counting against that project's limits). Note this in `README.md` so template adopters aren't surprised, and so they know preview data copy is an opt-in cost as well.

## Production Approval

Use GitHub Environment protection for `production`.

Recommended settings:

- Required reviewers: enabled.
- Restrict production secrets to the `production` environment.
- Keep `main` as the trigger, but require approval before deploy steps can access secrets.

Why:

- Convex deploys can include schema, index, function, and auth behavior changes.
- Production data and billing integrations are involved.
- Approval provides a deliberate release gate without needing a separate release branch.

Later, once the project has strong tests and operational confidence, production can be made fully automatic.

## Implementation Sequence

1. **Verify the preview-targeting CLI flag** for `import`/`run`/`env`/delete against `convex ^1.41.0` (throwaway preview). This unblocks the workflow syntax.
2. Delete `.github/workflows/deploy-workers.yml`.
3. Update `.github/workflows/cloudflare-pages.yml` for `dev` and `main` branch deployments (Convex deploy before build).
4. Configure GitHub `development`, `preview`, and `production` environments with the key roles above.
5. Add production environment approval (required reviewers).
6. Add the preview workflow **without** data cloning first; verify PR preview auth works against an isolated, empty (or synthetically seeded) Convex preview.
7. Add `BETTER_AUTH_TRUSTED_ORIGINS` support in `src/convex/auth.ts` (hardening).
8. Add optional data cloning (source key + export/import, import non-fatal).
9. Add the guarded `postImportCleanup` (and anonymization if production is ever a source).
10. Add `pull_request: closed` teardown.
11. Document setup, plan/cost, OAuth-on-preview limitation, and schema-drift caveat in `README.md` and `docs/convex.md`.

## Validation Checklist

- PR preview deploy creates a unique Convex preview deployment.
- PR preview Pages build uses the preview Convex `.cloud` and `.site` URLs.
- `/api/auth/*` routes work in the Pages preview.
- Email/password sign up, sign in, sign out, reset-password link generation, and organization switching work in preview. (Google OAuth is expected to fail on previews due to unregistered redirect URIs.)
- With copy off, the preview is empty or carries only synthetic seed data.
- With copy on, data is present and `postImportCleanup` has cleared `session`/`verification`/`invitation` (and anonymized PII if the source was production).
- A schema-changing PR still produces a working (possibly empty) preview rather than a failed job.
- `dev` merge deploys Convex development before Pages development.
- `main` merge waits for production approval.
- Production deploy uses production Convex URLs and the production Convex deploy key.
- No preview workflow uses production billing secrets by default.
- Closing a PR tears down its preview deployment.
- Unused Workers workflow and docs are removed.
