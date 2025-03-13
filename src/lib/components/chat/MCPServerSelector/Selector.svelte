<script lang="ts">
	import { DropdownMenu } from 'bits-ui';
	import { flyAndScale } from '$lib/utils/transitions';
	import { createEventDispatcher, onMount, getContext } from 'svelte';
	import ChevronDown from '$lib/components/icons/ChevronDown.svelte';
	import Check from '$lib/components/icons/Check.svelte';
	import Search from '$lib/components/icons/Search.svelte';
	import { mcpServers, settings, mobile, config } from '$lib/stores';
	import { toast } from 'svelte-sonner';
	import { connectToMCPServer, disconnectFromMCPServer } from '$lib/apis/mcp';
	import Tooltip from '$lib/components/common/Tooltip.svelte';
	import Switch from '$lib/components/common/Switch.svelte';

	const i18n = getContext('i18n');
	const dispatch = createEventDispatcher();

	export let id = '';
	export let value = '';
	export let placeholder = $i18n.t('Select MCP Server');
	export let searchEnabled = true;
	export let searchPlaceholder = $i18n.t('Search MCP Servers');
	export let className = 'w-[32rem]';
	export let triggerClassName = 'text-lg';

	let show = false;
	let searchValue = '';
	let selectedServerIdx = 0;

	$: items = $mcpServers?.map(server => ({
		value: server.id,
		label: server.name,
		server
	})) || [];

	$: filteredItems = searchValue
		? items.filter(
				item =>
					item.label.toLowerCase().includes(searchValue.toLowerCase()) ||
					item.server.type.toLowerCase().includes(searchValue.toLowerCase()) ||
					(item.server.description && 
						item.server.description.toLowerCase().includes(searchValue.toLowerCase()))
			)
		: items;
		
	$: selectedServer = filteredItems.find(item => item.value === value);

	const toggleConnection = async (serverId, currentStatus) => {
		try {
			if (currentStatus === 'connected') {
				// Disconnect logic
				const result = await disconnectFromMCPServer(localStorage.token, serverId);
				if (result.success) {
					mcpServers.update(servers => 
						servers?.map(s => s.id === serverId ? { ...s, status: 'disconnected' } : s) || []
					);
					toast.success($i18n.t('Disconnected from MCP server'));
				} else {
					throw new Error('Failed to disconnect');
				}
			} else {
				// Connect logic
				mcpServers.update(servers => 
					servers?.map(s => s.id === serverId ? { ...s, status: 'connecting' } : s) || []
				);
				
				const result = await connectToMCPServer(localStorage.token, serverId);
				if (result.success) {
					mcpServers.update(servers => 
						servers?.map(s => s.id === serverId ? { ...s, status: 'connected' } : s) || []
					);
					
					// Update settings to include this server
					if (!$settings.enabledMcpServers) {
						$settings.enabledMcpServers = [];
					}
					
					if (!$settings.enabledMcpServers.includes(serverId)) {
						$settings.enabledMcpServers = [...$settings.enabledMcpServers, serverId];
					}
					
					toast.success($i18n.t('Connected to MCP server'));
				} else {
					throw new Error('Failed to connect');
				}
			}
		} catch (error) {
			console.error('Error toggling connection:', error);
			mcpServers.update(servers => 
				servers?.map(s => s.id === serverId ? { ...s, status: 'error' } : s) || []
			);
			toast.error($i18n.t('Error connecting to MCP server'));
		}
	};
</script>

<DropdownMenu.Root
	bind:open={show}
	onOpenChange={async () => {
		searchValue = '';
		selectedServerIdx = 0;
		window.setTimeout(() => document.getElementById('mcp-search-input')?.focus(), 0);
	}}
	closeFocus={false}
