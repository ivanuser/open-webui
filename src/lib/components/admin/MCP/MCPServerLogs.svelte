<script lang="ts">
	import { getContext, onMount, onDestroy } from 'svelte';
	import { toast } from 'svelte-sonner';
	import XMark from '../../icons/XMark.svelte';
	import { mcpServers } from '$lib/stores';
	import Search from '../../icons/Search.svelte';
	
	const i18n = getContext('i18n');
	
	export let show = false;
	export let serverId = null;
	
	let logs = [];
	let server = null;
	let autoscroll = true;
	let logsContainerElement;
	let intervalId;
	let logLimit = 500; // Increased max number of log entries
	let filterLevel = 'all'; // 'all', 'info', 'debug', 'warn', 'error'
	let searchQuery = '';
	let showDateFilter = false;
	let startDate = null;
	let endDate = null;
	let expandedLogIndex = -1; // For detailed log view
	
	// Select options for export
	let exportFormat = 'json';
	
	// Mock function to get new logs - will be replaced with real API call later
	const fetchNewLogs = () => {
		// For now, generate mock logs
		if (!server) return [];
		
		const date = new Date();
		const timeString = date.toLocaleTimeString();
		
		// Add random log entries based on server type and status
		if (server.status === 'connected') {
			// Random event types based on server type
			const eventTypes = {
				memory: [
					'Processing memory request',
					'Memory graph operation',
					'Node retrieval',
					'Relationship query', 
					'Cache operation',
					'Memory allocation',
					'Garbage collection',
					'Index operation'
				],
				filesystem: [
					'File read operation',
					'Directory access',
					'File indexing',
					'Permission check',
					'Path resolution',
					'File write operation',
					'File search',
					'Metadata processing'
				],
				default: [
					'Processing request',
					'Client connection',
					'API operation',
					'Data transfer',
					'Configuration check',
					'Health check',
					'Security audit',
					'Resource allocation'
				]
			};
			
			// Get event types specific to this server type
			const serverEvents = eventTypes[server.type] || eventTypes.default;
			const randomEvent = serverEvents[Math.floor(Math.random() * serverEvents.length)];
			
			// Generate a random client IP address
			const clientIp = `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
			
			// Random log levels with specific probabilities
			const randomNumber = Math.random();
			if (randomNumber > 0.95) { // 5% chance for error
				return [{
					timestamp: timeString,
					level: 'error',
					message: `[${server.type}] Error: Failed to process ${randomEvent.toLowerCase()}`,
					details: {
						operation: randomEvent,
						clientIp,
						errorCode: `ERR_${Math.floor(Math.random() * 1000)}`,
						stackTrace: `Error: Operation failed\n  at processRequest (server.js:${Math.floor(Math.random() * 500)})\n  at handleClient (network.js:${Math.floor(Math.random() * 300)})\n  at Server.onRequest (index.js:${Math.floor(Math.random() * 200)})`
					}
				}];
			} else if (randomNumber > 0.85) { // 10% chance for warning
				return [{
					timestamp: timeString,
					level: 'warn',
					message: `[${server.type}] Warning: Slow ${randomEvent.toLowerCase()} detected`,
					details: {
						operation: randomEvent,
						clientIp,
						duration: `${Math.floor(Math.random() * 5000)}ms`,
						threshold: '1000ms'
					}
				}];
			} else if (randomNumber > 0.70) { // 15% chance for debug
				return [{
					timestamp: timeString,
					level: 'debug',
					message: `[${server.type}] Debug: ${randomEvent} details`,
					details: {
						operation: randomEvent,
						clientIp,
						memoryUsage: `${Math.floor(Math.random() * 100)}MB`,
						processingTime: `${Math.floor(Math.random() * 1000)}ms`,
						threadId: `thread-${Math.floor(Math.random() * 10)}`
					}
				}];
			} else { // 70% chance for info
				return [{
					timestamp: timeString,
					level: 'info',
					message: `[${server.type}] ${randomEvent} from client ${clientIp}`,
					details: {
						operation: randomEvent,
						clientIp,
						requestId: `req-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
						status: 'success'
					}
				}];
			}
		} else if (server.status === 'error') {
			// Generate error logs for servers in error state
			return [{
				timestamp: timeString,
				level: 'error',
				message: `[${server.type}] Critical error: Server connection failed`,
				details: {
					errorCode: `ERR_CONNECTION_${Math.floor(Math.random() * 1000)}`,
					attempts: Math.floor(Math.random() * 5) + 1,
					lastError: 'Connection refused',
					stackTrace: `Error: Connection failed\n  at connectToServer (client.js:${Math.floor(Math.random() * 500)})\n  at retry (network.js:${Math.floor(Math.random() * 300)})\n  at main (index.js:${Math.floor(Math.random() * 200)})`
				}
			}];
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
			message: `[${server.type}] Starting MCP server...`,
			details: {
				version: '1.0.5',
				environment: 'production',
				config: 'default'
			}
		});
		
		startupLogs.push({
			timestamp: new Date(date.getTime() - 4500).toLocaleTimeString(),
			level: 'info',
			message: `[${server.type}] Initializing ${server.type} service`,
			details: {
				serviceType: server.type,
				initParams: {
					threads: 4,
					cacheSize: '512MB',
					timeout: '30s'
				}
			}
		});
		
		if (server.type === 'memory') {
			startupLogs.push({
				timestamp: new Date(date.getTime() - 4000).toLocaleTimeString(),
				level: 'info',
				message: '[memory] Creating memory graph structure',
				details: {
					nodes: 1000,
					relationships: 2500,
					indexType: 'hash-map'
				}
			});
			
			startupLogs.push({
				timestamp: new Date(date.getTime() - 3500).toLocaleTimeString(),
				level: 'info',
				message: '[memory] Knowledge graph initialized successfully',
				details: {
					memoryUsage: '256MB',
					initTime: '1.2s',
					graphType: 'directed'
				}
			});
		} else if (server.type === 'filesystem') {
			startupLogs.push({
				timestamp: new Date(date.getTime() - 4000).toLocaleTimeString(),
				level: 'info',
				message: '[filesystem] Scanning allowed directories',
				details: {
					rootPath: '/path/to/allowed/files',
					recursive: true,
					excludes: ['.git', 'node_modules']
				}
			});
			
			startupLogs.push({
				timestamp: new Date(date.getTime() - 3500).toLocaleTimeString(),
				level: 'info',
				message: '[filesystem] File access restrictions applied',
				details: {
					permissions: 'read-only',
					maxFileSize: '100MB',
					allowedExtensions: ['.txt', '.md', '.json', '.csv']
				}
			});
		}
		
		startupLogs.push({
			timestamp: new Date(date.getTime() - 3000).toLocaleTimeString(),
			level: 'info',
			message: `[${server.type}] Starting HTTP server on port ${8000 + Math.floor(Math.random() * 1000)}`,
			details: {
				protocol: 'HTTP/1.1',
				host: '0.0.0.0',
				backlog: 100
			}
		});
		
		startupLogs.push({
			timestamp: new Date(date.getTime() - 2500).toLocaleTimeString(),
			level: 'info',
			message: `[${server.type}] MCP server ready`,
			details: {
				startupTime: '2.5s',
				status: 'ready',
				endpoints: ['/api/v1/query', '/api/v1/status', '/api/v1/admin']
			}
		});
		
		if (server.status === 'connected') {
			startupLogs.push({
				timestamp: new Date(date.getTime() - 1000).toLocaleTimeString(),
				level: 'info',
				message: `[${server.type}] Client connected from ${getRandomIP()}`,
				details: {
					clientId: `client-${Math.floor(Math.random() * 1000)}`,
					protocol: 'MCP/1.0',
					authMethod: 'token'
				}
			});
		}
		
		if (server.status === 'error') {
			startupLogs.push({
				timestamp: new Date(date.getTime() - 500).toLocaleTimeString(),
				level: 'error',
				message: `[${server.type}] Error: Failed to initialize properly`,
				details: {
					errorCode: 'INIT_FAILED',
					component: 'ServerCore',
					reason: 'Connection to backend services failed',
					stackTrace: `Error: Initialization failed\n  at Server.initialize (server.js:245)\n  at startServer (main.js:123)\n  at main (index.js:45)`
				}
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
	
	// Filter logs based on level and search query
	$: filteredLogs = logs.filter(log => {
		// Filter by level
		if (filterLevel !== 'all' && log.level !== filterLevel) {
			return false;
		}
		
		// Filter by search query
		if (searchQuery && !log.message.toLowerCase().includes(searchQuery.toLowerCase())) {
			return false;
		}
		
		// Filter by date range
		if (startDate || endDate) {
			const logDate = new Date(log.timestamp);
			
			if (startDate && logDate < new Date(startDate)) {
				return false;
			}
			
			if (endDate && logDate > new Date(endDate)) {
				return false;
			}
		}
		
		return true;
	});
	
	// Expand or collapse log details
	const toggleLogDetails = (index) => {
		if (expandedLogIndex === index) {
			expandedLogIndex = -1; // Collapse
		} else {
			expandedLogIndex = index; // Expand
		}
	};
	
	// Export logs function
	const exportLogs = () => {
		if (filteredLogs.length === 0) {
			toast.error($i18n.t('No logs to export'));
			return;
		}
		
		try {
			let exportData;
			let mimeType;
			let fileName;
			
			if (exportFormat === 'json') {
				exportData = JSON.stringify(filteredLogs, null, 2);
				mimeType = 'application/json';
				fileName = `${server.name}_logs_${new Date().toISOString().split('T')[0]}.json`;
			} else if (exportFormat === 'csv') {
				// Create CSV header
				exportData = 'timestamp,level,message\n';
				
				// Add each log entry
				filteredLogs.forEach(log => {
					// Escape quotes in message
					const escapedMessage = log.message.replace(/"/g, '""');
					exportData += `"${log.timestamp}","${log.level}","${escapedMessage}"\n`;
				});
				
				mimeType = 'text/csv';
				fileName = `${server.name}_logs_${new Date().toISOString().split('T')[0]}.csv`;
			} else if (exportFormat === 'txt') {
				exportData = filteredLogs.map(log => 
					`[${log.timestamp}] [${log.level.toUpperCase()}] ${log.message}`
				).join('\n');
				
				mimeType = 'text/plain';
				fileName = `${server.name}_logs_${new Date().toISOString().split('T')[0]}.txt`;
			}
			
			// Create blob and download
			const blob = new Blob([exportData], { type: mimeType });
			const url = URL.createObjectURL(blob);
			
			const a = document.createElement('a');
			a.href = url;
			a.download = fileName;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
			
			toast.success($i18n.t('Logs exported successfully'));
		} catch (error) {
			console.error('Error exporting logs:', error);
			toast.error($i18n.t('Failed to export logs'));
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
		
		<div class="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-5xl flex flex-col h-[90vh] relative z-10">
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
			
			<div class="p-2 bg-gray-100 dark:bg-gray-800 flex flex-col md:flex-row justify-between items-center gap-2">
				<div class="text-sm font-medium">{$i18n.t('Server Logs')}</div>
				
				<div class="flex flex-wrap items-center gap-2">
					<div class="relative">
						<div class="absolute inset-y-0 left-0 flex items-center pl-2">
							<Search className="w-3.5 h-3.5 text-gray-500" />
						</div>
						<input 
							type="text" 
							class="pl-8 pr-2 py-1 text-xs border border-gray-300 dark:border-gray-700 rounded dark:bg-gray-800"
							placeholder={$i18n.t('Search logs...')}
							bind:value={searchQuery}
						/>
					</div>
					
					<select 
						bind:value={filterLevel}
						class="px-2 py-1 text-xs border border-gray-300 dark:border-gray-700 rounded dark:bg-gray-800"
					>
						<option value="all">{$i18n.t('All Levels')}</option>
						<option value="info">{$i18n.t('Info')}</option>
						<option value="debug">{$i18n.t('Debug')}</option>
						<option value="warn">{$i18n.t('Warning')}</option>
						<option value="error">{$i18n.t('Error')}</option>
					</select>
					
					<button 
						class="px-2 py-1 text-xs border border-gray-300 dark:border-gray-700 rounded dark:bg-gray-800"
						on:click={() => showDateFilter = !showDateFilter}
					>
						{$i18n.t('Date Filter')} {showDateFilter ? '▲' : '▼'}
					</button>
					
					<div class="flex gap-2">
						<button 
							class="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition flex items-center"
							on:click={exportLogs}
						>
							<svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
							</svg>
							{$i18n.t('Export')}
						</button>
						
						<select 
							bind:value={exportFormat}
							class="px-2 py-1 text-xs border border-gray-300 dark:border-gray-700 rounded dark:bg-gray-800"
						>
							<option value="json">JSON</option>
							<option value="csv">CSV</option>
							<option value="txt">TXT</option>
						</select>
					</div>
					
					<div class="flex items-center">
						<label class="flex items-center text-xs">
							<input type="checkbox" bind:checked={autoscroll} class="mr-1">
							{$i18n.t('Auto-scroll')}
						</label>
					</div>
					
					<button 
						class="text-xs text-blue-500 hover:text-blue-700 font-medium"
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
			
			{#if showDateFilter}
				<div class="p-2 bg-gray-50 dark:bg-gray-800 border-t border-b border-gray-200 dark:border-gray-700 flex flex-wrap gap-2 items-center text-xs">
					<span>{$i18n.t('Date Range')}:</span>
					<div class="flex items-center gap-2">
						<label>{$i18n.t('From')}:</label>
						<input 
							type="datetime-local" 
							bind:value={startDate}
							class="px-2 py-1 border border-gray-300 dark:border-gray-700 rounded dark:bg-gray-900"
						/>
					</div>
					<div class="flex items-center gap-2">
						<label>{$i18n.t('To')}:</label>
						<input 
							type="datetime-local" 
							bind:value={endDate}
							class="px-2 py-1 border border-gray-300 dark:border-gray-700 rounded dark:bg-gray-900"
						/>
					</div>
					<button 
						class="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
						on:click={() => {
							startDate = null;
							endDate = null;
						}}
					>
						{$i18n.t('Clear')}
					</button>
				</div>
			{/if}
			
			<div 
				class="flex-grow overflow-y-auto p-2 font-mono text-xs bg-gray-950 text-gray-300"
				bind:this={logsContainerElement}
			>
				{#if filteredLogs.length === 0}
					<div class="flex justify-center items-center h-full text-gray-500">
						{#if searchQuery || filterLevel !== 'all' || startDate || endDate}
							{$i18n.t('No logs match your filters.')}
						{:else}
							{$i18n.t('No logs available.')}
						{/if}
					</div>
				{:else}
					{#each filteredLogs as log, i}
						<div class="py-0.5 hover:bg-gray-900 cursor-pointer" on:click={() => toggleLogDetails(i)}>
							<div class="flex">
								<span class="text-gray-500 min-w-[80px]">[{log.timestamp}]</span>
								<span 
									class="{log.level === 'error' ? 'text-red-400' : 
											log.level === 'warn' ? 'text-yellow-400' : 
											log.level === 'debug' ? 'text-blue-400' : 'text-green-400'} min-w-[60px]"
								>
									[{log.level.toUpperCase()}]
								</span>
								<span class="flex-grow">{log.message}</span>
								{#if log.details}
									<span class="text-blue-400 ml-2">[{expandedLogIndex === i ? '−' : '+'}]</span>
								{/if}
							</div>
							
							{#if expandedLogIndex === i && log.details}
								<div class="ml-[140px] mt-1 mb-2 pl-2 border-l-2 border-gray-700">
									{#each Object.entries(log.details) as [key, value]}
										<div class="py-0.5">
											<span class="text-gray-400">{key}:</span>
											{#if typeof value === 'object'}
												<span class="text-blue-300">
													{JSON.stringify(value, null, 2)}
												</span>
											{:else if key === 'stackTrace'}
												<pre class="text-red-300 mt-1 ml-4 whitespace-pre-wrap">{value}</pre>
											{:else}
												<span class="text-blue-300">{value}</span>
											{/if}
										</div>
									{/each}
								</div>
							{/if}
						</div>
					{/each}
				{/if}
			</div>
			
			<div class="p-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
				<div class="text-xs text-gray-500">
					{$i18n.t('Total logs')}: {logs.length} | {$i18n.t('Filtered')}: {filteredLogs.length}
				</div>
				
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
