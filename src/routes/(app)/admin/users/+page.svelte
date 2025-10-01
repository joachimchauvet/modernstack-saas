<script lang="ts">
	import { api } from '$convex/_generated/api.js';
	import { useQuery } from 'convex-svelte';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import * as Pagination from '$lib/components/ui/pagination/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { UserPlus, Ban, Trash2 } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import { authClient } from '$lib/auth-client';

	interface User {
		id: string;
		name: string;
		email: string;
		role?: string | null;
		banned?: boolean | null;
		banReason?: string | null;
		createdAt: Date;
	}

	const roleOptions = [
		{ value: 'user', label: 'User' },
		{ value: 'admin', label: 'Admin' }
	];

	// Get current user
	const currentUserResponse = useQuery(api.auth.getCurrentUser, {});
	let currentUser = $derived(currentUserResponse.data);

	// State for users list
	let users = $state<User[]>([]);
	let totalUsers = $state(0);
	let currentPage = $state(1);
	let perPage = $state(25);

	// Dialog state
	let showCreateDialog = $state(false);
	let newUserName = $state('');
	let newUserEmail = $state('');
	let newUserPassword = $state('');
	let newUserRole = $state('user');
	let isCreating = $state(false);

	// Alert dialog state for delete confirmation
	let showDeleteDialog = $state(false);
	let userToDelete = $state<string | null>(null);

	// Alert dialog state for ban confirmation
	let showBanDialog = $state(false);
	let userToBan = $state<{ id: string; shouldBan: boolean } | null>(null);

	// Load users
	async function loadUsers() {
		try {
			const offset = (currentPage - 1) * perPage;
			const { data, error } = await authClient.admin.listUsers({
				query: {
					limit: perPage,
					offset: offset
				}
			});

			if (error) {
				throw new Error(error.message);
			}

			if (data) {
				users = data.users || [];
				totalUsers = data.total || 0;
			}
		} catch (error) {
			console.error('Error loading users:', error);
			toast.error('Failed to load users');
		}
	}

	// Load users on mount
	$effect(() => {
		loadUsers();
	});

	// Reload users when page changes
	$effect(() => {
		if (currentPage) {
			loadUsers();
		}
	});

	async function handleCreateUser() {
		if (!newUserName || !newUserEmail || !newUserPassword) {
			toast.error('Please fill in all fields');
			return;
		}

		isCreating = true;
		try {
			const { error } = await authClient.admin.createUser({
				email: newUserEmail,
				password: newUserPassword,
				name: newUserName,
				role: newUserRole as 'user' | 'admin'
			});

			if (error) {
				throw new Error(error.message);
			}

			toast.success('User created successfully');
			showCreateDialog = false;
			newUserName = '';
			newUserEmail = '';
			newUserPassword = '';
			newUserRole = 'user';

			// Go to first page and reload users list
			currentPage = 1;
			await loadUsers();
		} catch (error) {
			toast.error('Failed to create user: ' + (error as Error).message);
		} finally {
			isCreating = false;
		}
	}

	async function handleUpdateRole(userId: string, role: string) {
		try {
			const { error } = await authClient.admin.setRole({
				userId,
				role: role as 'user' | 'admin'
			});

			if (error) {
				throw new Error(error.message);
			}

			toast.success('User role updated');
			await loadUsers();
		} catch (error) {
			toast.error('Failed to update role: ' + (error as Error).message);
		}
	}

	function confirmBanUser(userId: string, shouldBan: boolean) {
		userToBan = { id: userId, shouldBan };
		showBanDialog = true;
	}

	async function handleBanUser() {
		if (!userToBan) return;

		try {
			if (userToBan.shouldBan) {
				const { error } = await authClient.admin.banUser({
					userId: userToBan.id,
					banReason: 'Banned by admin'
				});
				if (error) throw new Error(error.message);
			} else {
				const { error } = await authClient.admin.unbanUser({
					userId: userToBan.id
				});
				if (error) throw new Error(error.message);
			}

			toast.success(userToBan.shouldBan ? 'User banned' : 'User unbanned');
			showBanDialog = false;
			userToBan = null;
			await loadUsers();
		} catch (error) {
			toast.error('Failed to update ban status: ' + (error as Error).message);
		}
	}

	function confirmDeleteUser(userId: string) {
		userToDelete = userId;
		showDeleteDialog = true;
	}

	async function handleDeleteUser() {
		if (!userToDelete) return;

		try {
			const { error } = await authClient.admin.removeUser({
				userId: userToDelete
			});

			if (error) {
				throw new Error(error.message);
			}

			toast.success('User deleted');
			showDeleteDialog = false;
			userToDelete = null;
			await loadUsers();
		} catch (error) {
			toast.error('Failed to delete user: ' + (error as Error).message);
		}
	}

	function formatDate(date: Date) {
		return new Date(date).toLocaleDateString();
	}

	// Derived value for create dialog role label
	let createDialogRoleLabel = $derived(
		roleOptions.find((r) => r.value === newUserRole)?.label || 'User'
	);
