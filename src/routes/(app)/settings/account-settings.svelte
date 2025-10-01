<script lang="ts">
	import { authClient } from '$lib/auth-client.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { toast } from 'svelte-sonner';
	import { api } from '$convex/_generated/api.js';
	import { useConvexClient } from 'convex-svelte';
	import { Upload } from '@lucide/svelte';

	interface Props {
		user: {
			name?: string;
			email?: string;
			image?: string | null;
		} | null;
	}

	let { user }: Props = $props();

	let name = $state(user?.name || '');
	let image = $state(user?.image || '');
	let isLoading = $state(false);
	let selectedFile = $state<File | null>(null);
	let fileInput = $state<HTMLInputElement>();

	const convexClient = useConvexClient();

	// Update reactive values when user changes
	$effect(() => {
		if (user) {
			name = user.name || '';
			image = user.image || '';
		}
	});

	function handleFileSelect(e: Event) {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];

		if (file) {
			// Validate file type
			if (!file.type.startsWith('image/')) {
				toast.error('Please select an image file');
				return;
			}

			// Validate file size (max 2MB)
			if (file.size > 2 * 1024 * 1024) {
				toast.error('Image must be less than 2MB');
				return;
			}

			selectedFile = file;
		}
	}

	async function handleUploadImage() {
		if (!selectedFile) return;

		isLoading = true;
		try {
			// Step 1: Generate upload URL
			const uploadUrl = await convexClient.mutation(api.storage.generateUploadUrl, {});

			// Step 2: Upload file to Convex storage
			const result = await fetch(uploadUrl, {
				method: 'POST',
				headers: { 'Content-Type': selectedFile.type },
				body: selectedFile
			});

			const { storageId } = await result.json();

			// Step 3: Get the proper URL from Convex
			const imageUrl = await convexClient.mutation(api.storage.getImageUrl, { storageId });

			// Step 4: Update the image state
			image = imageUrl || '';
			selectedFile = null;

			// Reset file input
			if (fileInput) {
				fileInput.value = '';
			}

			toast.success('Image uploaded successfully');
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Failed to upload image';
			toast.error(message);
		} finally {
			isLoading = false;
		}
	}

	async function handleRemoveImage() {
		isLoading = true;
		try {
			// Clear the image and update profile
			await authClient.updateUser({
				name,
				image: null
			});
			image = '';
			toast.success('Profile picture removed');
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Failed to remove image';
			toast.error(message);
		} finally {
			isLoading = false;
		}
	}

	async function handleUpdateProfile(e: Event) {
		e.preventDefault();
		isLoading = true;

		try {
			await authClient.updateUser({
				name,
				image: image || null
			});

			toast.success('Profile updated successfully');
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Failed to update profile';
			toast.error(message);
		} finally {
			isLoading = false;
		}
	}
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>Account Information</Card.Title>
		<Card.Description>Update your account information here.</Card.Description>
	</Card.Header>
	<Card.Content>
		<form onsubmit={handleUpdateProfile} class="space-y-4">
			<div class="space-y-2">
				<Label for="name">Name</Label>
				<Input id="name" type="text" bind:value={name} placeholder="Your name" required />
				<p class="text-sm text-muted-foreground">This is your public display name.</p>
			</div>

			<div class="space-y-4">
				<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div class="space-y-1">
						<p class="text-sm font-semibold">Profile picture</p>
						<p class="text-sm text-muted-foreground">
							Upload an image or paste a link. We recommend a square image under 2MB.
						</p>
					</div>
					<div class="flex items-center gap-3">
						{#if image}
							<img
								src={image}
								alt="Profile preview"
								class="h-16 w-16 rounded-full border-2 border-border object-cover"
								onerror={(e) => {
									const target = e.target as HTMLImageElement;
									target.style.display = 'none';
								}}
							/>
						{:else}
							<div
								class="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-border text-xs text-muted-foreground"
							>
								No image
							</div>
						{/if}
						{#if image}
							<Button
								type="button"
								variant="outline"
								size="sm"
								onclick={handleRemoveImage}
								disabled={isLoading}
							>
								Remove
							</Button>
						{/if}
					</div>
				</div>

				<div class="grid gap-6 md:grid-cols-[1fr_auto_1fr] md:items-start">
					<div class="space-y-2">
						<Label class="sr-only" for="file-upload">Upload a file</Label>
						<div class="flex gap-2">
							<input
								bind:this={fileInput}
								id="file-upload"
								type="file"
								accept="image/*"
								onchange={handleFileSelect}
								aria-describedby="file-helper"
								class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
							/>
							<Button
								type="button"
								variant="secondary"
								onclick={handleUploadImage}
								disabled={!selectedFile || isLoading}
							>
								<Upload class="h-4 w-4" />
							</Button>
						</div>
						<p id="file-helper" class="text-sm text-muted-foreground">
							PNG, JPG, or GIF up to 2MB.
						</p>
					</div>

					<div class="flex items-center justify-center">
						<div
							class="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase"
						>
							<span class="hidden h-px w-8 bg-border md:block" aria-hidden="true"></span>
							<span>or</span>
							<span class="hidden h-px w-8 bg-border md:block" aria-hidden="true"></span>
						</div>
					</div>

					<div class="space-y-2">
						<Label class="sr-only" for="image">Link from URL</Label>
						<Input
							id="image"
							type="url"
							bind:value={image}
							placeholder="https://example.com/avatar.jpg"
							aria-describedby="image-helper"
						/>
						<p id="image-helper" class="text-sm text-muted-foreground">
							Paste an image link instead of uploading.
						</p>
					</div>
				</div>
			</div>

			<Button type="submit" disabled={isLoading}>
				{isLoading ? 'Saving...' : 'Save Changes'}
			</Button>
		</form>
	</Card.Content>
</Card.Root>
