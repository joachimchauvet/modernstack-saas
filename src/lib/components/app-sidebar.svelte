<script lang="ts">
	import CameraIcon from '@tabler/icons-svelte/icons/camera';
	import ChartBarIcon from '@tabler/icons-svelte/icons/chart-bar';
	import DashboardIcon from '@tabler/icons-svelte/icons/dashboard';
	import FileAiIcon from '@tabler/icons-svelte/icons/file-ai';
	import FileDescriptionIcon from '@tabler/icons-svelte/icons/file-description';
	import FolderIcon from '@tabler/icons-svelte/icons/folder';
	import HelpIcon from '@tabler/icons-svelte/icons/help';
	import InnerShadowTopIcon from '@tabler/icons-svelte/icons/inner-shadow-top';
	import ReportIcon from '@tabler/icons-svelte/icons/report';
	import SettingsIcon from '@tabler/icons-svelte/icons/settings';
	import UsersIcon from '@tabler/icons-svelte/icons/users';
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
			icon: DashboardIcon
		},
		{
			title: 'Team',
			url: '/team',
			icon: UsersIcon
		},
		{
			title: 'Analytics',
			url: '/analytics',
			icon: ChartBarIcon
		},
		{
			title: 'Projects',
			url: '/projects',
			icon: FolderIcon
		}
	];

	const data = $derived.by(() => ({
		user: userData,
		navMain: navMainData,
		navClouds: [
			{
				title: 'Capture',
				icon: CameraIcon,
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
				icon: FileDescriptionIcon,
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
				icon: FileAiIcon,
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
				url: '#',
				icon: SettingsIcon
			},
			{
				title: 'Get Help',
				url: '#',
				icon: HelpIcon
			}
		],
		admin: [
			{
				name: 'Users',
				url: '#',
				icon: UsersIcon
			},
			{
				name: 'Analytics',
				url: '#',
				icon: ReportIcon
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
							<InnerShadowTopIcon class="!size-5" />
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
