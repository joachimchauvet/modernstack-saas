<script lang="ts">
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Accordion from '$lib/components/ui/accordion/index.js';
	import {
		Rocket,
		Shield,
		ChartColumn,
		CreditCard,
		Settings,
		Users,
		Building2,
		BookOpen,
		GitBranch,
		GitPullRequest,
		Cloud,
		Mail,
		PiggyBank
	} from '@lucide/svelte';
	import GithubIcon from '$lib/components/github-icon.svelte';
	import { siteConfig } from '$lib/config.js';

	const to = {
		signUp: resolve('/auth/sign-up'),
		signIn: resolve('/auth/sign-in'),
		dashboard: resolve('/dashboard')
	};
</script>

<svelte:head>
	<title>{siteConfig.name}</title>
	<meta name="description" content={siteConfig.description} />
</svelte:head>

<section class="relative overflow-hidden">
	<!-- eslint-disable svelte/no-navigation-without-resolve -->
	<a
		href={siteConfig.links.github}
		target="_blank"
		rel="noopener noreferrer"
		class="group fixed top-6 right-6 z-20 inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-4 py-2 text-sm font-medium text-foreground shadow-sm backdrop-blur transition hover:border-primary hover:text-primary"
	>
		<GithubIcon class="h-4 w-4 transition group-hover:scale-110" />
		<span>View on GitHub</span>
	</a>
	<!-- eslint-enable svelte/no-navigation-without-resolve -->
	<div
		class="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-background via-background to-background/60"
	></div>

	<div class="mx-auto max-w-6xl px-4 py-24 sm:py-36">
		<div class="mx-auto flex min-h-[40vh] items-center justify-center">
			<div class="max-w-3xl text-center">
				<h1 class="text-4xl leading-tight font-semibold tracking-tight text-balance sm:text-5xl">
					Build your SaaS faster with our
					<span class="bg-gradient-to-r from-primary to-foreground bg-clip-text text-transparent">
						{siteConfig.name} Starter</span
					>
				</h1>
				<p class="mt-4 text-pretty text-muted-foreground sm:text-lg">
					Auth, teams, dashboard, payments, settings, and a modern UI — wired up with Convex, Better
					Auth, Autumn, and shadcn-svelte. Focus on your product, not the plumbing.
				</p>
				<div class="mt-8 flex flex-wrap items-center justify-center gap-3">
					<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
					<a href={to.signUp}><Button size="lg">View Demo</Button></a>
				</div>
			</div>
		</div>

		<div class="mt-20 grid gap-4 sm:grid-cols-2">
			<Card.Root>
				<Card.Content class="p-6">
					<div class="flex items-start gap-4">
						<div class="rounded-md bg-primary/10 p-2 text-primary"><Rocket class="h-5 w-5" /></div>
						<div class="space-y-1">
							<Card.Title class="text-base">SvelteKit + Runes</Card.Title>
							<Card.Description>Modern, reactive app architecture with Svelte 5.</Card.Description>
						</div>
					</div>
				</Card.Content>
			</Card.Root>
			<Card.Root>
				<Card.Content class="p-6">
					<div class="flex items-start gap-4">
						<div class="rounded-md bg-primary/10 p-2 text-primary"><Shield class="h-5 w-5" /></div>
						<div class="space-y-1">
							<Card.Title class="text-base">Better Auth</Card.Title>
							<Card.Description
								>Email/password, admin roles, and built-in organizations with role-based access.</Card.Description
							>
						</div>
					</div>
				</Card.Content>
			</Card.Root>
			<Card.Root>
				<Card.Content class="p-6">
					<div class="flex items-start gap-4">
						<div class="rounded-md bg-primary/10 p-2 text-primary">
							<ChartColumn class="h-5 w-5" />
						</div>
						<div class="space-y-1">
							<Card.Title class="text-base">Convex backend</Card.Title>
							<Card.Description
								>Realtime data, serverless functions, and file storage out of the box.</Card.Description
							>
						</div>
					</div>
				</Card.Content>
			</Card.Root>
			<Card.Root>
				<Card.Content class="p-6">
					<div class="flex items-start gap-4">
						<div class="rounded-md bg-primary/10 p-2 text-primary">
							<CreditCard class="h-5 w-5" />
						</div>
						<div class="space-y-1">
							<Card.Title class="text-base">Payments-ready</Card.Title>
							<Card.Description
								>Stripe-ready payments with usage tracking via Autumn.</Card.Description
							>
						</div>
					</div>
				</Card.Content>
			</Card.Root>
		</div>

		<Card.Root class="mt-16">
			<Card.Content class="flex flex-col items-center justify-between gap-6 p-8 sm:flex-row">
				<div>
					<p class="text-sm font-medium">Everything you need to launch a SaaS</p>
					<p class="mt-1 max-w-xl text-sm text-pretty text-muted-foreground">
						Authentication, settings, sidebar, and a dashboard scaffold — shipped with sensible
						defaults so you can customize quickly.
					</p>
				</div>
				<div class="flex flex-wrap gap-3">
					<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
					<a href={to.signUp}><Button>Create your account</Button></a>
					<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
					<a href={to.signIn}><Button variant="outline">I already have an account</Button></a>
				</div>
			</Card.Content>
		</Card.Root>

		<div class="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
			<div class="rounded-lg border p-6">
				<div class="mb-2 text-primary"><Users class="h-5 w-5" /></div>
				<p class="font-medium">Auth flows included</p>
				<p class="mt-1 text-sm text-muted-foreground">
					Sign up, sign in, forgot/reset password, and sign out wired up.
				</p>
			</div>
			<div class="rounded-lg border p-6">
				<div class="mb-2 text-primary"><Building2 class="h-5 w-5" /></div>
				<p class="font-medium">Teams & multi-tenancy</p>
				<p class="mt-1 text-sm text-muted-foreground">
					Organizations with owner/admin/member roles, email invitations, an org switcher, and
					billing scoped to the active org.
				</p>
			</div>
			<div class="rounded-lg border p-6">
				<div class="mb-2 text-primary"><Settings class="h-5 w-5" /></div>
				<p class="font-medium">Settings pages</p>
				<p class="mt-1 text-sm text-muted-foreground">
					Profile, password, and account sections built with accessible components.
				</p>
			</div>
			<div class="rounded-lg border p-6">
				<div class="mb-2 text-primary"><ChartColumn class="h-5 w-5" /></div>
				<p class="font-medium">Dashboard starter</p>
				<p class="mt-1 text-sm text-muted-foreground">
					Charts and layout placeholders to help you iterate quickly.
				</p>
			</div>
			<div class="rounded-lg border p-6">
				<div class="mb-2 text-primary"><GithubIcon class="h-5 w-5" /></div>
				<p class="font-medium">Free & open source</p>
				<p class="mt-1 text-sm text-muted-foreground">
					MIT licensed starter you can self-host or extend without limits.
				</p>
			</div>
			<div class="rounded-lg border p-6">
				<div class="mb-2 text-primary"><PiggyBank class="h-5 w-5" /></div>
				<p class="font-medium">Free to host</p>
				<p class="mt-1 text-sm text-muted-foreground">
					Instructions for Cloudflare + Convex so you launch for free and scale cost-effectively.
				</p>
			</div>
			<div class="rounded-lg border p-6">
				<div class="mb-2 text-primary"><BookOpen class="h-5 w-5" /></div>
				<p class="font-medium">LLM-ready docs</p>
				<p class="mt-1 text-sm text-muted-foreground">
					Project docs include guidance for wiring AI copilots and workflows.
				</p>
			</div>
			<div class="rounded-lg border p-6">
				<div class="mb-2 text-primary"><Mail class="h-5 w-5" /></div>
				<p class="font-medium">Email notifications</p>
				<p class="mt-1 text-sm text-muted-foreground">
					Resend-backed transactional emails for password resets and future product updates.
				</p>
			</div>
			<div class="rounded-lg border p-6">
				<div class="mb-2 text-primary"><GitBranch class="h-5 w-5" /></div>
				<p class="font-medium">CI/CD included</p>
				<p class="mt-1 text-sm text-muted-foreground">
					GitHub Actions automate linting, type-checks, and Cloudflare deployments out of the box.
				</p>
			</div>
			<div class="rounded-lg border p-6">
				<div class="mb-2 text-primary"><GitPullRequest class="h-5 w-5" /></div>
				<p class="font-medium">Per-PR preview environments</p>
				<p class="mt-1 text-sm text-muted-foreground">
					Every pull request gets an isolated Convex + Cloudflare preview, optionally seeded with
					real data.
				</p>
			</div>
			<div class="rounded-lg border p-6">
				<div class="mb-2 text-primary"><Cloud class="h-5 w-5" /></div>
				<p class="font-medium">Cloudflare ready</p>
				<p class="mt-1 text-sm text-muted-foreground">
					Ship globally with the Cloudflare adapter, or switch to Vercel, Netlify, and other
					adapters in minutes.
				</p>
			</div>
		</div>

		<div class="mt-24">
			<div class="mx-auto max-w-3xl text-center">
				<h2 class="text-3xl font-semibold tracking-tight">Frequently Asked Questions</h2>
				<p class="mt-2 text-muted-foreground">
					Everything you need to know about the {siteConfig.name} Starter
				</p>
			</div>

			<div class="mx-auto mt-12 max-w-3xl">
				<Accordion.Root type="multiple" class="w-full">
					<Accordion.Item value="item-1">
						<Accordion.Trigger>What's included in this starter template?</Accordion.Trigger>
						<Accordion.Content>
							The starter includes a complete authentication system with Better Auth (email/password
							and OAuth), multi-tenant organizations (teams, owner/admin/member roles, and email
							invitations) with org-scoped billing, an admin dashboard with user impersonation, a
							real-time Convex backend, GitHub Actions CI/CD with per-PR preview deployments,
							Stripe-ready billing integration with Autumn, a responsive dashboard with charts and
							data tables, user settings pages, and a modern UI built with shadcn-svelte and
							Tailwind CSS v4. Everything is fully typed with TypeScript.
						</Accordion.Content>
					</Accordion.Item>

					<Accordion.Item value="item-teams">
						<Accordion.Trigger>Does it support teams / multi-tenant SaaS?</Accordion.Trigger>
						<Accordion.Content>
							Yes — multi-tenancy is built in via the Better Auth organization plugin. Every user
							gets a default organization on sign-up (so single-user/B2C works unchanged), plus an
							organization switcher, a settings page to rename the org and manage members and roles
							(owner/admin/member), and email invitations with an accept flow. Billing is scoped to
							the active organization, and an admin area lets you browse organizations and
							impersonate users.
						</Accordion.Content>
					</Accordion.Item>

					<Accordion.Item value="item-2">
						<Accordion.Trigger>Is this template free to use?</Accordion.Trigger>
						<Accordion.Content>
							Yes! This starter template is completely free and open source under the MIT license.
							You can use it for personal projects, commercial applications, or modify it however
							you need. The hosting is also free to start — Convex and Cloudflare both offer
							generous free tiers perfect for launching and scaling your SaaS.
						</Accordion.Content>
					</Accordion.Item>

					<Accordion.Item value="item-3">
						<Accordion.Trigger>How do I deploy this to production?</Accordion.Trigger>
						<Accordion.Content>
							Deployment is straightforward: first deploy your Convex backend with <code
								class="rounded bg-muted px-1.5 py-0.5 text-sm">pnpm convex deploy</code
							>, then deploy your frontend to Cloudflare Pages, Vercel, or Netlify. The template
							includes GitHub Actions workflows for automated deployments. Full deployment
							instructions are available in the README.
						</Accordion.Content>
					</Accordion.Item>

					<Accordion.Item value="item-preview">
						<Accordion.Trigger>Does it include preview deployments?</Accordion.Trigger>
						<Accordion.Content>
							Yes. A GitHub Actions workflow gives every pull request its own isolated environment:
							it spins up a fresh Convex preview deployment and a matching Cloudflare Pages preview,
							and can optionally seed it with a snapshot of your data. Each PR is isolated from
							production and from other PRs, and Convex automatically cleans previews up when they
							go idle.
						</Accordion.Content>
					</Accordion.Item>

					<Accordion.Item value="item-4">
						<Accordion.Trigger>What backend features does Convex provide?</Accordion.Trigger>
						<Accordion.Content>
							Convex provides a real-time database with automatic subscriptions, serverless
							functions for your backend logic, file storage for uploads like user avatars, and
							scheduled functions for background tasks. All database queries are fully typed, and
							changes sync automatically to your frontend without manual polling or websocket
							management.
						</Accordion.Content>
					</Accordion.Item>

					<Accordion.Item value="item-5">
						<Accordion.Trigger>Can I customize the UI components?</Accordion.Trigger>
						<Accordion.Content>
							Absolutely! All UI components are built with shadcn-svelte, which means the source
							code lives in your project under <code class="rounded bg-muted px-1.5 py-0.5 text-sm"
								>src/lib/components/ui</code
							>. I've intentionally kept components as close to vanilla shadcn-svelte as possible,
							giving you complete freedom to style them however you wish. The components are built
							on top of bits-ui for accessibility and Tailwind CSS for styling.
						</Accordion.Content>
					</Accordion.Item>

					<Accordion.Item value="item-6">
						<Accordion.Trigger>How do I add Stripe payments?</Accordion.Trigger>
						<Accordion.Content>
							The template is pre-configured with Autumn, a Stripe billing wrapper. I was initially
							planning to use the Better Auth Stripe plugin but went with Autumn because of the
							Modern Stack Hackathon sponsor. However, it is so nice that I'll probably stick with
							it! To get started, create a free Autumn account and add your Autumn API key to your
							Convex environment variables. This lets you test the billing flows immediately. When
							you're ready to accept live payments, connect your Stripe account to Autumn. The
							billing page and subscription management UI are already included in the template.
						</Accordion.Content>
					</Accordion.Item>

					<Accordion.Item value="item-7">
						<Accordion.Trigger>What about email functionality?</Accordion.Trigger>
						<Accordion.Content>
							The template uses Resend for transactional emails like password resets and email
							verification. Resend offers 3,000 free emails per month and has a simple API. Just add
							your Resend API key to the environment variables, and the email flows will work
							automatically. You can customize the email templates in the Convex functions.
						</Accordion.Content>
					</Accordion.Item>

					<Accordion.Item value="item-8">
						<Accordion.Trigger
							>Is there documentation for working with this stack?</Accordion.Trigger
						>
						<Accordion.Content>
							Yes! The project includes comprehensive documentation in the <code
								class="rounded bg-muted px-1.5 py-0.5 text-sm">/docs</code
							>
							folder, optimized for both developers and AI assistants. You'll find guides for Svelte
							5 runes, Convex patterns, Better Auth setup, Tailwind v4, and Autumn billing. There's also
							a <code class="rounded bg-muted px-1.5 py-0.5 text-sm">CLAUDE.md</code> file for AI-assisted
							development.
						</Accordion.Content>
					</Accordion.Item>

					<Accordion.Item value="item-9">
						<Accordion.Trigger>Is this template going to be maintained?</Accordion.Trigger>
						<Accordion.Content>
							Yes! I plan to keep polishing the starter template and will probably publish a few
							SaaS products using it in the near future. You can follow the journey at <a
								href="https://x.com/joachimchauvet"
								target="_blank"
								rel="noopener noreferrer"
								class="underline hover:text-primary">@joachimchauvet</a
							> for the latest updates, new features, and improvements.
						</Accordion.Content>
					</Accordion.Item>
				</Accordion.Root>
			</div>
		</div>
	</div>
</section>

<footer class="border-t py-10 text-sm text-muted-foreground">
	<div
		class="mx-auto flex max-w-6xl flex-col gap-3 px-4 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left"
	>
		<p>
			Built for the
			<a
				href="https://www.convex.dev/hackathons/modernstack"
				target="_blank"
				rel="noopener noreferrer"
				class="ml-1 underline">Convex Modern Stack Hackathon</a
			>.
		</p>
		<!-- eslint-disable svelte/no-navigation-without-resolve -->
		<a
			href={siteConfig.links.github}
			target="_blank"
			rel="noopener noreferrer"
			class="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-foreground transition hover:border-primary hover:text-primary"
		>
			<GithubIcon class="h-4 w-4" />
			<span>Star us on GitHub</span>
		</a>
		<!-- eslint-enable svelte/no-navigation-without-resolve -->
	</div>
</footer>
