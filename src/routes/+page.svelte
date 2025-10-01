<script lang="ts">
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import {
		Rocket,
		Shield,
		ChartColumn,
		CreditCard,
		Settings,
		Users,
		Github,
		BookOpen,
		GitBranch,
		Cloud,
		Mail,
		PiggyBank
	} from '@lucide/svelte';

	const to = {
		signUp: resolve('/auth/sign-up'),
		signIn: resolve('/auth/sign-in'),
		dashboard: resolve('/dashboard')
	};
</script>

<section class="relative overflow-hidden">
	<a
		href="https://github.com/joachimchauvet/modernstack-saas"
		target="_blank"
		rel="noopener noreferrer"
		class="group fixed top-6 right-6 z-20 inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-4 py-2 text-sm font-medium text-foreground shadow-sm backdrop-blur transition hover:border-primary hover:text-primary"
	>
		<Github class="h-4 w-4 transition group-hover:scale-110" />
		<span>View on GitHub</span>
	</a>
	<div
		class="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-background via-background to-background/60"
	></div>

	<div class="mx-auto max-w-6xl px-4 py-24 sm:py-36">
		<div class="mx-auto flex min-h-[40vh] items-center justify-center">
			<div class="max-w-3xl text-center">
				<h1 class="text-4xl leading-tight font-semibold tracking-tight text-balance sm:text-5xl">
					Build your SaaS faster with our
					<span class="bg-gradient-to-r from-primary to-foreground bg-clip-text text-transparent">
						ModernStack SaaS Starter</span
					>
				</h1>
				<p class="mt-4 text-pretty text-muted-foreground sm:text-lg">
					Auth, dashboard, payments, settings, and a modern UI — wired up with Convex, Better Auth,
					Autumn, and shadcn-svelte. Focus on your product, not the plumbing.
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
								>Email/password, admin roles, and organization-ready access control.</Card.Description
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
				<div class="mb-2 text-primary"><Github class="h-5 w-5" /></div>
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
					GitHub Actions automate linting, tests, and Cloudflare deployments out of the box.
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
		<a
			href="https://github.com/joachimchauvet/modernstack-saas"
			target="_blank"
			rel="noopener noreferrer"
			class="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-foreground transition hover:border-primary hover:text-primary"
		>
			<Github class="h-4 w-4" />
			<span>Star us on GitHub</span>
		</a>
	</div>
</footer>
