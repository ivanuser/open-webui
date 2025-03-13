<script lang="ts">
	import { onMount, getContext, createEventDispatcher } from 'svelte';
	import { createMCPServer, updateMCPServer } from '$lib/apis/mcp';
	import Xcross from '../../icons/Xcross.svelte';
	import ChevronDown from '../../icons/ChevronDown.svelte';
	import { toast } from 'svelte-sonner';
	
	const i18n = getContext('i18n');
	const dispatch = createEventDispatcher();
	
	export let show = false;
	export let server = null;
	export let isEditing = false;
	
	let serverData = {
		id: '',
		name: '',
		type: 'memory',
		description: '',
		command: 'npx',
		args: [],
		env: {},
		status: 'disconnected',
		url: '',
		useRemote: false
	};
	
	let envKeys = [];
	let argsStr = '';
	let showAdvanced = false;
	
	// Server type options
	const serverTypes = [
		{ value: 'memory', label: 'Memory', description: 'Knowledge graph-based persistent memory system' },
		{ value: 'filesystem', label: 'Filesystem', description: 'Secure file operations with configurable access controls' },
		{ value: 'git', label: 'Git', description: 'Tools to read, search, and manipulate Git repositories' },
		{ value: 'github', label: 'GitHub', description: 'Repository management, file operations, and GitHub API integration' },
		{ value: 'everything', label: 'Everything', description: 'Reference / test server with prompts, resources, and tools' },
		{ value: 'brave-search', label: 'Brave Search', description: 'Web and local search using Brave\'s Search API' },
		{ value: 'fetch', label: 'Fetch', description: 'Web content fetching and conversion for efficient LLM usage' },
		{ value: 'postgresql', label: 'PostgreSQL', description: 'Read-only database access with schema inspection' },
		{ value: 'sqlite', label: 'SQLite', description: 'Database interaction and business intelligence capabilities' },
		{ value: 'time', label: 'Time', description: 'Time and timezone conversion capabilities' },
		{ value: 'sequential-thinking', label: 'Sequential Thinking', description: 'Dynamic and reflective problem-solving through thought sequences' }
	];
	
	onMount(() => {
		if (server && isEditing) {
			serverData = {
				...server,
				useRemote: !!server.url,
				env: server.env || {}
			};
			argsStr = server.args?.join(' ') || '';
			envKeys = Object.keys(serverData.env || {});
		}
	});
	
	const addEnvVar = () => {
		envKeys = [...envKeys, ''];
	};
	
	const removeEnvVar = (index) => {
		envKeys.splice(index, 1);
		envKeys = [...envKeys];
		
		// Also remove from the actual env object
		const newEnv = { ...serverData.env };
		delete newEnv[envKeys[index]];
		serverData.env = newEnv;
	};
	
	const createOrUpdateServer = async () => {
		try {
			if (!serverData.name) {
				toast.error($i18n.t('Server name is required'));
				return;
			}
			
			if (serverData.useRemote && !serverData.url) {
				toast.error($i18n.t('Server URL is required'));
				return;
			}
			
			if (!serverData.useRemote) {
				if (!serverData.command) {
					toast.error($i18n.t('Command is required'));
					return;
				}
				
				// Parse args from string
				serverData.args = argsStr
					.match(/(?:[^\s"]+|"[^"]*")+/g)
					?.map(arg => arg.replace(/^"(.*)"$/, '$1')) || [];
				
				// Clear URL if not using remote
				serverData.url = '';
			} else {
				// Clear command and args if using remote
				serverData.command = '';
				serverData.args = [];
			}
			
			// Process environment variables
			const env = {};
			envKeys.forEach(key => {
				if (key && serverData.env[key]) {
					env[key] = serverData.env[key];
				}
			});
			serverData.env = env;
			
			// Find the server type description
			const typeInfo = serverTypes.find(t => t.value === serverData.type);
			if (typeInfo && !serverData.description) {
				serverData.description = typeInfo.description;
			}
			
			// Generate an ID if not provided
			if (!serverData.id) {
				serverData.id = `${serverData.type}-${Date.now()}`;
			}
			
			if (isEditing) {
				const updatedServer = await updateMCPServer(localStorage.token, serverData.id, serverData);
				dispatch('update', updatedServer);
			} else {
				const newServer = await createMCPServer(localStorage.token, serverData);
				dispatch('add', newServer);
			}
		} catch (error) {
			console.error('Error creating/updating server:', error);
			toast.error(isEditing 
				? $i18n.t('Failed to update MCP server') 
				: $i18n.t('Failed to add MCP server'));
		}
	};
	
	// Dynamically get package name based on server type
	$: packageName = serverData.type ? `@modelcontextprotocol/server-${serverData.type}` : '';
	
	// Generate example command based on server type
	$: exampleCommand = serverData.type === 'git' 
		? 'uvx mcp-server-git --repository path/to/git/repo'
		: serverData.type === 'postgresql'
			? 'npx -y @modelcontextprotocol/server-postgres postgresql://localhost/mydb'
			: `npx -y ${packageName}`;
</script>

{#if show}
<div class="fixed inset-0 flex items-center justify-center z-50 p-4 overflow-y-auto">
	<div class="fixed inset-0 bg-black opacity-50" on:click={() => (show = false)}></div>
	
	<div class="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl p-6 relative z-10">
		<div class="flex justify-between items-center mb-4">
			<h2 class="text-xl font-semibold">
				{#if isEditing}
					{$i18n.t('Edit MCP Server')}
				{:else}
					{$i18n.t('Add MCP Server')}
				{/if}
			</h2>
			<button
				class="rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
				on:click={() => (show = false)}
			>
				<Xcross className="w-6 h-6" />
			</button>
		</div>
		
		<div class="grid grid-cols-1 gap-4">
			<div>
				<label class="block text-sm font-medium mb-1" for="server-name">
					{$i18n.t('Name')}
				</label>
				<input
					id="server-name"
					type="text"
					bind:value={serverData.name}
					class="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-800"
					placeholder={$i18n.t('Enter server name')}
				/>
			</div>
			
			<div>
				<label class="block text-sm font-medium mb-1" for="server-type">
					{$i18n.t('Server Type')}
				</label>
				<div class="relative">
					<select
						id="server-type"
						bind:value={serverData.type}
						class="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg appearance-none dark:bg-gray-800"
					>
						{#each serverTypes as type}
							<option value={type.value}>{type.label}</option>
						{/each}
					</select>
					<div class="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
						<ChevronDown className="w-4 h-4" />
					</div>
				</div>
				{#if serverData.type}
					<p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
						{serverTypes.find(t => t.value === serverData.type)?.description || ''}
					</p>
				{/if}
			</div>
			
			<div>
				<label class="block text-sm font-medium mb-1" for="connection-type">
					{$i18n.t('Connection Type')}
				</label>
				<div class="flex items-center space-x-4">
					<label class="flex items-center">
						<input 
							type="radio" 
							name="connection-type" 
							bind:group={serverData.useRemote} 
							value={false}
							class="mr-2" 
						/>
						{$i18n.t('Local Command')}
					</label>
					<label class="flex items-center">
						<input 
							type="radio" 
							name="connection-type" 
							bind:group={serverData.useRemote} 
							value={true}
							class="mr-2" 
						/>
						{$i18n.t('Remote URL')}
					</label>
				</div>
			</div>
			
			{#if serverData.useRemote}
				<div>
					<label class="block text-sm font-medium mb-1" for="server-url">
						{$i18n.t('Server URL')}
					</label>
					<input
						id="server-url"
						type="text"
						bind:value={serverData.url}
						class="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-800"
						placeholder="http://localhost:8000"
					/>
					<p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
						{$i18n.t('The URL where the MCP server is running')}
					</p>
				</div>
			{:else}
				<div>
					<label class="block text-sm font-medium mb-1" for="server-command">
						{$i18n.t('Command')}
					</label>
					<input
						id="server-command"
						type="text"
						bind:value={serverData.command}
						class="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-800"
						placeholder="npx"
					/>
					<p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
						{$i18n.t('Command to start the server (e.g., npx, uvx)')}
					</p>
				</div>
				
				<div>
					<label class="block text-sm font-medium mb-1" for="server-args">
						{$i18n.t('Arguments')}
					</label>
					<input
						id="server-args"
						type="text"
						bind:value={argsStr}
						class="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-800"
						placeholder="-y @modelcontextprotocol/server-memory"
					/>
					<p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
						{$i18n.t('Example:')} {exampleCommand}
					</p>
				</div>
			{/if}
			
			<div>
				<button
					class="text-sm font-medium flex items-center text-blue-500 hover:text-blue-700 transition"
					on:click={() => (showAdvanced = !showAdvanced)}
				>
					<span class="mr-1">{showAdvanced ? $i18n.t('Hide Advanced Options') : $i18n.t('Show Advanced Options')}</span>
					<svg
						class="w-4 h-4 transition-transform {showAdvanced ? 'rotate-180' : ''}"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
					</svg>
				</button>
			</div>
			
			{#if showAdvanced}
				<div class="border-t border-gray-200 dark:border-gray-700 pt-4">
					<div class="mb-4">
						<label class="block text-sm font-medium mb-1">
							{$i18n.t('Environment Variables')}
						</label>
						
						{#each envKeys as key, i}
							<div class="flex space-x-2 mb-2">
								<input
									type="text"
									bind:value={envKeys[i]}
									class="w-1/3 p-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-800"
									placeholder="VARIABLE_NAME"
								/>
								<input
									type="text"
									bind:value={serverData.env[key]}
									class="flex-1 p-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-800"
									placeholder="value"
								/>
								<button
									class="p-2 text-red-500 hover:text-red-700 transition"
									on:click={() => removeEnvVar(i)}
								>
									<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
										<path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
									</svg>
								</button>
							</div>
						{/each}
						
						<button
							class="text-sm flex items-center text-blue-500 hover:text-blue-700 transition"
							on:click={addEnvVar}
						>
							<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
								<path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd" />
							</svg>
							{$i18n.t('Add Environment Variable')}
						</button>
					</div>
					
					<div>
						<label class="block text-sm font-medium mb-1" for="server-description">
							{$i18n.t('Description')}
						</label>
						<textarea
							id="server-description"
							bind:value={serverData.description}
							class="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-800"
							placeholder={$i18n.t('Enter a description for this server')}
							rows="2"
						></textarea>
					</div>
				</div>
			{/if}
		</div>
		
		<div class="flex justify-end mt-6 space-x-2">
			<button
				class="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
				on:click={() => (show = false)}
			>
				{$i18n.t('Cancel')}
			</button>
			<button
				class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
				on:click={createOrUpdateServer}
			>
				{isEditing ? $i18n.t('Update') : $i18n.t('Add')}
			</button>
		</div>
	</div>
</div>
{/if}
