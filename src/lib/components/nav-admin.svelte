<script lang="ts">
	import { Ellipsis, Folder, Share2, Trash2, type Icon } from '@lucide/svelte';

	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { resolve as _resolve } from '$app/paths';

	let { items }: { items: { name: string; url: string; icon: Icon }[] } = $props();

	const sidebar = Sidebar.useSidebar();
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
				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						{#snippet child({ props })}
							<Sidebar.MenuAction
								{...props}
								showOnHover
								class="rounded-sm data-[state=open]:bg-accent"
							>
								<Ellipsis />
								<span class="sr-only">More</span>
							</Sidebar.MenuAction>
						{/snippet}
					</DropdownMenu.Trigger>
					<DropdownMenu.Content
						class="w-24 rounded-lg"
						side={sidebar.isMobile ? 'bottom' : 'right'}
						align={sidebar.isMobile ? 'end' : 'start'}
					>
						<DropdownMenu.Item>
							<Folder />
							<span>Open</span>
						</DropdownMenu.Item>
						<DropdownMenu.Item>
							<Share2 />
							<span>Share</span>
						</DropdownMenu.Item>
						<DropdownMenu.Separator />
						<DropdownMenu.Item variant="destructive">
							<Trash2 />
							<span>Delete</span>
						</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</Sidebar.MenuItem>
		{/each}
		<Sidebar.MenuItem>
			<Sidebar.MenuButton class="text-sidebar-foreground/70">
				<Ellipsis class="text-sidebar-foreground/70" />
				<span>More</span>
			</Sidebar.MenuButton>
		</Sidebar.MenuItem>
	</Sidebar.Menu>
</Sidebar.Group>
