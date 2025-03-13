<script lang="ts">
	import { getContext } from 'svelte';
	import { mcpServers } from '$lib/stores';
	
	const i18n = getContext('i18n');
	
	// Initialize mcpServers if not already initialized
	if (!$mcpServers) {
		mcpServers.set([]);
	}
	
	$: connectedServers = $mcpServers?.filter(server => server.status === 'connected') || [];
	$: totalServers = $mcpServers?.length || 0;
	$: serverStatus = connectedServers.length > 0 
		? $i18n.t('Connected to {{count}} servers', { count: connectedServers.length })
		: $i18n.t('Ready to connect');
</script>

<div class="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 p-4 rounded-lg mb-4">
	<h3 class="font-medium">{$i18n.t('MCP Connection Status')}</h3>
	<p class="text-sm mt-1">
		{$i18n.t('The MCP Connector allows you to connect to MCP servers to extend the capabilities of Open WebUI.')}
	</p>
	<div class="mt-2 text-xs border-t border-blue-200 dark:border-blue-700 pt-2">
		{$i18n.t('Status')}: <span class="font-semibold">{serverStatus}</span>
		{#if totalServers > 0}
			<span class="ml-2">({connectedServers.length}/{totalServers} {$i18n.t('servers')})</span>
		{/if}
	</div>
	
	{#if connectedServers.length > 0}
		<div class="mt-2 text-xs">
			<div class="font-medium mb-1">{$i18n.t('Connected Servers')}:</div>
			<ul class="list-disc list-inside">
				{#each connectedServers as server}
					<li>{server.name} <span class="text-blue-500">({server.type})</span></li>
				{/each}
			</ul>
		</div>
	{/if}
</div>
