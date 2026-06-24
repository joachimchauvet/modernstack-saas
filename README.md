# ModernStack SaaS Starter - SvelteKit + Convex + Better Auth

A production-ready SaaS starter template built for the [Modern Stack Hackathon](https://www.convex.dev/hackathons/modernstack), featuring SvelteKit, Convex, Better Auth, Autumn Stripe billing, and more.

## Tech Stack

- **[SvelteKit](https://kit.svelte.dev/)** with **[Svelte 5](https://svelte.dev/)** - Modern, reactive frontend framework
- **[Convex](https://convex.dev/)** - Real-time backend database with serverless functions
- **[Better Auth](https://www.better-auth.com/)** - Comprehensive authentication solution with email/password and OAuth
- **[Autumn](https://useautumn.com/)** - Stripe billing wrapper for seamless payment integration
- **[Resend](https://resend.com/)** - Transactional email service for password resets and email verification
- **[shadcn-svelte](https://www.shadcn-svelte.com/)** - Beautiful, accessible UI components
- **[Tailwind CSS v4](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Lucide](https://lucide.dev/)** - Beautiful icon library

## Features

- ✅ **Authentication System**
  - Email/password authentication
  - Google OAuth support
  - Password reset flow
  - Email change with verification
  - Session management

- ✅ **User Management**
  - User profile settings
  - Avatar upload with Convex storage
  - Account information management

- ✅ **Organizations & Multi-tenancy**
  - Better Auth organization plugin with roles (owner/admin/member)
  - Default organization auto-created per user (B2C works out of the box)
  - Immutable ownership: each organization keeps its creator as sole owner
  - Organization switcher, settings page, member management
  - Email invitations with accept/decline flow
  - Billing scoped to the active organization

- ✅ **UI Components**
  - Dashboard with charts and data tables
  - Sidebar navigation
  - Settings pages (Account, Password, Email)
  - Responsive design
  - Dark/light mode ready

- ✅ **Developer Experience**
  - TypeScript throughout
  - Type-safe database queries
  - Hot module replacement
  - ESLint & Prettier configured
  - LLM-focused documentation in `/docs` + `CLAUDE.md` for AI-assisted development
  - GitHub Actions CI/CD for code quality checks and Cloudflare deployments

## Roadmap

Planned features and improvements:

- [x] **OAuth Support** - Complete social provider integration and example with Google OAuth
- [x] **Multi-tenancy / Team Support** - Organizations, team invites, and role-based permissions
- [ ] **GitHub Action for Cloudflare Workers** - Currently, only Cloudflare Pages deployment is fully functional
- [ ] **Rate Limiting** - API rate limiting and request throttling
- [ ] **Stripe Stats in Admin Dashboard** - Revenue analytics and subscription metrics
- [ ] **Welcome Email Template** - Branded welcome emails for new users
- [ ] **E2E Tests with Playwright** - Comprehensive end-to-end testing suite

## Getting Started

### Starting a new project from this template

After cloning, make it yours:

1. **Branding**: edit `src/lib/config.ts` (app name, description, links) — it feeds page titles, the sidebar brand, email subjects, and landing-page links.
2. **Environment**: set the Convex env vars (`SITE_URL`, `RESEND_API_KEY`, `EMAIL_FROM`, `AUTUMN_SECRET_KEY`, Google OAuth credentials) — see the docs in `/docs`.
3. **Assets**: replace `src/lib/assets/favicon.svg`.
4. **Landing page**: rewrite the marketing copy in `src/routes/+page.svelte`.
5. **Products**: define your plans in `autumn.config.ts` and push them with `pnpm dlx atmn push`.

### Prerequisites

- Node.js 24+ (see `.node-version`)
- pnpm (recommended) or npm

### Installation

1. Clone the repository:

```sh
git clone https://github.com/joachimchauvet/modernstack-saas
cd modernstack-saas
```

2. Install dependencies:

```sh
pnpm install
```

3. Initialize Convex:

```sh
pnpm convex dev
```

When you run `convex dev` for the first time, it will:

- Create a new Convex project (or connect to an existing one)
- Generate your Convex deployment URL
- Output your `CONVEX_DEPLOYMENT` and `PUBLIC_CONVEX_URL` values in `.env.local`

4. Set up environment variables:

Convex functions run in Convex's cloud environment and can't read your local .env files. You must set environment variables separately for Convex and SvelteKit.

#### A. Set Convex Environment Variables

After `convex dev` completes, set these in Convex's environment:

```sh
# Required - Better Auth needs this to set cookies correctly
npx convex env set SITE_URL http://localhost:5173

# Required - Generate a secret for Better Auth
npx convex env set BETTER_AUTH_SECRET=$(openssl rand -base64 32)

# Required if you want email functionality (password reset, email change)
npx convex env set RESEND_API_KEY your_resend_api_key
npx convex env set RESET_EMAIL_FROM "Your App <no-reply@yourdomain.com>"

# Optional - Customize reply to address
npx convex env set RESET_EMAIL_REPLY_TO support@yourdomain.com

# Optional - Enable Google OAuth (see docs/better_auth.md for setup)
npx convex env set GOOGLE_CLIENT_ID your_google_client_id
npx convex env set GOOGLE_CLIENT_SECRET your_google_client_secret

# Optional - Enable billing with Autumn/Stripe
npx convex env set AUTUMN_SECRET_KEY your_autumn_secret_key
```

Verify your Convex env vars are set:

```sh
npx convex env list
```

After setting Convex environment variables, restart your convex dev server (`pnpm convex dev`).

#### B. Set SvelteKit Environment Variables

Update your `.env.local` file in the root directory:

```env
# PUBLIC_CONVEX_URL is auto-generated by Convex
PUBLIC_CONVEX_URL=https://xxx.convex.cloud

# PUBLIC_CONVEX_SITE_URL: Convert the .convex.cloud URL to .convex.site
# Example: if PUBLIC_CONVEX_URL is https://xxx.convex.cloud,
# then PUBLIC_CONVEX_SITE_URL should be https://xxx.convex.site
PUBLIC_CONVEX_SITE_URL=https://xxx.convex.site

# This should match what you set in Convex (used by SvelteKit hooks)
SITE_URL=http://localhost:5173
```

5. Start the development server:

```sh
pnpm dev
```

The app will be running at `http://localhost:5173`

## Development

Run both the SvelteKit dev server and Convex in parallel:

```sh
# Terminal 1 - Convex backend
pnpm convex dev

# Terminal 2 - SvelteKit frontend
pnpm dev
```

## Project Structure

```
├── src/
│   ├── lib/
│   │   ├── components/     # UI components
│   │   ├── auth-client.ts  # Better Auth client
│   │   └── ...
│   ├── routes/
│   │   ├── (app)/          # Protected routes
│   │   │   ├── dashboard/
│   │   │   └── settings/
│   │   └── auth/           # Authentication routes
│   └── convex/             # Convex backend
│       ├── auth.ts         # Auth configuration
│       ├── storage.ts      # File storage
│       └── ...
```

## Building for Production

Create a production build:

```sh
pnpm build
```

Preview the production build:

```sh
pnpm preview
```

## Deployment

This starter uses [adapter-cloudflare](https://kit.svelte.dev/docs/adapter-cloudflare) by default, but you can swap it for any SvelteKit adapter:

- [Vercel](https://kit.svelte.dev/docs/adapter-vercel)
- [Netlify](https://kit.svelte.dev/docs/adapter-netlify)
- [Node](https://kit.svelte.dev/docs/adapter-node)
- [Other adapters](https://kit.svelte.dev/docs/adapters)

### Deployment Steps

1. Deploy your Convex backend:

```sh
pnpm convex deploy
```

2. Set Convex environment variables for production:

```sh
# Update SITE_URL to your production domain
npx convex env set SITE_URL https://yourdomain.com

# Set other Convex env vars if not already set
npx convex env set BETTER_AUTH_SECRET=$(openssl rand -base64 32)
npx convex env set RESEND_API_KEY your_resend_api_key
npx convex env set RESET_EMAIL_FROM "Your App <no-reply@yourdomain.com>"
npx convex env set RESET_EMAIL_REPLY_TO support@yourdomain.com
npx convex env set GOOGLE_CLIENT_ID your_google_client_id
npx convex env set GOOGLE_CLIENT_SECRET your_google_client_secret
npx convex env set AUTUMN_SECRET_KEY your_autumn_secret_key
```

3. Set SvelteKit environment variables for build:

These variables use SvelteKit's `$env/static/*` imports, which means they're baked into the bundle at build time. Set them where your build runs, not in your hosting platform's runtime environment variables.

- `PUBLIC_CONVEX_URL` - Your Convex deployment URL
- `PUBLIC_CONVEX_SITE_URL` - Your Convex site URL
- `SITE_URL` - Your production domain (e.g., `https://yourdomain.com`)

**If using GitHub Actions** (like the included Cloudflare Pages workflow):

Set these as GitHub repository variables (Settings → Secrets and variables → Actions → Variables):

- `PUBLIC_CONVEX_URL`
- `PUBLIC_CONVEX_SITE_URL`
- `SITE_URL`

The workflow will automatically use these during the build step.

**If deploying directly from your machine or other CI/CD:**

Set these as environment variables when running `pnpm build`:

- **Vercel**: Project Settings → Environment Variables (make sure they're available at build time)
- **Netlify**: Site Settings → Environment Variables (available during build)
- **Cloudflare Pages**: Settings → Environment Variables (if not using GitHub Actions)
- **Cloudflare Workers**: `wrangler secret put VARIABLE_NAME` (for runtime secrets only)

4. Deploy your frontend to your chosen platform

## Documentation

This project includes comprehensive documentation optimized for LLM consumption:

- **`/docs`** - Framework-specific guides and best practices
  - `svelte/` - Svelte 5 runes, reactivity, templating, and state management
  - `better_auth.md` - Authentication setup and patterns
  - `convex.md` - Backend queries, mutations, and real-time data
  - `tailwind_v4.md` - Styling with Tailwind CSS v4
  - `autumn.md` - Billing and subscription management

## CI/CD

GitHub Actions workflows are included for:

- **Code Quality** (`.github/workflows/code-quality.yml`) - Linting, formatting, type checking, and spell checking on every push/PR
- **Cloudflare Pages** (`.github/workflows/cloudflare-pages.yml`) - Branch deployments: on push to `dev`/`main` it deploys the Convex backend, then builds and deploys the frontend. Uses the `development` (for `dev`) and `production` (for `main`) GitHub Environments.
- **Convex + Pages Preview** (`.github/workflows/convex-preview.yml`) - Per-PR previews: spins up an isolated Convex preview deployment, optionally clones data into it, then deploys a Cloudflare Pages preview wired to that backend, and comments the URLs on the PR.

### Branch deployments

The Pages workflow runs `pnpm convex deploy` before building, so each environment needs a `CONVEX_DEPLOY_KEY` secret in addition to the build variables above.

| GitHub Environment | Trigger        | Secrets                                                              | Variables                                                                            |
| ------------------ | -------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `development`      | push to `dev`  | `CONVEX_DEPLOY_KEY`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` | `PUBLIC_CONVEX_URL`, `PUBLIC_CONVEX_SITE_URL`, `SITE_URL`, `CLOUDFLARE_PROJECT_NAME` |
| `production`       | push to `main` | same as above (production keys)                                      | same as above (production values)                                                    |

Enable required reviewers on the `production` environment for a deliberate release gate.

### Preview deployments

The preview workflow is **project-agnostic** — it never names a Convex project. Which project a preview lands in, and which deployment data is copied from, is decided entirely by the deploy keys you put in the `preview` GitHub Environment.

> **Plan note.** Preview deployments work on all plans, including the free tier — but idle previews are auto-deleted after **5 days** on Free/Starter (**14 days** on Pro and up). Each open PR consumes a preview deployment in the preview key's project.

Configure the **`preview`** GitHub Environment:

| Type     | Name                                            | Purpose                                                                                                                        |
| -------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Secret   | `CONVEX_PREVIEW_DEPLOY_KEY`                     | A Convex **preview** deploy key. Creates the preview and imports/runs against it.                                              |
| Secret   | `CONVEX_SOURCE_DEPLOY_KEY`                      | _Optional._ A **non-preview** key (staging or prod) for the deployment to copy data from. Only needed when data cloning is on. |
| Secret   | `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Pages deploy.                                                                                                       |
| Variable | `CLOUDFLARE_PROJECT_NAME`                       | Pages project (defaults to the repo name).                                                                                     |
| Variable | `CONVEX_PREVIEW_COPY_DATA`                      | `true` to clone data into previews (default off).                                                                              |
| Variable | `CONVEX_PREVIEW_INCLUDE_FILE_STORAGE`           | `true` to also copy file storage (e.g. uploaded avatars).                                                                      |

Per-preview runtime env (`SITE_URL`, `CONVEX_DEPLOYMENT_KIND`) is set automatically by the workflow. Secrets that are the **same for every preview** — `BETTER_AUTH_SECRET`, an Autumn **sandbox** key, Google OAuth credentials — should be set once as Convex **"default environment variables for preview deployments"** in the dashboard, so they stay out of CI logs.

Notes:

- **Data cloning is off by default.** When enabled, copied auth/org rows may contain real personal data and dangling billing customer IDs; `preview:postImportCleanup` (`src/convex/preview.ts`) clears ephemeral Better Auth state (`session`, `verification`, `invitation`, `jwks`) after import. Prefer staging over production as the source.
- **Google OAuth doesn't work on previews** — the ephemeral origin isn't a registered redirect URI. Use email/password on previews.
- **Schema-changing PRs** may get an empty preview: a snapshot from an older schema can fail to import against the new one, and the import step is intentionally non-fatal.
- **Fork PRs** don't receive previews — GitHub withholds environment secrets from forks.
- **Teardown** is automatic: Convex auto-expires idle previews (~5 days on Free/Starter, ~14 on Pro+); there's no CLI command to delete one.

## Built for Modern Stack Hackathon

This starter template was created for the [Convex Modern Stack Hackathon](https://www.convex.dev/hackathons/modernstack), showcasing the power of combining modern web technologies to build production-ready SaaS applications.

---

## 🚀 Ready to Ship?

**Stop plumbing, start vibing.** Modern stack, zero setup headaches.

✓ Auth • ✓ Payments • ✓ Real-time DB • ✓ Your brilliant idea? **Add here →**

[**Fork & Ship on GitHub**](https://github.com/joachimchauvet/modernstack-saas) • MIT Licensed • Built for developers
