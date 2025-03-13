<script lang="ts">
	import { getContext, onMount, onDestroy } from 'svelte';
	import { toast } from 'svelte-sonner';
	import XMark from '../../icons/XMark.svelte';
	import { mcpServers } from '$lib/stores';
	
	const i18n = getContext('i18n');
	
	export let show = false;
	export let serverId = null;
	
	let logs = [];
	let server = null;
	let autoscroll = true;
	let logsContainerElement;
	let intervalId;
	let logLimit = 100; // Max number of log entries to show
	
	// Mock function to get new logs - will be replaced with real API call later
	const fetchNewLogs = () => {
		// For now, generate mock logs
		if (!server) return [];
		
		const date = new Date();
		const timeString = date.toLocaleTimeString();
		
		// Add random log entries based on server type and status
		if (server.status === 'connected') {
			// Sometimes add informational logs, sometimes add activity logs
			if (Math.random() > 0.7) {
				return [{
					timestamp: timeString,
					level: 'info',
					message: `[${server.type}] Processing request from client`
				}];
			} else if (Math.random() > 0.9) {
				return [{
					timestamp: timeString,
					level: 'debug',
					message: `[${server.type}] Memory usage: ${Math.floor(Math.random() * 100)}MB`
				}];
			}
		} else if (server.status === 'error') {
			if (Math.random() > 0.8) {
				return [{
					timestamp: timeString,
					level: 'error',
					message: `[${server.type}] Connection error: Failed to process request`
				}];
			}
		}
		
		return [];
	};
	
	// Function to add initial logs
	const initLogs = () => {
		if (!server) return;
		
		const date = new Date();
		const startupLogs = [];
		
		// Add startup logs based on server type
		startupLogs.push({
			timestamp: new Date(date.getTime() - 5000).toLocaleTimeString(),
			level: 'info',
			message: `[${server.type}] Starting MCP server...`
		});
		
		startupLogs.push({
			timestamp: new Date(date.getTime() - 4500).toLocaleTimeString(),
			level: 'info',
			message: `[${server.type}] Initializing ${server.type} service`
		});
		
		if (server.type === 'memory') {
			startupLogs.push({
				timestamp: new Date(date.getTime() - 4000).toLocaleTimeString(),
				level: 'info',
				message: '[memory] Creating memory graph structure'
			});
			
			startupLogs.push({
				timestamp: new Date(date.getTime() - 3500).toLocaleTimeString(),
				level: 'info',
				message: '[memory] Knowledge graph initialized successfully'
			});
		} else if (server.type === 'filesystem') {
			startupLogs.push({
				timestamp: new Date(date.getTime() - 4000).toLocaleTimeString(),
				level: 'info',
				message: '[filesystem] Scanning allowed directories'
			});
			
			startupLogs.push({
				timestamp: new Date(date.getTime() - 3500).toLocaleTimeString(),
				level: 'info',
				message: '[filesystem] File access restrictions applied'
			});
		}
		
		startupLogs.push({
			timestamp: new Date(date.getTime() - 3000).toLocaleTimeString(),
			level: 'info',
			message: `[${server.type}] Starting HTTP server on port ${8000 + Math.floor(Math.random() * 1000)}`
		});
		
		startupLogs.push({
			timestamp: new Date(date.getTime() - 2500).toLocaleTimeString(),
			level: 'info',
			message: `[${server.type}] MCP server ready`
		});
		
		if (server.status === 'connected') {
			startupLogs.push({
				timestamp: new Date(date.getTime() - 1000).toLocaleTimeString(),
				level: 'info',
				message: `[${server.type}] Client connected from ${getRandomIP()}`
			});
		}
		
		if (server.status === 'error') {
			startupLogs.push({
				timestamp: new Date(date.getTime() - 500).toLocaleTimeString(),
				level: 'error',
				message: `[${server.type}] Error: Failed to initialize properly`
			});
		}
		
		logs = startupLogs;
	};
	
	// Helper function to generate a random IP address
	const getRandomIP = () => {
		return `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
	};
	
	// Function to scroll to bottom of logs
	const scrollToBottom = () => {
		if (autoscroll && logsContainerElement) {
			logsContainerElement.scrollTop = logsContainerElement.scrollHeight;
		}
	};
	
	// Update logs when serverId changes
	$: {
		if (serverId) {
			server = $mcpServers?.find(s => s.id === serverId);
			if (server) {
				initLogs();
				scrollToBottom();
			}
		}
	}
	
	// Start polling for new logs when component is mounted
	onMount(() => {
		intervalId = setInterval(() => {
			const newLogs = fetchNewLogs();
			if (newLogs.length > 0) {
				logs = [...logs, ...newLogs].slice(-logLimit); // Keep only the most recent logs
				setTimeout(scrollToBottom, 10);
			}
		}, 2000); // Poll every 2 seconds
	});
	
	// Clean up interval when component is destroyed
	onDestroy(() => {
		if (intervalId) {
			clearInterval(intervalId);
		}
	});
</script>

{#if show && server}
	<div class="fixed inset-0 flex items-center justify-center z-50 p-4 overflow-y-auto">
		<div class="fixed inset-0 bg-black opacity-50" on:click={() => (show = false)}></div>
		
		<div class="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-3xl flex flex-col h-[80vh] relative z-10">
			<div class="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
				<div>
					<h2 class="text-xl font-semibold flex items-center">
						<span class="mr-2">{server.name}</span>
						<span class="text-xs font-bold px-1 rounded-sm uppercase line-clamp-1 bg-gray-500/20 text-gray-700 dark:text-gray-200">
							{server.type}
						</span>
						<span 
							class="ml-2 text-xs font-bold px-1 rounded-sm uppercase line-clamp-1 {server.status === 'connected' 
								? 'bg-green-500/20 text-green-700 dark:text-green-200' 
								: server.status === 'connecting' 
									? 'bg-blue-500/20 text-blue-700 dark:text-blue-200'
									: server.status === 'error'
										? 'bg-red-500/20 text-red-700 dark:text-red-200'
										: 'bg-gray-500/20 text-gray-700 dark:text-gray-200'}"
						>
							{server.status}
						</span>
					</h2>
					<p class="text-sm text-gray-500">{server.description || ''}</p>
				</div>
				<button
					class="rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
					on:click={() => (show = false)}
				>
					<XMark className="w-6 h-6" />
				</button>
			</div>
			
			<div class="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col md:flex-row gap-4">
				<div class="flex flex-col flex-grow">
					<div class="text-sm font-medium mb-1">{$i18n.t('Server Information')}</div>
					<div class="text-xs text-gray-600 dark:text-gray-300 grid grid-cols-2 gap-2">
						<div>{$i18n.t('ID')}:</div><div class="font-mono">{server.id}</div>
						{#if server.url}
							<div>{$i18n.t('URL')}:</div><div class="font-mono">{server.url}</div>
						{:else if server.command}
							<div>{$i18n.t('Command')}:</div>
							<div class="font-mono">{server.command} {server.args?.join(' ') || ''}</div>
						{/if}
					</div>
				</div>
				
				<div class="flex flex-col md:max-w-[200px]">
					<div class="text-sm font-medium mb-1">{$i18n.t('Status')}</div>
					<div class="flex flex-col text-xs text-gray-600 dark:text-gray-300">
						<div class="flex justify-between">
							<span>{$i18n.t('Connection')}:</span>
							<span class="{server.status === 'connected' ? 'text-green-500' : 'text-gray-500'} font-medium">
								{server.status === 'connected' ? $i18n.t('Active') : $i18n.t('Inactive')}
							</span>
						</div>
						<div class="flex justify-between">
							<span>{$i18n.t('Uptime')}:</span>
							<span>{Math.floor(Math.random() * 24)}h {Math.floor(Math.random() * 60)}m</span>
						</div>
						<div class="flex justify-between">
							<span>{$i18n.t('Memory')}:</span>
							<span>{Math.floor(Math.random() * 100)}MB</span>
						</div>
					</div>
				</div>
			</div>
			
			<div class="flex-grow overflow-hidden flex flex-col">
				<div class="p-2 bg-gray-100 dark:bg-gray-800 flex justify-between items-center">
					<div class="text-sm font-medium">{$i18n.t('Server Logs')}</div>
					<div class="flex items-center">
						<label class="flex items-center text-xs">
							<input type="checkbox" bind:checked={autoscroll} class="mr-1">
							{$i18n.t('Auto-scroll')}
						</label>
						<button 
							class="ml-2 text-xs text-blue-500 hover:text-blue-700 font-medium"
							on:click={() => {
								logs = [];
								initLogs();
								scrollToBottom();
							}}
						>
							{$i18n.t('Clear')}
						</button>
					</div>
				</div>
				
				<div 
					class="flex-grow overflow-y-auto p-2 font-mono text-xs bg-gray-950 text-gray-300"
					bind:this={logsContainerElement}
				>
					{#each logs as log}
						<div class="py-0.5">
							<span class="text-gray-500">[{log.timestamp}]</span>
							<span 
								class="{log.level === 'error' ? 'text-red-400' : 
										log.level === 'warn' ? 'text-yellow-400' : 
										log.level === 'debug' ? 'text-blue-400' : 'text-green-400'}"
							>
								[{log.level.toUpperCase()}]
							</span>
							<span>{log.message}</span>
						</div>
					{/each}
				</div>
			</div>
			
			<div class="p-3 border-t border-gray-200 dark:border-gray-700 flex justify-end">
				<button
					class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
					on:click={() => (show = false)}
				>
					{$i18n.t('Close')}
				</button>
			</div>
		</div>
	</div>
{/if}
