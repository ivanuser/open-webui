<script lang="ts">
	import { getContext, onMount, onDestroy } from 'svelte';
	import { toast } from 'svelte-sonner';
	import MCPServerLogs from './MCPServerLogs.svelte';
	
	const i18n = getContext('i18n');
	
	export let servers = [];
	
	let selectedServerForLogs = null;
	let showLogs = false;
	let stats = {
		totalRequests: Math.floor(Math.random() * 1000),
		totalErrors: Math.floor(Math.random() * 100),
		averageResponseTime: Math.floor(Math.random() * 500),
		peakMemoryUsage: Math.floor(Math.random() * 500)
	};
	let updateInterval;
	
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
	
	const viewLogs = (server) => {
		selectedServerForLogs = server.id;
		showLogs = true;
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
	<h3 class="text-base font-medium mb-2">{$i18n.t('Recent System Events')}</h3>
	<div class="overflow-hidden overflow-x-auto">
		<table class="min-w-full text-sm">
			<thead>
				<tr class="bg-gray-50 dark:bg-gray-900">
					<th class="py-2 px-3 text-left">{$i18n.t('Time')}</th>
					<th class="py-2 px-3 text-left">{$i18n.t('Server')}</th>
					<th class="py-2 px-3 text-left">{$i18n.t('Event')}</th>
					<th class="py-2 px-3 text-left">{$i18n.t('Status')}</th>
				</tr>
			</thead>
			<tbody>
				{#each Array(5).fill(0) as _, i}
					{@const date = new Date(Date.now() - i * 1000 * 60 * Math.floor(Math.random() * 60))}
					{@const randomServer = servers[Math.floor(Math.random() * servers.length)] || {name: 'Unknown', type: 'unknown'}}
					{@const events = ['Connection Established', 'Server Started', 'Data Request', 'API Endpoint Called', 'Configuration Changed']}
					{@const statuses = ['Success', 'Warning', 'Error']}
					{@const randomEvent = events[Math.floor(Math.random() * events.length)]}
					{@const randomStatus = statuses[Math.floor(Math.random() * statuses.length)]}
					<tr class="border-t border-gray-100 dark:border-gray-800">
						<td class="py-2 px-3">{date.toLocaleTimeString()}</td>
						<td class="py-2 px-3">
							<div class="flex items-center">
								<span>{randomServer.name}</span>
								<span class="ml-1 text-xs bg-gray-200 dark:bg-gray-700 px-1 rounded text-gray-700 dark:text-gray-300">
									{randomServer.type}
								</span>
							</div>
						</td>
						<td class="py-2 px-3">{randomEvent}</td>
						<td class="py-2 px-3">
							<span class="{
								randomStatus === 'Success' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
								randomStatus === 'Warning' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
								'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
							} px-2 py-0.5 rounded-full text-xs">
								{randomStatus}
							</span>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>

<MCPServerLogs 
	bind:show={showLogs}
	serverId={selectedServerForLogs}
/>