</script>

<svelte:head>
	<title>Users | Admin</title>
</svelte:head>

<!-- Header -->
<header
	class="flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12"
>
	<div class="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
		<Sidebar.Trigger class="-ml-1" />
		<Separator orientation="vertical" class="mx-2 data-[orientation=vertical]:h-4" />
		<h1 class="text-base font-medium">User Management</h1>
		<div class="ml-auto">
			<Button onclick={() => (showCreateDialog = true)}>
				<UserPlus class="mr-2 h-4 w-4" />
				Add User
			</Button>
		</div>
	</div>
</header>

<!-- Main Content -->
<div class="flex flex-1 flex-col">
	<div class="flex-1 space-y-6 p-6 md:p-10">
		<div>
			<h2 class="text-2xl font-bold tracking-tight">Users</h2>
			<p class="text-muted-foreground">Manage user accounts and permissions.</p>
		</div>

		<Separator />

		<!-- Users Table -->
		<div class="rounded-md border">
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head>Name</Table.Head>
						<Table.Head>Email</Table.Head>
						<Table.Head>Role</Table.Head>
						<Table.Head>Status</Table.Head>
						<Table.Head>Joined</Table.Head>
						<Table.Head class="text-right">Actions</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each users as user (user.id)}
						<Table.Row>
							<Table.Cell class="font-medium">{user.name}</Table.Cell>
							<Table.Cell>{user.email}</Table.Cell>
							<Table.Cell>
								{@const userRole = user.role || 'user'}
								{@const roleLabel = roleOptions.find((r) => r.value === userRole)?.label || 'User'}
								<Select.Root
									type="single"
									value={userRole}
									onValueChange={(value) => {
										if (value) {
											handleUpdateRole(user.id, value);
										}
									}}
								>
									<Select.Trigger class="w-[120px]">
										{roleLabel}
									</Select.Trigger>
									<Select.Content>
										{#each roleOptions as option (option.value)}
											<Select.Item value={option.value} label={option.label}>
												{option.label}
											</Select.Item>
										{/each}
									</Select.Content>
								</Select.Root>
							</Table.Cell>
							<Table.Cell>
								{#if user.banned}
									<Badge variant="destructive">Banned</Badge>
								{:else}
									<Badge variant="outline">Active</Badge>
								{/if}
							</Table.Cell>
							<Table.Cell>{formatDate(user.createdAt)}</Table.Cell>
							<Table.Cell class="text-right">
								<Tooltip.Provider>
									<div class="flex justify-end gap-2">
										{#if user.banned}
											<Tooltip.Root>
												<Tooltip.Trigger>
													<Button
														variant="outline"
														size="sm"
														onclick={() => confirmBanUser(user.id, false)}
													>
														Unban
													</Button>
												</Tooltip.Trigger>
												<Tooltip.Content>
													<p>Restore user access</p>
												</Tooltip.Content>
											</Tooltip.Root>
										{:else}
											<Tooltip.Root>
												<Tooltip.Trigger>
													<Button
														variant="outline"
														size="sm"
														onclick={() => confirmBanUser(user.id, true)}
													>
														<Ban class="h-4 w-4" />
													</Button>
												</Tooltip.Trigger>
												<Tooltip.Content>
													<p>Ban user</p>
												</Tooltip.Content>
											</Tooltip.Root>
										{/if}
										<Tooltip.Root>
											<Tooltip.Trigger>
												<Button
													variant="destructive"
													size="sm"
													onclick={() => confirmDeleteUser(user.id)}
													disabled={user.id === currentUser?._id}
												>
													<Trash2 class="h-4 w-4" />
												</Button>
											</Tooltip.Trigger>
											<Tooltip.Content>
												<p>
													{user.id === currentUser?._id
														? 'Cannot delete your own account'
														: 'Permanently delete this user'}
												</p>
											</Tooltip.Content>
										</Tooltip.Root>
									</div>
								</Tooltip.Provider>
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</div>

		<!-- Pagination -->
		{#if totalUsers > perPage}
			<div class="mt-4 flex items-center justify-between">
				<p class="text-sm text-muted-foreground">
					Showing {Math.min((currentPage - 1) * perPage + 1, totalUsers)} to {Math.min(
						currentPage * perPage,
						totalUsers
					)} of {totalUsers} users
				</p>
				<Pagination.Root count={totalUsers} {perPage} bind:page={currentPage}>
					{#snippet children({ pages, currentPage: activePage })}
						<Pagination.Content>
							<Pagination.Item>
								<Pagination.PrevButton />
							</Pagination.Item>
							{#each pages as page (page.key)}
								{#if page.type === 'ellipsis'}
									<Pagination.Item>
										<Pagination.Ellipsis />
									</Pagination.Item>
								{:else}
									<Pagination.Item>
										<Pagination.Link {page} isActive={activePage === page.value}>
											{page.value}
										</Pagination.Link>
									</Pagination.Item>
								{/if}
							{/each}
							<Pagination.Item>
								<Pagination.NextButton />
							</Pagination.Item>
						</Pagination.Content>
					{/snippet}
				</Pagination.Root>
			</div>
		{/if}
	</div>
</div>

<!-- Create User Dialog -->
<Dialog.Root bind:open={showCreateDialog}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Create New User</Dialog.Title>
			<Dialog.Description>Add a new user to the system.</Dialog.Description>
		</Dialog.Header>
		<div class="grid gap-4 py-4">
			<div class="grid gap-2">
				<Label for="name">Name</Label>
				<Input id="name" bind:value={newUserName} placeholder="John Doe" />
			</div>
			<div class="grid gap-2">
				<Label for="email">Email</Label>
				<Input id="email" type="email" bind:value={newUserEmail} placeholder="john@example.com" />
			</div>
			<div class="grid gap-2">
				<Label for="password">Password</Label>
				<Input id="password" type="password" bind:value={newUserPassword} placeholder="••••••••" />
			</div>
			<div class="grid gap-2">
				<Label for="role">Role</Label>
				<Select.Root type="single" bind:value={newUserRole}>
					<Select.Trigger>
						{createDialogRoleLabel}
					</Select.Trigger>
					<Select.Content>
						{#each roleOptions as option (option.value)}
							<Select.Item value={option.value} label={option.label}>
								{option.label}
							</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>
		</div>
		<Dialog.Footer>
			<Button variant="outline" onclick={() => (showCreateDialog = false)}>Cancel</Button>
			<Button onclick={handleCreateUser} disabled={isCreating}>
				{isCreating ? 'Creating...' : 'Create User'}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<!-- Ban User Alert Dialog -->
<AlertDialog.Root bind:open={showBanDialog}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>
				{userToBan?.shouldBan ? 'Ban User?' : 'Unban User?'}
			</AlertDialog.Title>
			<AlertDialog.Description>
				{#if userToBan?.shouldBan}
					This will prevent the user from accessing the system. Their sessions will be revoked and
					they will not be able to sign in.
				{:else}
					This will restore the user's access to the system. They will be able to sign in again.
				{/if}
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
			<AlertDialog.Action onclick={handleBanUser}>
				{userToBan?.shouldBan ? 'Ban User' : 'Unban User'}
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>

<!-- Delete User Alert Dialog -->
<AlertDialog.Root bind:open={showDeleteDialog}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Are you absolutely sure?</AlertDialog.Title>
			<AlertDialog.Description>
				This action cannot be undone. This will permanently delete the user account and remove their
				data from the system.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
			<AlertDialog.Action onclick={handleDeleteUser}>Delete</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
