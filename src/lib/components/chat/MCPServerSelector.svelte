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

	const saveDefaultServer = async () => {
		if (!selectedServer) {
			toast.error($i18n.t('Choose an MCP server before saving...'));
			return;
		}
		
		// Update the settings
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
		if ($settings.enabledMcpServers && $settings.enabledMcpServers.length > 0 && !selectedServer) {
			selectedServer = $settings.enabledMcpServers[0];
		}
	});
</script>

<div class="flex flex-col w-full items-start">
	<div class="flex w-full max-w-fit">
		<div class="overflow-hidden w-full">
			<div class="mr-1 max-w-full">
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
</div>

{#if showSetDefault}
	<div class="absolute text-left mt-[1px] ml-1 text-[0.7rem] text-gray-500 font-primary">
		<button on:click={saveDefaultServer}>{$i18n.t('Set as default')}</button>
	</div>
{/if}
