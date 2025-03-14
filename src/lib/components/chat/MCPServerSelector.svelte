<script lang="ts">
	import { mcpServers, settings } from '$lib/stores';
	import { onMount, getContext } from 'svelte';
	import { toast } from 'svelte-sonner';
	import Selector from './MCPServerSelector/Selector.svelte';
	import Tooltip from '../common/Tooltip.svelte';
	import { updateUserSettings } from '$lib/apis/users';
	import { getMCPServers } from '$lib/apis/mcp';

	const i18n = getContext('i18n');

	export let selectedServer = '';
	export let disabled = false;
	export let showSetDefault = true;
	
	// Initialize mcpServers if not already initialized
	if (!$mcpServers) {
		mcpServers.set([]);
	}

	const saveDefaultServer = async () => {
		if (!selectedServer) {
			toast.error($i18n.t('Choose an MCP server before saving...'));
			return;
		}
		
		try {
			// Update the settings - create a new settings object to ensure a clean update
			const updatedSettings = { ...$settings } || {};
			
			// Make sure enabledMcpServers is an array
			if (!updatedSettings.enabledMcpServers) {
				updatedSettings.enabledMcpServers = [];
			}
			
			// Make sure the selected server is in the enabled servers list
			if (!updatedSettings.enabledMcpServers.includes(selectedServer)) {
				updatedSettings.enabledMcpServers.push(selectedServer);
			}
			
			// Set the default MCP server
			updatedSettings.defaultMcpServer = selectedServer;
			
			// Update the store
			settings.set(updatedSettings);
			
			// Save to localStorage for immediate persistence
			if (typeof localStorage !== 'undefined') {
				localStorage.setItem('userSettings', JSON.stringify(updatedSettings));
			}
			
			// Update on the backend
			const result = await updateUserSettings(localStorage.token, { ui: updatedSettings });
			console.log('Settings updated on backend:', result);

			toast.success($i18n.t('Default MCP server updated'));
		} catch (error) {
			console.error('Error saving default MCP server:', error);
			toast.error($i18n.t('Failed to save default server. Please try again.'));
		}
	};
	
	onMount(async () => {
		// Check if we need to fetch MCP servers
		if (!$mcpServers || $mcpServers.length === 0) {
			try {
				const servers = await getMCPServers(localStorage.token);
				
				// Make sure to persist the servers to localStorage immediately
				if (typeof localStorage !== 'undefined' && servers) {
					localStorage.setItem('mcpServers', JSON.stringify(servers));
				}
				
				mcpServers.set(servers);
			} catch (error) {
				console.error('Error fetching MCP servers in chat:', error);
			}
		}
		
		// First try to get the default server
		if ($settings?.defaultMcpServer && !selectedServer) {
			// Verify the default server exists and is connected
			const defaultServer = $mcpServers?.find(s => s.id === $settings.defaultMcpServer);
			if (defaultServer && defaultServer.status === 'connected') {
				selectedServer = $settings.defaultMcpServer;
			} 
			// If default server exists but isn't connected, try to connect to it
			else if (defaultServer) {
				selectedServer = $settings.defaultMcpServer;
				console.log('Default server exists but is not connected:', selectedServer);
			}
		}
		// If no default is set, try to get the first enabled server
		else if ($settings?.enabledMcpServers && $settings.enabledMcpServers.length > 0 && !selectedServer) {
			// Find the first enabled server that's also connected
			const connectedEnabledServer = $mcpServers?.find(
				s => $settings.enabledMcpServers.includes(s.id) && s.status === 'connected'
			);
			
			if (connectedEnabledServer) {
				selectedServer = connectedEnabledServer.id;
			} else {
				// If no enabled and connected servers, just use the first enabled one
				selectedServer = $settings.enabledMcpServers[0];
			}
		}
		
		// If we have a selected server, verify it exists in the mcpServers list
		if (selectedServer && $mcpServers) {
			const serverExists = $mcpServers.some(s => s.id === selectedServer);
			if (!serverExists) {
				// Reset the selection if the server no longer exists
				selectedServer = '';
				
				// Also update settings if we're removing the default server
				if ($settings?.defaultMcpServer === selectedServer) {
					const updatedSettings = { ...$settings };
					updatedSettings.defaultMcpServer = null;
					settings.set(updatedSettings);
					
					// Also update localStorage and backend
					if (typeof localStorage !== 'undefined') {
						localStorage.setItem('userSettings', JSON.stringify(updatedSettings));
					}
					await updateUserSettings(localStorage.token, { ui: updatedSettings });
				}
			}
		}
	});
</script>

<div class="flex flex-col w-full items-start">
	<div class="flex w-full">
		<div class="w-full">
			<Selector
				id="mcp-server"
				placeholder={$i18n.t('Select MCP Server')}
				bind:value={selectedServer}
				on:select={(event) => {
					const server = event.detail.server;
					// Ensure the server is connected if it was selected
					if (server.status !== 'connected') {
						toast.info($i18n.t('Connect to the MCP server to use it'));
					}
				}}
			/>
		</div>
	</div>
</div>

{#if showSetDefault && selectedServer}
	<div class="flex justify-start w-full mt-2">
		<button 
			on:click={saveDefaultServer}
			class="text-xs px-2 py-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
		>
			{$i18n.t('Set as default')}
		</button>
	</div>
{/if}
