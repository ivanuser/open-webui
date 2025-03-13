<script lang="ts">
	import { getContext } from 'svelte';
	import { toast } from 'svelte-sonner';
	import EllipsisHorizontal from '../../icons/EllipsisHorizontal.svelte';
	import Switch from '../../common/Switch.svelte';
	import Tooltip from '../../common/Tooltip.svelte';
	
	const i18n = getContext('i18n');
	
	export let servers = [];
	
	// Handle connect/disconnect
	const toggleConnection = (server) => {
		if (server.status === 'connected') {
			// Disconnect logic
			server.status = 'disconnected';
			toast.success($i18n.t('Disconnected from MCP server'));
		} else {
			// Connect logic
			server.status = 'connecting';
			setTimeout(() => {
				server.status = 'connected';
				toast.success($i18n.t('Connected to MCP server'));
			}, 1000);
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
								{server.status}
							</div>
						</div>

						<div class="flex gap-1.5 px-1">
							<div class="text-gray-500 text-xs font-medium shrink-0">{server.id}</div>
							<div class="text-xs overflow-hidden text-ellipsis line-clamp-1">
								{server.url}
							</div>
						</div>
					</div>
				</div>
			</div>
			
			<div class="flex flex-row gap-0.5 self-center">
				<button
					class="self-center w-fit text-sm p-1.5 dark:text-gray-300 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-xl"
					type="button"
				>
					<EllipsisHorizontal className="size-5" />
				</button>
				
				<div class="self-center mx-1">
					<Tooltip content={server.status === 'connected' ? $i18n.t('Connected') : $i18n.t('Disconnected')}>
						<Switch
							state={server.status === 'connected'}
							on:change={() => toggleConnection(server)}
						/>
					</Tooltip>
				</div>
			</div>
		</div>
	{/each}
{/if}
