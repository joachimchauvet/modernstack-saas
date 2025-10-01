<script lang="ts">
	import { CirclePlus } from '@lucide/svelte';
	import type { Component } from 'svelte';
	import type { IconProps } from '@lucide/svelte';
	// removed Inbox button
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { resolve as _resolve } from '$app/paths';

	let { items }: { items: { title: string; url: string; icon?: Component<IconProps> }[] } =
		$props();

	const resolveLink = (url: string) => (_resolve as unknown as (u: string) => string)(url);
</script>

<Sidebar.Group>
	<Sidebar.GroupContent class="flex flex-col gap-2">
		<Sidebar.Menu>
			<Sidebar.MenuItem class="flex items-center gap-2">
				<Sidebar.MenuButton
					class="min-w-8 bg-primary text-primary-foreground duration-200 ease-linear hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground"
					tooltipContent="Quick create"
				>
					<CirclePlus />
					<span>Quick Create</span>
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
		<Sidebar.Menu>
			{#each items as item (item.title)}
				<Sidebar.MenuItem>
					<Sidebar.MenuButton tooltipContent={item.title}>
						{#snippet child({ props })}
							{#if item.url && item.url.startsWith('/')}
								<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
								<a href={resolveLink(item.url)} {...props}>
									{#if item.icon}
										<item.icon />
									{/if}
									<span>{item.title}</span>
								</a>
							{:else if item.url && (item.url.startsWith('http://') || item.url.startsWith('https://') || item.url.startsWith('mailto:') || item.url.startsWith('tel:'))}
								<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
								<a href={item.url} target="_blank" rel="noopener noreferrer" {...props}>
									{#if item.icon}
										<item.icon />
									{/if}
									<span>{item.title}</span>
								</a>
							{:else}
								<span {...props}>
									{#if item.icon}
										<item.icon />
									{/if}
									<span>{item.title}</span>
								</span>
							{/if}
						{/snippet}
					</Sidebar.MenuButton>
				</Sidebar.MenuItem>
			{/each}
		</Sidebar.Menu>
	</Sidebar.GroupContent>
</Sidebar.Group>
