<script lang="ts">
	import {
		Camera,
		ChartColumn,
		LayoutDashboard,
		Sparkles,
		FileText,
		Folder,
		CircleHelp,
		Box,
		ChartLine,
		Settings,
		Users
	} from '@lucide/svelte';
	import NavAdmin from './nav-admin.svelte';
	import NavMain from './nav-main.svelte';
	import NavSecondary from './nav-secondary.svelte';
	import NavUser from './nav-user.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import type { ComponentProps } from 'svelte';
	import { resolve } from '$app/paths';

	import { api } from '$convex/_generated/api.js';
	import { useQuery } from 'convex-svelte';

	// Get current user from Convex
	const currentUserResponse = useQuery(api.auth.getCurrentUser, {});
	let user = $derived(currentUserResponse.data);

	const userData = $derived({
		name: user?.name || 'User',
		email: user?.email || '',
		avatar: user?.image || ''
	});

	const navMainData = [
		{
			title: 'Dashboard',
			url: '/dashboard',
			icon: LayoutDashboard
		},
		{
			title: 'Team',
			url: '/team',
			icon: Users
		},
		{
			title: 'Analytics',
			url: '/analytics',
			icon: ChartColumn
		},
		{
			title: 'Projects',
			url: '/projects',
			icon: Folder
		}
	];

	const data = $derived.by(() => ({
		user: userData,
		navMain: navMainData,
		navClouds: [
			{
				title: 'Capture',
				icon: Camera,
				isActive: true,
				url: '#',
				items: [
					{
						title: 'Active Proposals',
						url: '#'
					},
					{
						title: 'Archived',
						url: '#'
					}
				]
			},
			{
				title: 'Proposal',
				icon: FileText,
				url: '#',
				items: [
					{
						title: 'Active Proposals',
						url: '#'
					},
					{
						title: 'Archived',
						url: '#'
					}
				]
			},
			{
				title: 'Prompts',
				icon: Sparkles,
				url: '#',
				items: [
					{
						title: 'Active Proposals',
						url: '#'
					},
					{
						title: 'Archived',
						url: '#'
					}
				]
			}
		],
		navSecondary: [
			{
				title: 'Settings',
				url: '/settings',
				icon: Settings
			},
			{
				title: 'Get Help',
				url: '#',
				icon: CircleHelp
			}
		],
		admin: [
			{
				name: 'Users',
				url: '#',
				icon: Users
			},
			{
				name: 'Analytics',
				url: '#',
				icon: ChartLine
			}
		]
	}));

	let { ...restProps }: ComponentProps<typeof Sidebar.Root> = $props();
</script>

<Sidebar.Root collapsible="icon" {...restProps}>
	<Sidebar.Header>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<Sidebar.MenuButton class="data-[slot=sidebar-menu-button]:!p-1.5">
					{#snippet child({ props })}
						<a href={resolve('/dashboard')} {...props}>
							<Box class="!size-5" />
							<span class="text-base font-semibold">ModernStack SaaS</span>
						</a>
					{/snippet}
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Header>
	<Sidebar.Content>
		<NavMain items={data.navMain} />
		{#if (user as unknown as { role?: string } | null)?.role === 'admin'}
			<NavAdmin items={data.admin} />
		{/if}
		<NavSecondary items={data.navSecondary} class="mt-auto" />
	</Sidebar.Content>
	<Sidebar.Footer>
		<NavUser user={data.user} />
	</Sidebar.Footer>
</Sidebar.Root>
