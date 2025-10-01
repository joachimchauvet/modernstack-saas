<script lang="ts">
	import type { Component } from 'svelte';
	import type { IconProps } from '@lucide/svelte';

	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { resolve as _resolve } from '$app/paths';

	let { items }: { items: { name: string; url: string; icon: Component<IconProps> }[] } = $props();

	const resolveLink = (url: string) => (_resolve as unknown as (u: string) => string)(url);
</script>

<Sidebar.Group class="group-data-[collapsible=icon]:hidden">
	<Sidebar.GroupLabel>Admin</Sidebar.GroupLabel>
	<Sidebar.Menu>
		{#each items as item (item.name)}
			<Sidebar.MenuItem>
				<Sidebar.MenuButton>
					{#snippet child({ props })}
						{#if item.url && item.url.startsWith('/')}
							<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
							<a {...props} href={resolveLink(item.url)}>
								<item.icon />
								<span>{item.name}</span>
							</a>
						{:else if item.url && (item.url.startsWith('http://') || item.url.startsWith('https://') || item.url.startsWith('mailto:') || item.url.startsWith('tel:'))}
							<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
							<a {...props} href={item.url} target="_blank" rel="noopener noreferrer">
								<item.icon />
								<span>{item.name}</span>
							</a>
						{:else}
							<span {...props}>
								<item.icon />
								<span>{item.name}</span>
							</span>
						{/if}
					{/snippet}
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		{/each}
	</Sidebar.Menu>
</Sidebar.Group>
