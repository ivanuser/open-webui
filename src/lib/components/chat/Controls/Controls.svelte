<script lang="ts">
	import { createEventDispatcher, getContext, onMount } from 'svelte';
	const dispatch = createEventDispatcher();
	const i18n = getContext('i18n');

	import XMark from '$lib/components/icons/XMark.svelte';
	import AdvancedParams from '../Settings/Advanced/AdvancedParams.svelte';
	import Valves from '$lib/components/chat/Controls/Valves.svelte';
	import FileItem from '$lib/components/common/FileItem.svelte';
	import Collapsible from '$lib/components/common/Collapsible.svelte';
	import MCPServerSelector from '../MCPServerSelector.svelte';
	import MCPInstructions from './MCPInstructions.svelte';

	import { user, mcpServers, config, settings } from '$lib/stores';
	export let models = [];
	export let chatFiles = [];
	export let params = {};

	let showValves = false;
	let showMCP = false;
	let selectedMCPServer = '';
	
	$: hasMCPServers = $mcpServers && $mcpServers.length > 0;
	$: connectedMCPServers = $mcpServers?.filter(server => server.status === 'connected') || [];
	
	// Add MCP Server instructions to the system prompt when a server is selected
	$: {
		if (selectedMCPServer) {
			const server = $mcpServers?.find(s => s.id === selectedMCPServer);
			if (server?.status === 'connected') {
				// Generate MCP system instructions
				const mcpSystemInstructions = getMCPSystemInstructions(server);
				
				// Check if we need to update the system prompt
				if (mcpSystemInstructions) {
					// Get current system prompt
					const currentPrompt = params.system || '';
					
					// Check if the system prompt already contains MCP instructions
					if (!currentPrompt.includes('MCP server')) {
						// Update system prompt with MCP instructions
						params.system = currentPrompt + (currentPrompt ? '\n\n' : '') + mcpSystemInstructions;
					} else {
						// Replace existing MCP instructions
						const mcpInstructionPattern = /You have access to.*?(?=\n\n|$)/s;
						if (mcpInstructionPattern.test(currentPrompt)) {
							params.system = currentPrompt.replace(mcpInstructionPattern, mcpSystemInstructions);
						} else {
							// Just append if we can't find the pattern
							params.system = currentPrompt + (currentPrompt ? '\n\n' : '') + mcpSystemInstructions;
						}
					}
				}
			}
		}
	}
	
	// Function to generate system prompt instructions for MCP servers
	function getMCPSystemInstructions(server) {
		if (!server) return '';
		
		let instructions = '';
		
		if (server.type === 'filesystem' || server.type === 'filesystem-py') {
			// Get the allowed path from the server args
			const allowedPath = server.args?.[server.args.length - 1] || 'C:\\Users\\ihoner\\Documents';
			// Normalize path for Windows
			const normalizedPath = allowedPath.replace(/\//g, '\\');
			
			instructions = `You have access to a file system through the MCP filesystem server. When the user asks about files or directories, ALWAYS use the MCP tools described below.

IMPORTANT:
1. You must ONLY access files within: ${normalizedPath}
2. All paths must be ABSOLUTE, starting with ${normalizedPath}
3. ALWAYS USE \\ (BACKSLASH) for Windows paths

Available MCP tools:
- list_directory(path): Lists files and folders in a directory
- read_file(path): Reads the content of a text file
- write_file(path, content): Creates or overwrites a file
- create_directory(path): Creates a new directory
- search_files(path, pattern): Finds files matching a pattern
- get_file_info(path): Gets metadata about a file

Examples:
- To list files in ${normalizedPath}: Use list_directory with path="${normalizedPath}"
- To read a file: Use read_file with path="${normalizedPath}\\example.txt"
- To create a file: Use write_file with path="${normalizedPath}\\newfile.txt"

When a user asks about files, directories, or performing file operations - even if they don't explicitly mention MCP - you MUST use these tools rather than guessing or making up responses. DO NOT make up file contents or directory listings.`;
		} else if (server.type === 'memory') {
			instructions = `You have access to a persistent memory system through the MCP memory server. When the user asks you to remember information or retrieve previously stored knowledge, use the MCP memory server capabilities. This allows you to store information persistently and recall it in future conversations, even after the current session ends.

Please use the memory server for:
- Storing important information the user wants to save
- Recalling previously stored information
- Building on knowledge across multiple conversations

When using the memory server, be explicit about what you're storing or retrieving.`;
		} else {
			instructions = `You have access to additional capabilities through the connected MCP server of type ${server.type}. When the user asks you to use these capabilities, utilize the MCP server. Follow the user's instructions regarding the MCP server carefully.`;
		}
		
		return instructions;
	}
	
	onMount(() => {
		// Set the selected MCP server from settings if available
		if ($settings?.defaultMcpServer) {
			selectedMCPServer = $settings.defaultMcpServer;
		} else if ($settings?.enabledMcpServers && $settings.enabledMcpServers.length > 0) {
			// Use the first enabled server if no default is set
			selectedMCPServer = $settings.enabledMcpServers[0];
		}
		
		// If there's a selection, verify it exists and is connected
		if (selectedMCPServer && $mcpServers) {
			const server = $mcpServers.find(s => s.id === selectedMCPServer);
			if (!server) {
				// Reset if server doesn't exist
				selectedMCPServer = '';
			} else if (server.status !== 'connected') {
				// Optionally, you could try to connect automatically here
				console.log(`Selected MCP server ${selectedMCPServer} is not connected`);
			}
		}
		
		// Set showMCP to true if we have a selected server
		if (selectedMCPServer) {
			showMCP = true;
		}
	});
</script>

<div class="dark:text-white">
	<div class="flex items-center justify-between dark:text-gray-100 mb-4">
		<div class="text-lg font-medium self-center font-primary">{$i18n.t('Chat Controls')}</div>
		<button
			class="self-center"
			on:click={() => {
				dispatch('close');
			}}
		>
			<XMark className="size-3.5" />
		</button>
	</div>

	{#if $user.role === 'admin' || $user?.permissions.chat?.controls}
		<div class="dark:text-gray-200 text-sm font-primary py-0.5 px-0.5">
			{#if chatFiles.length > 0}
				<Collapsible title={$i18n.t('Files')} open={true} buttonClassName="w-full">
					<div class="flex flex-col gap-1 mt-1.5" slot="content">
						{#each chatFiles as file, fileIdx}
							<FileItem
								className="w-full"
								item={file}
								edit={true}
								url={file?.url ? file.url : null}
								name={file.name}
								type={file.type}
								size={file?.size}
								dismissible={true}
								on:dismiss={() => {
									// Remove the file from the chatFiles array

									chatFiles.splice(fileIdx, 1);
									chatFiles = chatFiles;
								}}
								on:click={() => {
									console.log(file);
								}}
							/>
						{/each}
					</div>
				</Collapsible>

				<hr class="my-3 border-gray-200 dark:border-gray-700" />
			{/if}

			{#if hasMCPServers}
				<Collapsible 
					bind:open={showMCP} 
					title={$i18n.t('MCP Servers')} 
					buttonClassName="w-full"
					badge={connectedMCPServers.length > 0 ? connectedMCPServers.length : undefined}
				>
					<div class="mt-2 mb-1" slot="content">
						<MCPServerSelector bind:selectedServer={selectedMCPServer} />
						
						{#if selectedMCPServer}
							{#if connectedMCPServers.some(s => s.id === selectedMCPServer)}
								<div class="text-xs bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 mt-2 p-2 rounded-md">
									<div class="flex items-center">
										<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4 mr-1">
											<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" />
										</svg>
										{$i18n.t('Using MCP server for enhanced capabilities')}
									</div>
								</div>
							{:else}
								<div class="text-xs bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 mt-2 p-2 rounded-md">
									<div class="flex items-center">
										<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4 mr-1">
											<path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
										</svg>
										{$i18n.t('Connect to the MCP server to use it')}
									</div>
								</div>
							{/if}
							
							<MCPInstructions {selectedMCPServer} />
						{/if}
					</div>
				</Collapsible>

				<hr class="my-3 border-gray-200 dark:border-gray-700" />
			{/if}

			<Collapsible bind:open={showValves} title={$i18n.t('Valves')} buttonClassName="w-full">
				<div class="text-sm my-1" slot="content">
					<Valves show={showValves} />
				</div>
			</Collapsible>

			<hr class="my-3 border-gray-200 dark:border-gray-700" />

			<Collapsible title={$i18n.t('System Prompt')} open={true} buttonClassName="w-full">
				<div class="my-1" slot="content">
					<textarea
						bind:value={params.system}
						class="w-full text-sm py-2 px-3 border border-gray-200 dark:border-gray-700 rounded-md bg-transparent outline-hidden resize-none"
						rows="8"
						placeholder={$i18n.t('Enter system prompt')}
					/>
				</div>
			</Collapsible>

			<hr class="my-3 border-gray-200 dark:border-gray-700" />

			<Collapsible title={$i18n.t('Advanced Params')} open={true} buttonClassName="w-full">
				<div class="text-sm mt-1.5" slot="content">
					<div>
						<AdvancedParams admin={$user?.role === 'admin'} bind:params />
					</div>
				</div>
			</Collapsible>
		</div>
	{:else}
		<div class="text-sm dark:text-gray-300 text-center py-2 px-10">
			{$i18n.t('You do not have permission to access this feature.')}
		</div>
	{/if}
</div>
