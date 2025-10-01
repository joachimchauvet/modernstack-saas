<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { resolve } from '$app/paths';
	const resolveLink = (url: string) => (resolve as unknown as (u: string) => string)(url);
	import type { WithoutChildren } from '$lib/utils.js';
	import type { ComponentProps, Component } from 'svelte';
	import type { IconProps } from '@lucide/svelte';

	let {
		items,
		...restProps
	}: { items: { title: string; url: string; icon: Component<IconProps> }[] } & WithoutChildren<
		ComponentProps<typeof Sidebar.Group>
	> = $props();
</script>

<Sidebar.Group {...restProps}>
	<Sidebar.GroupContent>
		<Sidebar.Menu>
			{#each items as item (item.title)}
				<Sidebar.MenuItem>
					<Sidebar.MenuButton>
						{#snippet child({ props })}
							{#if item.url && item.url.startsWith('/')}
								<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
								<a href={resolveLink(item.url)} {...props}>
									<item.icon />
									<span>{item.title}</span>
								</a>
							{:else if item.url && (item.url.startsWith('http://') || item.url.startsWith('https://') || item.url.startsWith('mailto:') || item.url.startsWith('tel:'))}
								<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
								<a href={item.url} target="_blank" rel="noopener noreferrer" {...props}>
									<item.icon />
									<span>{item.title}</span>
								</a>
							{:else}
								<span {...props}>
									<item.icon />
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
