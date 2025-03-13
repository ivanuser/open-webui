<script lang="ts">
	import { getContext } from 'svelte';
	
	const i18n = getContext('i18n');
</script>

<div class="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 p-4 rounded-lg mb-4">
	<h3 class="font-medium">{$i18n.t('MCP Connection Status')}</h3>
	<p class="text-sm mt-1">
		{$i18n.t('The MCP Connector allows you to connect to MCP servers to extend the capabilities of Open WebUI.')}
	</p>
	<div class="mt-2 text-xs border-t border-blue-200 dark:border-blue-700 pt-2">
		{$i18n.t('Status')}: <span class="font-semibold">{$i18n.t('Ready to connect')}</span>
	</div>
</div>
