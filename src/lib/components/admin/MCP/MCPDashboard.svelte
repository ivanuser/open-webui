<script lang="ts">
	import { getContext, onMount, onDestroy } from 'svelte';
	import { toast } from 'svelte-sonner';
	import MCPServerLogs from './MCPServerLogs.svelte';
	import MCPEventDetails from './MCPEventDetails.svelte';
	
	const i18n = getContext('i18n');
	
	export let servers = [];
	
	let selectedServerForLogs = null;
	let showLogs = false;
	let selectedEvent = null;
	let showEventDetails = false;
	let stats = {
		totalRequests: Math.floor(Math.random() * 1000),
		totalErrors: Math.floor(Math.random() * 100),
		averageResponseTime: Math.floor(Math.random() * 500),
		peakMemoryUsage: Math.floor(Math.random() * 500)
	};
	let updateInterval;
	let filterStatus = 'all'; // 'all', 'success', 'warning', 'error'
	let searchQuery = '';
	
	// Generate system events
	let systemEvents = [];
	
	// Generate initial system events
	const generateInitialEvents = () => {
		const events = [];
		const now = new Date();
		const statuses = ['Success', 'Warning', 'Error'];
		const eventTypes = [
			'Connection Established', 
			'Server Started', 
			'Data Request', 
			'API Endpoint Called', 
			'Configuration Changed',
			'Connection Lost',
			'Server Stopped',
			'Memory Warning',
			'Permission Denied',
			'Authentication Failed'
		];
		
		// Generate random events
		for (let i = 0; i < 15; i++) {
			const randomServer = servers[Math.floor(Math.random() * servers.length)] || 
				{name: 'Unknown', type: 'unknown'};
			const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
			const randomEvent = eventTypes[Math.floor(Math.random() * eventTypes.length)];
			const eventTime = new Date(now.getTime() - i * 1000 * 60 * Math.floor(Math.random() * 30));
			
			// Generate error-specific additional info
			let additionalInfo = null;
			if (randomStatus === 'Error') {
				if (randomEvent === 'Connection Established') {
					additionalInfo = 'Error: Connection refused - ECONNREFUSED 127.0.0.1:8080';
				} else if (randomEvent === 'Server Started') {
					additionalInfo = 'Error: Port 8080 already in use';
				} else if (randomEvent === 'Permission Denied') {
					additionalInfo = 'Error: EACCES - Permission denied, path: /var/data/mcp';
				} else if (randomEvent === 'Memory Warning') {
					additionalInfo = 'Error: Memory usage exceeded threshold: 95% (1.9GB/2GB)';
				}
			} else if (randomStatus === 'Warning') {
				if (randomEvent === 'Data Request') {
					additionalInfo = 'Warning: Slow query detected (duration: 5.2s)';
				} else if (randomEvent === 'Memory Warning') {
					additionalInfo = 'Warning: Memory usage approaching threshold: 75% (1.5GB/2GB)';
				} else if (randomEvent === 'API Endpoint Called') {
					additionalInfo = 'Warning: Deprecated API endpoint used: /api/v1/legacy';
				}
			}
			
			events.push({
				id: `event-${i}`,
				time: eventTime.toLocaleString(),
				server: randomServer,
				event: randomEvent,
				status: randomStatus,
				additionalInfo
			});
		}
		
		return events;
	};
	
	// Generate summary chart data
	const generateChartData = () => {
		const hours = [];
		for (let i = 0; i < 24; i++) {
			hours.push(`${i}:00`);
		}
		
		// Generate random data for each server
		return servers.map(server => {
			const data = [];
			for (let i = 0; i < 24; i++) {
				data.push(Math.floor(Math.random() * 100));
			}
			return {
				server,
				data
			};
		});
	};
	
	// Chart data
	let chartData = [];
	
	// Update stats periodically
	onMount(() => {
		chartData = generateChartData();
		systemEvents = generateInitialEvents();
		
		updateInterval = setInterval(() => {
			// Update random stats
			stats = {
				totalRequests: stats.totalRequests + Math.floor(Math.random() * 10),
				totalErrors: stats.totalErrors + Math.floor(Math.random() * 3),
				averageResponseTime: Math.floor(Math.random() * 500),
				peakMemoryUsage: Math.floor(Math.random() * 500)
			};
			
			// Regenerate chart data
			chartData = generateChartData();
			
			// Occasionally add new events
			if (Math.random() > 0.7) {
				const statuses = ['Success', 'Warning', 'Error'];
				const eventTypes = [
					'Connection Established', 
					'Server Started', 
					'Data Request', 
					'API Endpoint Called', 
					'Configuration Changed',
					'Connection Lost',
					'Memory Warning'
				];
				
				const randomServer = servers[Math.floor(Math.random() * servers.length)] || 
					{name: 'Unknown', type: 'unknown'};
				const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
				const randomEvent = eventTypes[Math.floor(Math.random() * eventTypes.length)];
				
				// Add new event at the beginning
				systemEvents = [
					{
						id: `event-${Date.now()}`,
						time: new Date().toLocaleString(),
						server: randomServer,
						event: randomEvent,
						status: randomStatus,
						additionalInfo: null
					},
					...systemEvents.slice(0, 14) // Keep only the most recent 15 events
				];
			}
		}, 10000);
	});
	
	onDestroy(() => {
		if (updateInterval) {
			clearInterval(updateInterval);
		}
	});
	
	// Update chart data when servers change
	$: {
		if (servers.length > 0) {
			chartData = generateChartData();
		}
	}
	
	// Filter events based on status and search query
	$: filteredEvents = systemEvents.filter(event => {
		// Filter by status
		if (filterStatus !== 'all' && event.status.toLowerCase() !== filterStatus) {
			return false;
		}
		
		// Filter by search query
		if (searchQuery && !event.event.toLowerCase().includes(searchQuery.toLowerCase()) && 
			!event.server.name.toLowerCase().includes(searchQuery.toLowerCase())) {
			return false;
		}
		
		return true;
	});
	
	const viewLogs = (server) => {
		selectedServerForLogs = server.id;
		showLogs = true;
	};
	
	const viewEventDetails = (event) => {
		selectedEvent = event;
		showEventDetails = true;
	};
