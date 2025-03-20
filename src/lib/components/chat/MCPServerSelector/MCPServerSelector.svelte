<!-- MCP Server Selector Component -->
<script>
	import { onMount, createEventDispatcher } from 'svelte';
	import { settings, mcpServers } from '$lib/stores';
	import { get } from 'svelte/store';
	
	export let connectedServers = [];
	export let activeServer = null;
	
	const dispatch = createEventDispatcher();
	let allServers = [];
	
	onMount(() => {
		// Load servers from the store
		const unsubscribe = mcpServers.subscribe(servers => {
			if (servers && servers.length > 0) {
				allServers = servers;
				connectedServers = servers.filter(server => server.status === 'connected');
				
				// Set active server from settings if available
				const currentSettings = get(settings);
				if (currentSettings && currentSettings.defaultMcpServer) {
					activeServer = connectedServers.find(
						server => server.id === currentSettings.defaultMcpServer
					);
				}
				
				// If no active server but we have connected servers, use the first one
				if (!activeServer && connectedServers.length > 0) {
					activeServer = connectedServers[0];
					
					// Update settings with the active server
					if (currentSettings) {
						currentSettings.defaultMcpServer = activeServer.id;
						settings.set(currentSettings);
						localStorage.setItem('userSettings', JSON.stringify(currentSettings));
						
						// Log for debugging
						console.log('Settings updated on backend:', currentSettings);
					}
				}
			}
		});
		
		return () => {
			unsubscribe();
		};
	});
	
	function handleServerChange(event) {
		const serverId = event.target.value;
		activeServer = connectedServers.find(server => server.id === serverId);
		
		// Update settings with the new active server
		const currentSettings = get(settings);
		if (currentSettings) {
			currentSettings.defaultMcpServer = activeServer?.id || null;
			settings.set(currentSettings);
			localStorage.setItem('userSettings', JSON.stringify(currentSettings));
		}
		
		// Notify parent component
		dispatch('change', activeServer);
	}
</script>

<div class="relative">
	<select
		class="block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-800 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-xs px-2 py-1"
		on:change={handleServerChange}
		value={activeServer?.id}
		title="Select MCP Server"
	>
		{#if connectedServers.length === 0}
			<option value="" disabled selected>No MCP Servers Connected</option>
		{:else}
			<option value="" disabled selected={!activeServer}>Select MCP Server</option>
			{#each connectedServers as server}
				<option value={server.id} selected={activeServer?.id === server.id}>
					{server.name} ({server.type})
				</option>
			{/each}
		{/if}
	</select>
</div>
