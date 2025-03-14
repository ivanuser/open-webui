<script lang="ts">
	import { getContext, createEventDispatcher } from 'svelte';
	import { toast } from 'svelte-sonner';
	import EllipsisHorizontal from '../../icons/EllipsisHorizontal.svelte';
	import Switch from '../../common/Switch.svelte';
	import Tooltip from '../../common/Tooltip.svelte';
	import DeleteConfirmDialog from '../../common/ConfirmDialog.svelte';
	import GarbageBin from '../../icons/GarbageBin.svelte';
	import Gear from '../../icons/Gear.svelte';
	import { connectToMCPServer, disconnectFromMCPServer, deleteMCPServer } from '$lib/apis/mcp';
	import { mcpServers, settings } from '$lib/stores';
	import { updateUserSettings } from '$lib/apis/users';
	import MCPServerLogs from './MCPServerLogs.svelte';
	
	const i18n = getContext('i18n');
	const dispatch = createEventDispatcher();
	
	export let servers = [];
	
	let showDeleteConfirm = false;
	let serverToDelete = null;
	let showLogs = false;
	let selectedServerForLogs = null;
	
	// Initialize mcpServers if not already initialized
	if (!$mcpServers) {
		mcpServers.set([]);
	}
	
	// Handle connect/disconnect
	const toggleConnection = async (server) => {
		// Skip if already in a transitional state
		if (server.status === 'connecting' || server.status === 'disconnecting') {
			return;
		}
		
		try {
			if (server.status === 'connected') {
				// Disconnect logic
				mcpServers.update(servers => 
					servers?.map(s => s.id === server.id ? { ...s, status: 'disconnecting' } : s) || []
				);
				
				const result = await disconnectFromMCPServer(localStorage.token, server.id);
				if (result.success) {
					mcpServers.update(servers => 
						servers?.map(s => s.id === server.id ? { ...s, status: 'disconnected' } : s) || []
					);
					
					// Update settings to remove this server from enabled list
					if ($settings) {
						if (!$settings.enabledMcpServers) {
							$settings.enabledMcpServers = [];
						}
						
						$settings.enabledMcpServers = $settings.enabledMcpServers.filter(id => id !== server.id);
						settings.set({...$settings});
						
						// Save to backend
						await updateUserSettings(localStorage.token, { ui: $settings });
					}
					
					toast.success($i18n.t('Disconnected from MCP server'));
				} else {
					throw new Error('Failed to disconnect');
				}
			} else {
				// Connect logic
				mcpServers.update(servers => 
					servers?.map(s => s.id === server.id ? { ...s, status: 'connecting' } : s) || []
				);
				
				const result = await connectToMCPServer(localStorage.token, server.id);
				if (result.success) {
					mcpServers.update(servers => 
						servers?.map(s => s.id === server.id ? { ...s, status: 'connected' } : s) || []
					);
					
					// Update settings to add this server to enabled list
					if ($settings) {
						if (!$settings.enabledMcpServers) {
							$settings.enabledMcpServers = [];
						}
						
						if (!$settings.enabledMcpServers.includes(server.id)) {
							$settings.enabledMcpServers = [...$settings.enabledMcpServers, server.id];
							settings.set({...$settings});
							
							// Save to backend
							await updateUserSettings(localStorage.token, { ui: $settings });
						}
					}
					
					toast.success($i18n.t('Connected to MCP server'));
				} else {
					throw new Error('Failed to connect');
				}
			}
		} catch (error) {
			console.error('Error toggling connection:', error);
			mcpServers.update(servers => 
				servers?.map(s => s.id === server.id ? { ...s, status: 'error' } : s) || []
			);
			toast.error($i18n.t('Error connecting to MCP server'));
		}
	};
	
	const handleEdit = (server) => {
		dispatch('edit', server);
	};
	
	const handleDelete = async () => {
		if (!serverToDelete) return;
		
		try {
			const result = await deleteMCPServer(localStorage.token, serverToDelete.id);
			if (result.success) {
				mcpServers.update(servers => 
					servers?.filter(s => s.id !== serverToDelete.id) || []
				);
				
				// Also remove from enabled servers in settings
				if ($settings && $settings.enabledMcpServers) {
					$settings.enabledMcpServers = $settings.enabledMcpServers.filter(id => id !== serverToDelete.id);
					settings.set({...$settings});
					
					// Save to backend
					await updateUserSettings(localStorage.token, { ui: $settings });
				}
				
				toast.success($i18n.t('MCP server deleted successfully'));
				serverToDelete = null;
				showDeleteConfirm = false;
			} else {
				throw new Error('Failed to delete server');
			}
		} catch (error) {
			console.error('Error deleting server:', error);
			toast.error($i18n.t('Error deleting MCP server'));
		}
	};
	
	const confirmDelete = (server) => {
		serverToDelete = server;
		showDeleteConfirm = true;
	};
	
	const viewLogs = (server) => {
		selectedServerForLogs = server.id;
		showLogs = true;
	};
	
	const checkStatus = async (server) => {
		try {
			toast.info($i18n.t('Checking server status...'));
			
			// Mock status check for now
			setTimeout(() => {
				if (server.status === 'connected') {
					toast.success($i18n.t('Server is running properly'));
				} else {
					toast.error($i18n.t('Server is not running or has issues'));
				}
			}, 1000);
		} catch (error) {
			console.error('Error checking server status:', error);
			toast.error($i18n.t('Error checking server status'));
		}
	};
