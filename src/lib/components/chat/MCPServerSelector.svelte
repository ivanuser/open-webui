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
		
		// Update the settings
		if (!$settings) {
			$settings = {};
		}
		
		if (!$settings.enabledMcpServers) {
			$settings.enabledMcpServers = [];
		}
		
		if (!$settings.enabledMcpServers.includes(selectedServer)) {
			$settings.enabledMcpServers = [...$settings.enabledMcpServers, selectedServer];
		}
		
		settings.set($settings);
		await updateUserSettings(localStorage.token, { ui: $settings });

		toast.success($i18n.t('Default MCP server updated'));
	};
	
	onMount(async () => {
		// Check if we need to fetch MCP servers
		if (!$mcpServers || $mcpServers.length === 0) {
			try {
				const servers = await getMCPServers(localStorage.token);
				mcpServers.set(servers);
			} catch (error) {
				console.error('Error fetching MCP servers in chat:', error);
			}
		}
		
		// Set the default server from settings if available
		if ($settings?.enabledMcpServers && $settings.enabledMcpServers.length > 0 && !selectedServer) {
			selectedServer = $settings.enabledMcpServers[0];
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
