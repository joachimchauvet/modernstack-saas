<script lang="ts">
	import {
		Camera,
		ChartColumn,
		LayoutDashboard,
		Sparkles,
		FileText,
		Folder,
		CircleQuestionMark,
		Box,
		Building2,
		ClipboardList,
		Settings,
		Users,
		CreditCard
	} from '@lucide/svelte';
	import NavAdmin from './nav-admin.svelte';
	import NavMain from './nav-main.svelte';
	import NavSecondary from './nav-secondary.svelte';
	import NavUser from './nav-user.svelte';
	import OrgSwitcher from './org-switcher.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import type { ComponentProps } from 'svelte';
	import { resolve } from '$app/paths';

	import { api } from '$convex/_generated/api.js';
	import { useQuery } from 'convex-svelte';
	import { siteConfig } from '$lib/config.js';
	import { canManageOrganization } from '$lib/organizations.js';

	// Get current user from Convex
	const currentUserResponse = useQuery(api.auth.getCurrentUser, {});
	let user = $derived(currentUserResponse.data);

	const userData = $derived({
		name: user?.name || 'User',
		email: user?.email || '',
		avatar: user?.image || ''
	});

	// Billing is managed by organization owners/admins, so the nav item is
	// hidden for regular members of the active organization.
	const activeOrganizationResponse = useQuery(api.organizations.getActiveOrganization, {});
	let canManageBilling = $derived(
		canManageOrganization(activeOrganizationResponse.data?.currentMemberRole)
	);

	const navMainData = $derived([
		{
			title: 'Dashboard',
			url: '/dashboard',
			icon: LayoutDashboard
		},
		...(canManageBilling
			? [
					{
						title: 'Billing',
						url: '/billing',
						icon: CreditCard
					}
				]
			: []),
		{
			title: 'Organization',
			url: '/organization',
			icon: Users
		},
		{
			title: 'Analytics',
			url: '#',
			icon: ChartColumn
		},
		{
			title: 'Projects',
			url: '#',
			icon: Folder
		}
	]);

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
				icon: CircleQuestionMark
			}
		],
		admin: [
			{
				name: 'Users',
				url: '/admin/users',
				icon: Users
			},
			{
				name: 'Organizations',
				url: '/admin/organizations',
				icon: Building2
			},
			{
				name: 'Waitlist',
				url: '/admin/waitlist',
				icon: ClipboardList
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
						<a href={resolve('/')} {...props}>
							<Box class="!size-5" />
							<span class="text-base font-semibold">{siteConfig.name}</span>
						</a>
					{/snippet}
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
		<OrgSwitcher />
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