>
	<DropdownMenu.Trigger
		class="relative w-full font-primary"
		aria-label={placeholder}
		id="mcp-selector-{id}-button"
	>
		<div
			class="flex w-full text-left px-0.5 outline-hidden bg-transparent truncate {triggerClassName} justify-between font-medium placeholder-gray-400 focus:outline-hidden"
		>
			{#if selectedServer}
				{selectedServer.label}
			{:else}
				{placeholder}
			{/if}
			<ChevronDown className="self-center ml-2 size-3" strokeWidth="2.5" />
		</div>
	</DropdownMenu.Trigger>

	<DropdownMenu.Content
		class="z-40 {$mobile ? `w-full` : `${className}`} max-w-[calc(100vw-1rem)] justify-start rounded-xl bg-white dark:bg-gray-850 dark:text-white shadow-lg outline-hidden"
		transition={flyAndScale}
		side={$mobile ? 'bottom' : 'bottom-start'}
		sideOffset={3}
	>
		<slot>
			{#if searchEnabled}
				<div class="flex items-center gap-2.5 px-5 mt-3.5 mb-1.5">
					<Search className="size-4" strokeWidth="2.5" />

					<input
						id="mcp-search-input"
						bind:value={searchValue}
						class="w-full text-sm bg-transparent outline-hidden"
						placeholder={searchPlaceholder}
						autocomplete="off"
						on:keydown={(e) => {
							if (e.code === 'Enter' && filteredItems.length > 0) {
								value = filteredItems[selectedServerIdx].value;
								show = false;
								return;
							} else if (e.code === 'ArrowDown') {
								selectedServerIdx = Math.min(selectedServerIdx + 1, filteredItems.length - 1);
							} else if (e.code === 'ArrowUp') {
								selectedServerIdx = Math.max(selectedServerIdx - 1, 0);
							} else {
								selectedServerIdx = 0;
							}

							const item = document.querySelector(`[data-arrow-selected="true"]`);
							item?.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' });
						}}
					/>
				</div>
			{/if}

			<div class="px-3 mb-2 max-h-64 overflow-y-auto scrollbar-hidden group relative">
				{#if filteredItems.length === 0}
					<div class="block px-3 py-2 text-sm text-gray-700 dark:text-gray-100">
						{$i18n.t('No MCP servers found')}
					</div>
					
					<div class="block px-3 py-2 text-sm text-gray-500">
						{$i18n.t('Add an MCP server in the admin panel to get started')}
					</div>
				{:else}
					{#each filteredItems as item, index}
						<div
							class="flex w-full text-left font-medium line-clamp-1 select-none items-center rounded-button py-2 pl-3 pr-1.5 text-sm text-gray-700 dark:text-gray-100 outline-hidden transition-all duration-75 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg cursor-pointer data-highlighted:bg-muted {index === selectedServerIdx ? 'bg-gray-100 dark:bg-gray-800 group-hover:bg-transparent' : ''}"
							data-arrow-selected={index === selectedServerIdx}
						>
							<button
								class="flex flex-col flex-1"
								on:click={() => {
									value = item.value;
									selectedServerIdx = index;
									dispatch('select', item);
									show = false;
								}}
							>
								<div class="flex items-center gap-2">
									<div class="flex items-center min-w-fit">
										<div class="line-clamp-1">
											<div class="flex items-center min-w-fit">
												<Tooltip content={item.server.type} placement="top-start">
													<div class="text-xs font-bold px-1 rounded-sm uppercase line-clamp-1 bg-gray-500/20 text-gray-700 dark:text-gray-200 mr-2">
														{item.server.type}
													</div>
												</Tooltip>
												{item.label}
											</div>
										</div>
									</div>

									<div 
										class="text-xs font-bold px-1 rounded-sm uppercase line-clamp-1 {item.server.status === 'connected' 
											? 'bg-green-500/20 text-green-700 dark:text-green-200' 
											: item.server.status === 'connecting' 
												? 'bg-blue-500/20 text-blue-700 dark:text-blue-200'
												: item.server.status === 'error'
													? 'bg-red-500/20 text-red-700 dark:text-red-200'
													: 'bg-gray-500/20 text-gray-700 dark:text-gray-200'}"
									>
										{item.server.status}
									</div>
								</div>

								{#if item.server.description}
									<div class="text-xs text-gray-500 line-clamp-1 mt-0.5">
										{item.server.description}
									</div>
								{/if}
							</button>

							{#if value === item.value}
								<div class="ml-auto pl-2">
									<Check />
								</div>
							{/if}

							<div class="ml-auto">
								<Switch 
									state={item.server.status === 'connected'} 
									on:change={() => toggleConnection(item.server.id, item.server.status)}
									disabled={item.server.status === 'connecting' || item.server.status === 'disconnecting'} 
								/>
							</div>
						</div>
					{/each}
				{/if}
			</div>

			<div class="flex justify-center py-2 border-t border-gray-100 dark:border-gray-800">
				<a
					href="/admin/mcp"
					class="text-blue-500 hover:text-blue-700 text-sm font-medium"
					on:click={() => {
						show = false;
					}}
				>
					{$i18n.t('Manage MCP Servers')}
				</a>
			</div>

			<div class="hidden w-[42rem]" />
			<div class="hidden w-[32rem]" />
		</slot>
	</DropdownMenu.Content>
</DropdownMenu.Root>
