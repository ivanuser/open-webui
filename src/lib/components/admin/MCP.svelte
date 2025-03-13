<script lang="ts">
	import { toast } from 'svelte-sonner';
	import { WEBUI_NAME } from '$lib/stores';
	import { onMount, getContext } from 'svelte';
	import MCPServerList from './MCP/MCPServerList.svelte';
	import MCPConnectionStatus from './MCP/MCPConnectionStatus.svelte';
	import Plus from '../icons/Plus.svelte';
	import Search from '../icons/Search.svelte';
	
	const i18n = getContext('i18n');
	
	let query = '';
	let servers = []; // This will store the list of MCP servers
	
	// Filter servers based on search query
	$: filteredServers = servers.filter(
		(server) => query === '' || 
		server.name.toLowerCase().includes(query.toLowerCase()) ||
		server.url.toLowerCase().includes(query.toLowerCase())
	);
	
	onMount(async () => {
		// Initialize with sample data for now
		// Later this will be replaced with actual API calls
		servers = [
			{
				id: 'server1',
				name: 'MCP Server 1',
				url: 'https://mcp-server-1.example.com',
				status: 'disconnected'
			}
		];
	});
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

	<div class="flex w-full space-x-2">
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
				on:click={() => {
					toast.info($i18n.t('Add MCP Server feature coming soon'));
				}}
			>
				<Plus className="size-3.5" />
			</button>
		</div>
	</div>
</div>

<div class="mb-5">
	<MCPConnectionStatus />
	<MCPServerList servers={filteredServers} />
</div>

<div class="flex justify-end w-full mb-2">
	<div class="flex space-x-2">
		<button
			class="flex text-xs items-center space-x-1 px-3 py-1.5 rounded-xl bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200 transition"
			on:click={() => {
				toast.info($i18n.t('MCP Connection feature coming soon'));
			}}
		>
			<div class="self-center mr-2 font-medium line-clamp-1">{$i18n.t('Connect to MCP Server')}</div>
		</button>
	</div>
</div>
