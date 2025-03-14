<script lang="ts">
	import { createEventDispatcher, getContext } from 'svelte';
	const dispatch = createEventDispatcher();
	const i18n = getContext('i18n');

	import XMark from '$lib/components/icons/XMark.svelte';
	import AdvancedParams from '../Settings/Advanced/AdvancedParams.svelte';
	import Valves from '$lib/components/chat/Controls/Valves.svelte';
	import FileItem from '$lib/components/common/FileItem.svelte';
	import Collapsible from '$lib/components/common/Collapsible.svelte';
	import MCPServerSelector from '../MCPServerSelector.svelte';
	import MCPInstructions from './MCPInstructions.svelte';

	import { user, mcpServers, config } from '$lib/stores';
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
				// Only update if it doesn't already contain MCP instructions
				if (!params.system || !params.system.includes('MCP server')) {
					const mcpSystemInstructions = getMCPSystemInstructions(server);
					// Only append if there are instructions to add
					if (mcpSystemInstructions) {
						const currentPrompt = params.system || '';
						// Only add if it's not already there
						if (!currentPrompt.includes(mcpSystemInstructions)) {
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
		
		if (server.type === 'filesystem') {
			instructions = `You have access to a file system through the MCP filesystem server. When the user asks you to access files or directories, use the MCP filesystem server capabilities. The allowed path is ${server.args?.[server.args.length - 1] || '/home'}.`;
		} else if (server.type === 'memory') {
			instructions = `You have access to a persistent memory system through the MCP memory server. When the user asks you to remember information or retrieve previously stored knowledge, use the MCP memory server capabilities.`;
		} else {
			instructions = `You have access to additional capabilities through the connected MCP server of type ${server.type}. When the user asks you to use these capabilities, utilize the MCP server.`;
		}
		
		return instructions;
	}
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
						rows="4"
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
