<!-- Chat controls with enhanced MCP functionality -->
<script>
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import { fade } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import { get } from 'svelte/store';
	import { toast } from '$lib/components/ui/toasts';
	import * as Alert from '$lib/components/ui/alert';

	import FileInput from '../MessageInput/FileInput.svelte';
	import PromptDropdown from '../PromptDropdown/PromptDropdown.svelte';
	import MCPServerSelector from '../MCPServerSelector/MCPServerSelector.svelte';
	import MCPInstructions from './MCPInstructions.svelte';
	import VoiceInput from '../MessageInput/VoiceInput.svelte';
	import { prepareMCPSystemPrompt } from '$lib/components/chat/MCPHandler';
	import { settings, mcpServers } from '$lib/stores';
	import { formatText } from '$lib/utils/text';
	import { debounce } from '$lib/utils/debounce';

	export let messages = [];
	export let height = 'h-[110px]';
	export let footerHeight = 'h-[190px]';
	export let autoSave = true;
	export let generating = false;
	export let fileAccepted = false;
	export let imgUploading = false;
	export let isLandingPage = false;
	export let disabled = false;
	export let loading = false;
	export let theme = 'common';
	export let modelsSelected = [];
	export let activeModel = {};
	export let defaultStartupMessage = '';
	export let placeholder = '';
	export let autoScroll = true;
	export let showContinue = false;
	export let continueSynthesizing = false;
	export let textareaRef = null;
	export let systemPrompt = '';

	const dispatch = createEventDispatcher();
	let promptDropdownRef;
	let showDropdown = false;
	let showImageUploadButton = true;
	let showAudioButton = true;
	let showSendButton = true;
	let showInstructions = false;
	let showSettings = false;
	let showSettings2 = false;
	let showMCPConfig = false;
	let activeMCPServer = null;
	let connectedMCPServers = [];
	let size = 0;
	let value = defaultStartupMessage || '';
	let prevValue = value;
	let autoHeight = true;
	let baseHeight = $settings?.baseHeight || 0;
	let filesToUpload = [];
	
	let isInitialized = false;
	let mcpInitializeTimeout = null;

	// Update content
	export function update(value_) {
		value = value_;
	}

	// Handle dynamic height
	export function handleHeight(e) {
		size = e?.target?.value?.length ?? 0;
		if (!autoHeight) return;
		baseHeight = $settings?.baseHeight || 0;
		setTimeout(() => {
			try {
				if (textareaRef?.elm) {
					textareaRef.elm.style.height = baseHeight;
					const scrollHeight = textareaRef.elm.scrollHeight;
					textareaRef.elm.style.height = scrollHeight + 'px';
				}
			} catch (error) {
				console.warn('Failed to handle height', error);
			}
		}, 0);
	}

	// Submit message
	export function submitMessage() {
		if (loading) return;
		if (disabled && !isLandingPage) return;

		// Check files to upload first
		if (filesToUpload?.length > 0) {
			dispatch('uploadFiles', { files: filesToUpload, content: value });
			return;
		}

		// Check if there is a message to submit
		let messageToSubmit = formatText(value);
		if (messageToSubmit.trim() === '') return;

		// Clear the input field
		value = '';
		prevValue = '';
		handleHeight({ target: { value: '' } });

		// Prepare the MCP system prompt
		const mcpSystemPrompt = activeMCPServer ? prepareMCPSystemPrompt(activeModel, getMCPToolsForServer(activeMCPServer)) : '';

		// Create new message to send
		const messageToSend = {
			content: messageToSubmit,
			prompt: systemPrompt || mcpSystemPrompt || activeModel?.promptTemplate || '',
			model: modelsSelected.length > 0 ? [...modelsSelected] : [activeModel],
			submitted: true,
			generating: true,
			continue: false,
			continueSynthesizing
		};

		dispatch('submit', messageToSend);
	}

	// Handle regenerate with continue function
	export function regenerateWithContinue() {
		if (generating) return;
		dispatch('regenerate', { continue: true, continueSynthesizing });
	}

	// Stop generation
	export function stopGeneration() {
		if (!generating) return;
		dispatch('stopGenerating');
	}

	// Simple translation function for compatibility
	function _(key) {
		// For controls that use $_() in the template
		const translations = {
			'controls.stop': 'Stop',
			'controls.continue': 'Continue'
		};
		return translations[key] || key;
	}

	// Handle content change
	export function handleContentChange(updatedValue) {
		value = updatedValue || '';
		handleHeight({ target: { value } });
	}

	// Handle files upload
	export function handleFilesUpload(files, keep = false) {
		if (!keep) {
			filesToUpload = files;
		} else {
			filesToUpload = [...filesToUpload, ...files];
		}
	}

	// Remove file
	export function removeFile(index) {
		filesToUpload.splice(index, 1);
		filesToUpload = [...filesToUpload];
	}

	// Clear files
	export function clearFiles() {
		filesToUpload = [];
	}

	// Get MCP tools for a server
	function getMCPToolsForServer(server) {
		if (!server) return [];
		
		if (server.type === 'filesystem' || server.type === 'filesystem-py') {
			return [
				{
					name: "list_directory",
					description: "Lists all files and directories in the specified directory path",
					parameters: {
						type: "object",
						properties: {
							path: {
								type: "string",
								description: "The absolute path to the directory"
							}
						},
						required: ["path"]
					}
				},
				{
					name: "read_file",
					description: "Reads the content of a file",
					parameters: {
						type: "object",
						properties: {
							path: {
								type: "string",
								description: "The absolute path to the file"
							}
						},
						required: ["path"]
					}
				},
				{
					name: "write_file",
					description: "Creates a new file or overwrites an existing file",
					parameters: {
						type: "object",
						properties: {
							path: {
								type: "string", 
								description: "The absolute path where the file should be created or overwritten"
							},
							content: {
								type: "string",
								description: "Content to write to the file"
							}
						},
						required: ["path", "content"]
					}
				},
				{
					name: "create_directory",
					description: "Creates a new directory or ensures it exists",
					parameters: {
						type: "object",
						properties: {
							path: {
								type: "string",
								description: "The absolute path where the directory should be created"
							}
						},
						required: ["path"]
					}
				},
				{
					name: "search_files",
					description: "Searches for files matching a pattern in a directory",
					parameters: {
						type: "object",
						properties: {
							path: {
								type: "string",
								description: "The absolute path to the directory to search in"
							},
							pattern: {
								type: "string",
								description: "The search pattern (glob format)"
							}
						},
						required: ["path", "pattern"]
					}
				},
				{
					name: "get_file_info",
					description: "Gets detailed information about a file or directory",
					parameters: {
						type: "object",
						properties: {
							path: {
								type: "string",
								description: "The absolute path to the file or directory"
							}
						},
						required: ["path"]
					}
				}
			];
		} else if (server.type === 'memory') {
			return [
				{
					name: "store_memory",
					description: "Stores information in the memory server",
					parameters: {
						type: "object",
						properties: {
							key: {
								type: "string",
								description: "The key to store the information under"
							},
							value: {
								type: "string",
								description: "The information to store"
							}
						},
						required: ["key", "value"]
					}
				},
				{
					name: "retrieve_memory",
					description: "Retrieves information from the memory server",
					parameters: {
						type: "object",
						properties: {
							key: {
								type: "string",
								description: "The key to retrieve information for"
							}
						},
						required: ["key"]
					}
				},
				{
					name: "search_memory",
					description: "Searches for information in the memory server",
					parameters: {
						type: "object",
						properties: {
							query: {
								type: "string",
								description: "The search query"
							}
						},
						required: ["query"]
					}
				}
			];
		}
		
		return [];
	}

	// Initialize MCP integration
	async function initializeMCPIntegration() {
		if (isInitialized) return;
		
		try {
			const currentSettings = get(settings);
			const servers = get(mcpServers) || [];
			
			// Get connected servers
			connectedMCPServers = servers.filter(server => server.status === 'connected');
			
			// Set active server from settings if available
			const defaultServerId = currentSettings?.defaultMcpServer;
			
			if (defaultServerId) {
				activeMCPServer = connectedMCPServers.find(s => s.id === defaultServerId);
				
				if (activeMCPServer) {
					// Verify server connection
					await verifyMCPServerConnection(activeMCPServer);
				} else {
					// If default server is set but not connected, try to connect it
					const server = servers.find(s => s.id === defaultServerId);
					if (server) {
						// Try to reconnect
						await autoConnectMCPServer(server);
					}
				}
			}
			
			// If no active server but we have connected servers, use the first one
			if (!activeMCPServer && connectedMCPServers.length > 0) {
				activeMCPServer = connectedMCPServers[0];
				
				// Update settings to reflect the active server
				if (currentSettings) {
					currentSettings.defaultMcpServer = activeMCPServer.id;
					if (!currentSettings.enabledMcpServers) {
						currentSettings.enabledMcpServers = [];
					}
					if (!currentSettings.enabledMcpServers.includes(activeMCPServer.id)) {
						currentSettings.enabledMcpServers.push(activeMCPServer.id);
					}
					
					settings.set(currentSettings);
					localStorage.setItem('userSettings', JSON.stringify(currentSettings));
				}
			}
			
			// Log the active server state
			if (activeMCPServer) {
				console.log('Active MCP server initialized:', activeMCPServer.name);
			} else if (defaultServerId) {
				console.warn(`Selected MCP server ${defaultServerId} is not connected`);
			}
			
			isInitialized = true;
		} catch (error) {
			console.error('Error initializing MCP integration:', error);
			
			// Schedule retry
			if (mcpInitializeTimeout) {
				clearTimeout(mcpInitializeTimeout);
			}
			
			mcpInitializeTimeout = setTimeout(() => {
				isInitialized = false;
				initializeMCPIntegration();
			}, 5000); // Retry after 5 seconds
		}
	}

	// Auto-connect MCP server on startup
	async function autoConnectMCPServer(server) {
		if (!server) return false;
		
		try {
			// Try to ping the server to see if it's running
			const response = await fetch(`${server.url}/info`, {
				method: 'GET',
				headers: {
					...(server.apiKey ? { 'Authorization': `Bearer ${server.apiKey}` } : {})
				}
			});
			
			if (response.ok) {
				// Server is running, update its status to connected
				server.status = 'connected';
				server.lastConnected = new Date().toISOString();
				
				// Update the active server
				activeMCPServer = server;
				
				// Update the list of connected servers
				connectedMCPServers = [...connectedMCPServers.filter(s => s.id !== server.id), server];
				
				// Update settings
				const currentSettings = get(settings);
				if (currentSettings) {
					if (!currentSettings.enabledMcpServers) {
						currentSettings.enabledMcpServers = [];
					}
					
					if (!currentSettings.enabledMcpServers.includes(server.id)) {
						currentSettings.enabledMcpServers.push(server.id);
					}
					
					currentSettings.defaultMcpServer = server.id;
					
					settings.set(currentSettings);
					localStorage.setItem('userSettings', JSON.stringify(currentSettings));
				}
				
				// Update servers in storage
				const allServers = get(mcpServers) || [];
				const updatedServers = allServers.map(s => {
					if (s.id === server.id) {
						return { ...s, status: 'connected', lastConnected: new Date().toISOString() };
					}
					return s;
				});
				
				mcpServers.set(updatedServers);
				localStorage.setItem('mcpServers', JSON.stringify(updatedServers));
				
				console.log(`Auto-connected to MCP server: ${server.name}`);
				return true;
			}
		} catch (error) {
			console.error(`Failed to auto-connect to MCP server ${server.name}:`, error);
		}
		
		return false;
	}

	// Verify MCP server connection
	async function verifyMCPServerConnection(server) {
		if (!server) return false;
		
		try {
			const response = await fetch(`${server.url}/info`, {
				method: 'GET',
				headers: {
					...(server.apiKey ? { 'Authorization': `Bearer ${server.apiKey}` } : {})
				}
			});
			
			if (!response.ok) {
				throw new Error(`Server returned ${response.status}: ${response.statusText}`);
			}
			
			const info = await response.json();
			console.log(`Verified connection to MCP server: ${server.name}`, info);
			return true;
		} catch (error) {
			console.error(`Failed to verify MCP server connection for ${server.name}:`, error);
			
			// Mark server as disconnected
			server.status = 'disconnected';
			
			// Update the list of connected servers
			connectedMCPServers = connectedMCPServers.filter(s => s.id !== server.id);
			
			// If this was the active server, clear it
			if (activeMCPServer && activeMCPServer.id === server.id) {
				activeMCPServer = null;
			}
			
			// Update settings
			const currentSettings = get(settings);
			if (currentSettings && currentSettings.enabledMcpServers) {
				currentSettings.enabledMcpServers = currentSettings.enabledMcpServers.filter(
					id => id !== server.id
				);
				
				if (currentSettings.defaultMcpServer === server.id) {
					currentSettings.defaultMcpServer = currentSettings.enabledMcpServers.length > 0 
						? currentSettings.enabledMcpServers[0] 
						: null;
				}
				
				settings.set(currentSettings);
				localStorage.setItem('userSettings', JSON.stringify(currentSettings));
			}
			
			// Update servers in storage
			const allServers = get(mcpServers) || [];
			const updatedServers = allServers.map(s => {
				if (s.id === server.id) {
					return { ...s, status: 'disconnected' };
				}
				return s;
			});
			
			mcpServers.set(updatedServers);
			localStorage.setItem('mcpServers', JSON.stringify(updatedServers));
			
			return false;
		}
	}

	// Handle active MCP server change
	function handleActiveMCPServerChange(event) {
		activeMCPServer = event.detail;
		
		// Update settings
		const currentSettings = get(settings);
		if (currentSettings) {
			currentSettings.defaultMcpServer = activeMCPServer?.id || null;
			settings.set(currentSettings);
			localStorage.setItem('userSettings', JSON.stringify(currentSettings));
		}
	}

	// Update MCPServerSelector when connectedMCPServers changes
	$: {
		if (connectedMCPServers) {
			// Keep it updated
		}
	}

	onMount(() => {
		// Initialize MCP integration
		initializeMCPIntegration();
		
		// Initialize with default message if available
		if (defaultStartupMessage && defaultStartupMessage !== value) {
			value = defaultStartupMessage;
			prevValue = value;
			handleHeight({ target: { value } });
		}
	});

	onDestroy(() => {
		if (mcpInitializeTimeout) {
			clearTimeout(mcpInitializeTimeout);
		}
	});