</script>

<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
	<div class="bg-white dark:bg-gray-850 rounded-lg p-4 shadow">
		<h3 class="text-base font-medium mb-2">{$i18n.t('System Overview')}</h3>
		<div class="grid grid-cols-2 gap-3">
			<div class="bg-gray-50 dark:bg-gray-900 p-2 rounded">
				<div class="text-xs text-gray-500">{$i18n.t('Total Requests')}</div>
				<div class="text-xl font-semibold">{stats.totalRequests.toLocaleString()}</div>
			</div>
			<div class="bg-gray-50 dark:bg-gray-900 p-2 rounded">
				<div class="text-xs text-gray-500">{$i18n.t('Total Errors')}</div>
				<div class="text-xl font-semibold">{stats.totalErrors.toLocaleString()}</div>
			</div>
			<div class="bg-gray-50 dark:bg-gray-900 p-2 rounded">
				<div class="text-xs text-gray-500">{$i18n.t('Avg Response Time')}</div>
				<div class="text-xl font-semibold">{stats.averageResponseTime.toLocaleString()} ms</div>
			</div>
			<div class="bg-gray-50 dark:bg-gray-900 p-2 rounded">
				<div class="text-xs text-gray-500">{$i18n.t('Peak Memory Usage')}</div>
				<div class="text-xl font-semibold">{stats.peakMemoryUsage.toLocaleString()} MB</div>
			</div>
		</div>
	</div>
	
	<div class="bg-white dark:bg-gray-850 rounded-lg p-4 shadow">
		<h3 class="text-base font-medium mb-2">{$i18n.t('Server Status')}</h3>
		<div class="grid grid-cols-2 gap-3">
			<div class="bg-gray-50 dark:bg-gray-900 p-2 rounded">
				<div class="text-xs text-gray-500">{$i18n.t('Total Servers')}</div>
				<div class="text-xl font-semibold">{servers.length}</div>
			</div>
			<div class="bg-gray-50 dark:bg-gray-900 p-2 rounded">
				<div class="text-xs text-gray-500">{$i18n.t('Connected')}</div>
				<div class="text-xl font-semibold">{servers.filter(s => s.status === 'connected').length}</div>
			</div>
			<div class="bg-gray-50 dark:bg-gray-900 p-2 rounded">
				<div class="text-xs text-gray-500">{$i18n.t('Server Types')}</div>
				<div class="text-xl font-semibold">{new Set(servers.map(s => s.type)).size}</div>
			</div>
			<div class="bg-gray-50 dark:bg-gray-900 p-2 rounded">
				<div class="text-xs text-gray-500">{$i18n.t('Error States')}</div>
				<div class="text-xl font-semibold">{servers.filter(s => s.status === 'error').length}</div>
			</div>
		</div>
	</div>
</div>

