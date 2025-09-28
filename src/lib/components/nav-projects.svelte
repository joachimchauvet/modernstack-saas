<script lang="ts">
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { useSidebar } from '$lib/components/ui/sidebar/context.svelte.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { resolve as _resolve } from '$app/paths';
	import EllipsisIcon from '@lucide/svelte/icons/ellipsis';
	import FolderIcon from '@lucide/svelte/icons/folder';
	import ForwardIcon from '@lucide/svelte/icons/forward';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';

	let {
		projects
	}: {
		projects: {
			name: string;
			url: string;
			// This should be `Component` after @lucide/svelte updates types
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			icon: any;
		}[];
	} = $props();

	const sidebar = useSidebar();
	const resolveLink = (url: string) => (_resolve as unknown as (u: string) => string)(url);
</script>

<Sidebar.Group class="group-data-[collapsible=icon]:hidden">
	<Sidebar.GroupLabel>Projects</Sidebar.GroupLabel>
	<Sidebar.Menu>
		{#each projects as item (item.name)}
			<Sidebar.MenuItem>
				<Sidebar.MenuButton>
					{#snippet child({ props })}
						{#if item.url && item.url.startsWith('/')}
							<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
							<a href={resolveLink(item.url)} {...props}>
								<item.icon />
								<span>{item.name}</span>
							</a>
						{:else if item.url && (item.url.startsWith('http://') || item.url.startsWith('https://') || item.url.startsWith('mailto:') || item.url.startsWith('tel:'))}
							<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
							<a href={item.url} target="_blank" rel="noopener noreferrer" {...props}>
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
							<Sidebar.MenuAction showOnHover {...props}>
								<EllipsisIcon />
								<span class="sr-only">More</span>
							</Sidebar.MenuAction>
						{/snippet}
					</DropdownMenu.Trigger>
					<DropdownMenu.Content
						class="w-48 rounded-lg"
						side={sidebar.isMobile ? 'bottom' : 'right'}
						align={sidebar.isMobile ? 'end' : 'start'}
					>
						<DropdownMenu.Item>
							<FolderIcon class="text-muted-foreground" />
							<span>View Project</span>
						</DropdownMenu.Item>
						<DropdownMenu.Item>
							<ForwardIcon class="text-muted-foreground" />
							<span>Share Project</span>
						</DropdownMenu.Item>
						<DropdownMenu.Separator />
						<DropdownMenu.Item>
							<Trash2Icon class="text-muted-foreground" />
							<span>Delete Project</span>
						</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</Sidebar.MenuItem>
		{/each}
		<Sidebar.MenuItem>
			<Sidebar.MenuButton class="text-sidebar-foreground/70">
				<EllipsisIcon class="text-sidebar-foreground/70" />
				<span>More</span>
			</Sidebar.MenuButton>
		</Sidebar.MenuItem>
	</Sidebar.Menu>
</Sidebar.Group>