</script>

<div
	class="flex flex-col w-full relative border-gray-900/10 dark:border-gray-300/10 max-w-3xl mx-auto"
>
	<!-- Controls for MCP, Settings, and other tools -->
	<div class="flex flex-col gap-2">
		{#if filesToUpload?.length > 0}
			<!-- File upload preview -->
			<div
				class="w-full flex flex-wrap gap-2 mt-2 p-2 dark:bg-gray-800 bg-gray-100 rounded-xl overflow-x-auto"
			>
				{#each filesToUpload as file, i}
					<div
						class="shrink-0 flex items-center gap-2 px-2 py-1 dark:bg-gray-700 bg-gray-200 rounded-lg"
					>
						<button
							class="h-4 w-4 rounded-full bg-red-500 flex justify-center items-center text-white"
							on:click={() => removeFile(i)}
						>
							&times;
						</button>
						<span class="text-xs">{file.name}</span>
					</div>
				{/each}
				<button
					on:click={clearFiles}
					class="shrink-0 flex items-center gap-2 px-2 py-1 dark:bg-gray-700 bg-gray-200 rounded-lg text-xs"
				>
					Clear All
				</button>
			</div>
		{/if}

		<!-- MCP server selector and instructions -->
		<div class="flex justify-between gap-2 items-center mb-2">
			<div class="flex gap-2 items-center">
				<MCPServerSelector
					bind:connectedServers={connectedMCPServers}
					bind:activeServer={activeMCPServer}
					on:change={handleActiveMCPServerChange}
				/>
				
				{#if activeMCPServer}
					<button
						on:click={() => (showInstructions = !showInstructions)}
						class="text-xs text-gray-500 dark:text-gray-400 hover:underline"
					>
						{showInstructions ? 'Hide Instructions' : 'Show Instructions'}
					</button>
				{/if}
			</div>
		</div>
		
		{#if showInstructions && activeMCPServer}
			<MCPInstructions serverType={activeMCPServer.type} />
		{/if}
	</div>

	<!-- Textarea for message input -->
	<div class="relative flex flex-col w-full">
		<slot name="textarea" {value} {handleContentChange} {submitMessage} {disabled} {placeholder} />
		
		<div
			class="flex items-center justify-between gap-2 py-2 {!!value ? 'visible' : 'invisible'}"
		>
			<!-- Submit button -->
			{#if showSendButton && (!generating || isLandingPage)}
				<div class="flex justify-end items-center">
					<button
						disabled={loading || (disabled && !isLandingPage)}
						class="flex justify-center items-center text-white p-1 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
						on:click={submitMessage}
					>
						<svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path
								d="M10.3009 13.6949L20.102 3.89742M10.5795 14.1355L12.8019 18.5804C13.339 19.6545 13.6075 20.1916 13.9458 20.3356C14.2394 20.4606 14.575 20.4379 14.8492 20.2747C15.1651 20.0866 15.34 19.5183 15.6898 18.3818L19.7882 4.08434C20.1229 2.9942 20.2902 2.44913 20.1787 2.12573C20.0813 1.84298 19.8748 1.62951 19.5975 1.52252C19.2776 1.40091 18.7326 1.56233 17.6426 1.88517L3.29176 5.96938C2.15504 6.31768 1.58668 6.49183 1.40446 6.80221C1.24481 7.07443 1.22708 7.40923 1.35743 7.70131C1.5062 8.03803 2.04345 8.30551 3.11795 8.84047L7.44509 11.0629C7.93254 11.3vvv1 8.17626 11.4101 8.38334 11.5841C8.5677 11.738 8.61544 11.9199 8.61902 12.1056C8.6229 12.3094 8.56267 12.5515 8.44221 13.0359C8.33451 13.4658 8.28066 13.6808 8.18336 13.8608C8.09655 14.0213 7.98398 14.1645 7.85104 14.2829C7.70576 14.4145 7.52553 14.5158 7.16507 14.7184C6.59661 15.0272 6.31238 15.1816 6.08626 15.2029C5.88925 15.221 5.69223 15.1793 5.51766 15.0828C5.31935 14.9729 5.1656 14.7648 4.8581 14.3486L2.68276 11.5306"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
					</button>
				</div>
			{/if}
		</div>
	</div>

	<!-- Additional controls or regenerate/stop buttons -->
	{#if generating && !isLandingPage}
		<div class="flex justify-center my-2" in:fade={{ duration: 150, easing: quintOut }}>
			<button
				class="flex justify-center items-center gap-2 px-4 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
				on:click={stopGeneration}
			>
				<span>{_('controls.stop')}</span>
			</button>
		</div>
	{:else if showContinue && !generating && !isLandingPage}
		<div class="flex justify-center my-2" in:fade={{ duration: 150, easing: quintOut }}>
			<button
				class="flex justify-center items-center gap-2 px-4 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
				on:click={regenerateWithContinue}
			>
				<span>{_('controls.continue')}</span>
			</button>
		</div>
	{/if}
</div>
