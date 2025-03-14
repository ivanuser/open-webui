<script lang="ts">
	import { toast } from 'svelte-sonner';
	import { WEBUI_NAME, mcpServers, settings } from '$lib/stores';
	import { onMount, getContext } from 'svelte';
	import MCPServerList from './MCP/MCPServerList.svelte';
	import MCPConnectionStatus from './MCP/MCPConnectionStatus.svelte';
	import MCPServerModal from './MCP/MCPServerModal.svelte';
	import MCPDashboard from './MCP/MCPDashboard.svelte';
	import Tabs from '../common/Tabs.svelte';
	import Plus from '../icons/Plus.svelte';
	import Search from '../icons/Search.svelte';
	import { getMCPServers } from '$lib/apis/mcp';
	import { updateUserSettings } from '$lib/apis/users';
	
	const i18n = getContext('i18n');
	
	let query = '';
	let showAddModal = false;
	let selectedServer = null;
	let isEditing = false;
	let activeTab = 0;
	
	// Initialize mcpServers if not already initialized
	if (!$mcpServers) {
		mcpServers.set([]);
	}
	
	// Filter servers based on search query
	$: filteredServers = $mcpServers?.filter(
		(server) => 
			query === '' || 
			server.name.toLowerCase().includes(query.toLowerCase()) ||
			server.type.toLowerCase().includes(query.toLowerCase()) ||
			(server.description && server.description.toLowerCase().includes(query.toLowerCase()))
	) || [];
	
	onMount(async () => {
		try {
			// Fetch MCP servers
			const servers = await getMCPServers(localStorage.token);
			mcpServers.set(servers);
			
			// Set up enabled servers in settings based on the connected servers
			if ($settings) {
				// Initialize enabledMcpServers if necessary
				if (!$settings.enabledMcpServers) {
					$settings.enabledMcpServers = [];
				}
				
				// Get servers that should be connected based on settings
				const enabledServerIds = $settings.enabledMcpServers || [];
				if (enabledServerIds.length > 0) {
					// Update server status based on enabled servers in settings
					const updatedServers = servers.map(server => {
						if (enabledServerIds.includes(server.id)) {
							return { ...server, status: 'connected' };
						}
						return server;
					});
					
					// Update the mcpServers store
					mcpServers.set(updatedServers);
					
					// Save to localStorage
					if (typeof localStorage !== 'undefined') {
						localStorage.setItem('mcpServers', JSON.stringify(updatedServers));
					}
				}
			}
		} catch (error) {
			console.error('Error fetching MCP servers:', error);
			toast.error($i18n.t('Failed to fetch MCP servers'));
			mcpServers.set([]);
		}
	});

	const handleAddServer = () => {
		selectedServer = null;
		isEditing = false;
		showAddModal = true;
	};

	const handleEditServer = (server) => {
		selectedServer = server;
		isEditing = true;
		showAddModal = true;
	};

	const handleServerAdded = async (event) => {
		const newServer = event.detail;
		mcpServers.update(servers => [...(servers || []), newServer]);
		
		// Save to localStorage
		if (typeof localStorage !== 'undefined' && $mcpServers) {
			localStorage.setItem('mcpServers', JSON.stringify($mcpServers));
		}
		
		showAddModal = false;
		toast.success(isEditing 
			? $i18n.t('MCP server updated successfully') 
			: $i18n.t('MCP server added successfully'));
	};

	const handleServerUpdated = async (event) => {
		const updatedServer = event.detail;
		mcpServers.update(servers => 
			servers?.map(server => server.id === updatedServer.id ? updatedServer : server) || []
		);
		
		// Save to localStorage
		if (typeof localStorage !== 'undefined' && $mcpServers) {
			localStorage.setItem('mcpServers', JSON.stringify($mcpServers));
		}
		
		showAddModal = false;
		toast.success($i18n.t('MCP server updated successfully'));
	};
</script>

<svelte:head>
	<title>
		{$i18n.t('MCP')} | {$WEBUI_NAME}
	</title>
</svelte:head>

<div class="flex flex-col gap-1 mt-1.5 mb-2">
	<div class="flex justify-between items-center">
		<div class="flex md:self-center text-xl items-center font-medium px-0.5">
			{$i18n.t('MCP')}
			<div class="flex self-center w-[1px] h-6 mx-2.5 bg-gray-50 dark:bg-gray-850" />
			<span class="text-base font-lg text-gray-500 dark:text-gray-300">{filteredServers.length}</span>
		</div>
	</div>

	<div class="flex w-full space-x-2 mb-4">
		<div class="flex flex-1">
			<div class="self-center ml-1 mr-3">
				<Search className="size-3.5" />
			</div>
			<input
				class="w-full text-sm pr-4 py-1 rounded-r-xl outline-hidden bg-transparent"
				bind:value={query}
				placeholder={$i18n.t('Search MCP Servers')}
			/>
		</div>

		<div>
			<button
				class="px-2 py-2 rounded-xl hover:bg-gray-700/10 dark:hover:bg-gray-100/10 dark:text-gray-300 dark:hover:text-white transition font-medium text-sm flex items-center space-x-1"
				on:click={handleAddServer}
			>
				<Plus className="size-3.5" />
			</button>
		</div>
	</div>
	
	<Tabs bind:activeTab tabs={[$i18n.t('Servers'), $i18n.t('Dashboard')]} />
</div>

<div class="mt-4">
	{#if activeTab === 0}
		<MCPConnectionStatus />
		<MCPServerList 
			servers={filteredServers} 
			on:edit={event => handleEditServer(event.detail)}
		/>
		
		<div class="flex justify-end w-full mt-4 mb-2">
			<div class="flex space-x-2">
				<button
					class="flex text-xs items-center space-x-1 px-3 py-1.5 rounded-xl bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200 transition"
					on:click={handleAddServer}
				>
					<div class="self-center mr-2 font-medium line-clamp-1">{$i18n.t('Add MCP Server')}</div>
				</button>
			</div>
		</div>
	{:else if activeTab === 1}
		<MCPDashboard servers={$mcpServers || []} />
	{/if}
</div>

{#if showAddModal}
	<MCPServerModal 
		bind:show={showAddModal} 
		server={selectedServer}
		{isEditing}
		on:add={handleServerAdded}
		on:update={handleServerUpdated}
	/>
{/if}