</script>

{#if servers.length === 0}
	<div class="flex flex-col items-center justify-center py-8 text-gray-500">
		<div class="text-lg font-medium">{$i18n.t('No MCP Servers Found')}</div>
		<div class="text-sm">{$i18n.t('Add an MCP server to get started')}</div>
	</div>
{:else}
	{#each servers as server (server.id)}
		<div class="flex space-x-4 w-full px-3 py-2 dark:hover:bg-white/5 hover:bg-black/5 rounded-xl">
			<div class="flex flex-1 space-x-3.5 w-full">
				<div class="flex items-center text-left flex-1">
					<div class="flex-1 self-center pl-1">
						<div class="font-semibold flex items-center gap-1.5">
							<div class="line-clamp-1">
								{server.name}
							</div>
							
							<div class="text-xs font-bold px-1 rounded-sm uppercase line-clamp-1 bg-gray-500/20 text-gray-700 dark:text-gray-200">
								{server.type}
							</div>
							
							<div 
								class="text-xs font-bold px-1 rounded-sm uppercase line-clamp-1 {server.status === 'connected' 
									? 'bg-green-500/20 text-green-700 dark:text-green-200' 
									: server.status === 'connecting' 
										? 'bg-blue-500/20 text-blue-700 dark:text-blue-200'
										: server.status === 'error'
											? 'bg-red-500/20 text-red-700 dark:text-red-200'
											: 'bg-gray-500/20 text-gray-700 dark:text-gray-200'}"
							>
								{server.status}
							</div>
						</div>

						<div class="flex gap-1.5 px-1">
							<div class="text-gray-500 text-xs font-medium shrink-0">{server.id}</div>
							<div class="text-xs overflow-hidden text-ellipsis line-clamp-1">
								{server.description || (server.command && server.args 
									? `${server.command} ${server.args.join(' ')}` 
									: server.url || '')}
							</div>
						</div>
					</div>
				</div>
			</div>
			
			<div class="flex flex-row gap-0.5 self-center">
				<Tooltip content={$i18n.t('View Logs')}>
					<button
						class="self-center w-fit text-sm px-2 py-2 dark:text-gray-300 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-xl"
						type="button"
						on:click={() => viewLogs(server)}
					>
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
							<path stroke-linecap="round" stroke-linejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h9.75m4.5-4.5v12m0 0-3.75-3.75M17.25 21 21 17.25" />
						</svg>
					</button>
				</Tooltip>
				
				<Tooltip content={$i18n.t('Check Status')}>
					<button
						class="self-center w-fit text-sm px-2 py-2 dark:text-gray-300 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-xl"
						type="button"
						on:click={() => checkStatus(server)}
					>
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
							<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
						</svg>
					</button>
				</Tooltip>
				
				<Tooltip content={$i18n.t('Edit')}>
					<button
						class="self-center w-fit text-sm px-2 py-2 dark:text-gray-300 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-xl"
						type="button"
						on:click={() => handleEdit(server)}
					>
						<Gear />
					</button>
				</Tooltip>
				
				<Tooltip content={$i18n.t('Delete')}>
					<button
						class="self-center w-fit text-sm px-2 py-2 dark:text-gray-300 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-xl"
						type="button"
						on:click={() => confirmDelete(server)}
					>
						<GarbageBin />
					</button>
				</Tooltip>
				
				<div class="self-center mx-1 {(server.status === 'connecting' || server.status === 'disconnecting') ? 'opacity-50 cursor-not-allowed' : ''}">
					<Tooltip content={server.status === 'connected' ? $i18n.t('Connected') : $i18n.t('Disconnected')}>
						<div on:click={() => toggleConnection(server)}>
							<Switch
								state={server.status === 'connected'}
								on:change={() => {
									// The actual toggle logic is handled by the onClick of the parent div
								}}
							/>
						</div>
					</Tooltip>
				</div>
			</div>
		</div>
	{/each}
{/if}

<DeleteConfirmDialog
	bind:show={showDeleteConfirm}
	title={$i18n.t('Delete MCP server?')}
	on:confirm={handleDelete}
>
	<div class="text-sm text-gray-500">
		{#if serverToDelete}
			{$i18n.t('This will delete')} <span class="font-semibold">{serverToDelete.name}</span>.
			{#if serverToDelete.status === 'connected'}
			<div class="mt-2 text-red-500 font-medium">
				{$i18n.t('Warning: This server is currently connected. Deleting it will disconnect it first.')}
			</div>
			{/if}
		{/if}
	</div>
</DeleteConfirmDialog>

<MCPServerLogs 
	bind:show={showLogs}
	serverId={selectedServerForLogs}
/>