<div class="bg-white dark:bg-gray-850 rounded-lg p-4 shadow mb-4">
	<h3 class="text-base font-medium mb-2">{$i18n.t('Active Servers')}</h3>
	
	{#if servers.filter(s => s.status === 'connected').length === 0}
		<div class="text-center py-8 text-gray-500">
			<div class="text-base">{$i18n.t('No active MCP servers')}</div>
			<div class="text-sm">{$i18n.t('Connect a server to see its status')}</div>
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			{#each servers.filter(s => s.status === 'connected') as server}
				<div class="border border-gray-100 dark:border-gray-800 rounded-lg p-3">
					<div class="flex justify-between items-start">
						<div>
							<div class="font-medium flex items-center gap-1.5">
								{server.name}
								<span class="text-xs font-bold px-1 rounded-sm uppercase bg-gray-500/20 text-gray-700 dark:text-gray-200">
									{server.type}
								</span>
							</div>
							<div class="text-xs text-gray-500 mt-1">{server.description || ''}</div>
						</div>
						<div>
							<span class="text-xs font-bold px-1 py-0.5 rounded-sm bg-green-500/20 text-green-700 dark:text-green-200">
								{$i18n.t('ACTIVE')}
							</span>
						</div>
					</div>
					
					<div class="mt-3">
						<div class="text-xs text-gray-500 font-medium mb-1">{$i18n.t('Statistics')}</div>
						<div class="grid grid-cols-2 gap-2 text-xs">
							<div>
								<span class="text-gray-500">{$i18n.t('Uptime')}:</span>
								<span class="font-medium">{Math.floor(Math.random() * 24)}h {Math.floor(Math.random() * 60)}m</span>
							</div>
							<div>
								<span class="text-gray-500">{$i18n.t('Memory')}:</span>
								<span class="font-medium">{Math.floor(Math.random() * 100)} MB</span>
							</div>
							<div>
								<span class="text-gray-500">{$i18n.t('Requests')}:</span>
								<span class="font-medium">{Math.floor(Math.random() * 1000)}</span>
							</div>
							<div>
								<span class="text-gray-500">{$i18n.t('Errors')}:</span>
								<span class="font-medium">{Math.floor(Math.random() * 10)}</span>
							</div>
						</div>
					</div>
					
					<div class="mt-3 flex justify-end">
						<button 
							class="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
							on:click={() => viewLogs(server)}
						>
							{$i18n.t('View Logs')}
						</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<div class="bg-white dark:bg-gray-850 rounded-lg p-4 shadow">
	<div class="flex justify-between items-center mb-4">
		<h3 class="text-base font-medium">{$i18n.t('System Events')}</h3>
		
		<div class="flex items-center space-x-2">
			<div class="relative">
				<input 
					type="text" 
					class="px-3 py-1 text-sm border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-800"
					placeholder={$i18n.t('Search events...')}
					bind:value={searchQuery}
				/>
			</div>
			
			<select 
				bind:value={filterStatus}
				class="px-3 py-1 text-sm border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-800"
			>
				<option value="all">{$i18n.t('All')}</option>
				<option value="success">{$i18n.t('Success')}</option>
				<option value="warning">{$i18n.t('Warning')}</option>
				<option value="error">{$i18n.t('Error')}</option>
			</select>
		</div>
	</div>
	
	<div class="overflow-hidden overflow-x-auto">
		<table class="min-w-full text-sm">
			<thead>
				<tr class="bg-gray-50 dark:bg-gray-900">
					<th class="py-2 px-3 text-left">{$i18n.t('Time')}</th>
					<th class="py-2 px-3 text-left">{$i18n.t('Server')}</th>
					<th class="py-2 px-3 text-left">{$i18n.t('Event')}</th>
					<th class="py-2 px-3 text-left">{$i18n.t('Status')}</th>
					<th class="py-2 px-3 text-left">{$i18n.t('Actions')}</th>
				</tr>
			</thead>
			<tbody>
				{#if filteredEvents.length === 0}
					<tr>
						<td colspan="5" class="py-8 text-center text-gray-500">
							{#if searchQuery || filterStatus !== 'all'}
								{$i18n.t('No events match your filters.')}
							{:else}
								{$i18n.t('No system events available.')}
							{/if}
						</td>
					</tr>
				{:else}
					{#each filteredEvents as event}
						<tr class="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
							<td class="py-2 px-3">{event.time}</td>
							<td class="py-2 px-3">
								<div class="flex items-center">
									<span>{event.server.name}</span>
									{#if event.server.type}
										<span class="ml-1 text-xs bg-gray-200 dark:bg-gray-700 px-1 rounded text-gray-700 dark:text-gray-300">
											{event.server.type}
										</span>
									{/if}
								</div>
							</td>
							<td class="py-2 px-3">
								<div class="flex items-center">
									<span>{event.event}</span>
									{#if event.additionalInfo}
										<span class="ml-1 text-xs bg-blue-100 dark:bg-blue-900 px-1 rounded text-blue-700 dark:text-blue-300">
											{$i18n.t('Details')}
										</span>
									{/if}
								</div>
							</td>
							<td class="py-2 px-3">
								<span class="{
									event.status === 'Success' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
									event.status === 'Warning' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
									'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
								} px-2 py-0.5 rounded-full text-xs">
									{event.status}
								</span>
							</td>
							<td class="py-2 px-3">
								<button 
									class="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
									on:click={() => viewEventDetails(event)}
								>
									{$i18n.t('View Details')}
								</button>
							</td>
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>
</div>

<MCPServerLogs 
	bind:show={showLogs}
	serverId={selectedServerForLogs}
/>

<MCPEventDetails
	bind:show={showEventDetails}
	event={selectedEvent}
/>
