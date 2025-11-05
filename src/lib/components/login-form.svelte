<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { authClient } from '$lib/auth-client.js';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { getContext } from 'svelte';

	interface Props {
		id?: string;
		mode?: 'signin' | 'signup';
	}

	const { id, mode = 'signin' }: Props = $props();

	const authEmailCtx = getContext<{ get: () => string; set: (v: string) => void }>('auth:email');

	let email = $state(authEmailCtx?.get() ?? '');
	let password = $state('');
	let name = $state('');
	let isSignUp = $state(mode === 'signup');
	let isLoading = $state(false);
	let error = $state<string | null>(null);

	$effect(() => {
		authEmailCtx?.set(email);
	});

	async function handleSubmit(e: Event) {
		e.preventDefault();
		isLoading = true;
		error = null;

		try {
			if (isSignUp) {
				await authClient.signUp.email(
					{ name, email, password },
					{
						onSuccess: () => {
							goto(resolve('/dashboard'));
						},
						onError: (ctx) => {
							error = ctx.error.message;
						}
					}
				);
			} else {
				await authClient.signIn.email(
					{ email, password },
					{
						onSuccess: () => {
							goto(resolve('/dashboard'));
						},
						onError: (ctx) => {
							error = ctx.error.message;
						}
					}
				);
			}
		} catch (err) {
			error = 'An unexpected error occurred';
			console.error('Auth error:', err);
		} finally {
			isLoading = false;
		}
	}

	async function handleGoogleLogin() {
		try {
			await authClient.signIn.social({
				provider: 'google',
				callbackURL: '/dashboard'
			});
		} catch (err) {
			error = 'Failed to sign in with Google';
			console.error('Google auth error:', err);
		}
	}
</script>

<Card.Root class="mx-auto w-full max-w-sm">
	<Card.Header>
		<Card.Title class="text-2xl">{isSignUp ? 'Sign Up' : 'Sign In'}</Card.Title>
		<Card.Description>
			{isSignUp ? 'Create a new account' : 'Enter your email below to sign in to your account'}
		</Card.Description>
	</Card.Header>
	<Card.Content>
		<form onsubmit={handleSubmit}>
			<div class="grid gap-4">
				{#if error}
					<div class="rounded-md bg-red-50 p-3 text-sm text-red-800">
						{error}
					</div>
				{/if}

				{#if isSignUp}
					<div class="grid gap-2">
						<Label for="name-{id}">Name</Label>
						<Input id="name-{id}" type="text" placeholder="John Doe" bind:value={name} required />
					</div>
				{/if}

				<div class="grid gap-2">
					<Label for="email-{id}">Email</Label>
					<Input
						id="email-{id}"
						type="email"
						placeholder="m@example.com"
						bind:value={email}
						required
					/>
				</div>
				<div class="grid gap-2">
					<div class="flex items-center">
						<Label for="password-{id}">Password</Label>
						{#if !isSignUp}
							<a
								href={resolve('/auth/forgot-password')}
								class="ml-auto inline-block text-sm underline"
							>
								Forgot your password?
							</a>
						{/if}
					</div>
					<Input id="password-{id}" type="password" bind:value={password} required />
				</div>
				<Button type="submit" class="w-full" disabled={isLoading}>
					{#if isLoading}
						Loading...
					{:else}
						{isSignUp ? 'Sign Up' : 'Sign In'}
					{/if}
				</Button>
				<Button variant="outline" class="w-full" type="button" onclick={handleGoogleLogin}>
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="mr-2 h-4 w-4">
						<path
							d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
							fill="currentColor"
						/>
					</svg>
					{isSignUp ? 'Sign up' : 'Sign In'} with Google
				</Button>
			</div>
		</form>
		<div class="mt-4 text-center text-sm">
			{isSignUp ? 'Already have an account?' : "Don't have an account?"}
			{#if isSignUp}
				Already have an account?
				<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
				<a href={resolve('/auth/sign-in')} class="underline hover:text-primary">Sign In</a>
			{:else}
				Don't have an account?
				<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
				<a href={resolve('/auth/sign-up')} class="underline hover:text-primary">Sign up</a>
			{/if}
		</div>
	</Card.Content>
</Card.Root>
