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
	export let triggerClassName = '';
	
	// Initialize mcpServers if not already initialized
	if (!$mcpServers) {
		mcpServers.set([]);
	}

	let show = false;
	let searchValue = '';
	let selectedServerIdx = 0;
	let processingServer = null;

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
	
	// Make sure the selected server exists in the list
	$: {
		if (value && items.length > 0 && !items.some(item => item.value === value)) {
			console.log(`Selected server ${value} not found in mcpServers list`);
			// Reset selection if server doesn't exist anymore
			value = '';
		}
	}

	const toggleConnection = async (serverId, currentStatus) => {
		// Skip if already in a transitional state or currently processing
		if (processingServer === serverId) {
			return;
		}
		
		const server = $mcpServers.find(s => s.id === serverId);
		if (!server || server.status === 'connecting' || server.status === 'disconnecting') {
			return;
		}
		
		processingServer = serverId;
		
		try {
			if (currentStatus === 'connected') {
				// Disconnect logic
				mcpServers.update(servers => 
					servers?.map(s => s.id === serverId ? { ...s, status: 'disconnecting' } : s) || []
				);
				
				const result = await disconnectFromMCPServer(localStorage.token, serverId);
				if (result.success) {
					mcpServers.update(servers => 
						servers?.map(s => s.id === serverId ? { ...s, status: 'disconnected' } : s) || []
					);
					
					// If this was the selected server, maybe deselect it (since it's now disconnected)
					if (value === serverId) {
						// Only deselect if there's another connected server
						const connectedServer = $mcpServers.find(s => s.status === 'connected');
						if (connectedServer) {
							value = connectedServer.id;
							dispatch('select', { value: connectedServer.id, server: connectedServer });
						}
					}
					
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
					
					// If no server is currently selected, select this one since it's now connected
					if (!value) {
						value = serverId;
						const connectedServer = $mcpServers.find(s => s.id === serverId);
						if (connectedServer) {
							dispatch('select', { value: serverId, server: connectedServer });
						}
					}
					
					// Update settings to include this server
					if (!$settings) {
						$settings = {};
					}
					
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
		} finally {
			processingServer = null;
		}
	};
	
	onMount(() => {
		// Check if the value is set but not valid
		if (value && $mcpServers && !$mcpServers.some(server => server.id === value)) {
			console.log(`Initial server ${value} not found in mcpServers list`);
			// Reset the value if it doesn't exist in the list
			value = '';
		}
		
		// If there's a default server in settings, use it if no value is set
		if (!value && $settings?.defaultMcpServer && $mcpServers?.some(s => s.id === $settings.defaultMcpServer)) {
			value = $settings.defaultMcpServer;
		}
	});
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
		class="relative w-full font-primary border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2"
		aria-label={placeholder}
		id="mcp-selector-{id}-button"
	>
		<div
			class="flex w-full text-left outline-hidden bg-transparent truncate {triggerClassName} justify-between text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-hidden"
		>
			{#if selectedServer}
				<div class="flex items-center">
					{#if selectedServer.server.status === 'connected'}
						<div class="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
					{:else if selectedServer.server.status === 'error'}
						<div class="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
					{:else}
						<div class="w-2 h-2 bg-gray-500 rounded-full mr-2"></div>
					{/if}
					{selectedServer.label}
				</div>
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
								dispatch('select', filteredItems[selectedServerIdx]);
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
							class="flex w-full text-left font-medium line-clamp-1 select-none items-center rounded-button py-2 pl-3 pr-1.5 text-sm text-gray-700 dark:text-gray-100 outline-hidden transition-all duration-75 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg cursor-pointer data-highlighted:bg-muted {index === selectedServerIdx ? 'bg-gray-100 dark:bg-gray-800 group-hover:bg-transparent' : ''} {item.value === value ? 'border-l-2 border-blue-500 dark:border-blue-400' : ''}"
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

							<div class="ml-auto {(item.server.status === 'connecting' || item.server.status === 'disconnecting' || processingServer === item.server.id) ? 'opacity-50 cursor-not-allowed' : ''}">
								<div on:click|stopPropagation={() => toggleConnection(item.server.id, item.server.status)}>
									<Switch 
										state={item.server.status === 'connected'} 
										on:change={() => {
											// The actual toggle logic is handled by the onClick of the parent div
										}}
									/>
								</div>
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
