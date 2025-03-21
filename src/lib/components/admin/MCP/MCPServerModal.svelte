<!-- MCP Server Configuration Modal -->
<script>
	import { createEventDispatcher } from 'svelte';
	import { fade } from 'svelte/transition';
	import { standardMCPServers, generateMCPServerConfig } from './MCPServerConfig.js';
	
	export let open = false;
	export let serverToEdit = null;
	
	const dispatch = createEventDispatcher();
	let serverType = 'filesystem';
	let serverName = '';
	let serverUrl = '';
	let serverCommand = 'npx';
	let serverArgs = [];
	let serverDescription = '';
	let serverEnv = {};
	let basePath = '/tmp';
	let port = 3500;
	let apiKey = '';
	let useCustomCommand = false;
	let manualCommandInput = '';
	let activeTab = 'config';
	
	// Form validation
	let nameError = '';
	let basePathError = '';
	let portError = '';
	
	$: isEditMode = !!serverToEdit;
	
	// Reset form when modal opens
	$: if (open) {
		resetForm();
		if (serverToEdit) {
			populateFormWithServer(serverToEdit);
		}
	}
	
	function resetForm() {
		serverType = 'filesystem';
		serverName = '';
		serverUrl = '';
		serverCommand = 'npx';
		serverArgs = ['-y', '@modelcontextprotocol/server-filesystem', '/tmp'];
		serverDescription = '';
		serverEnv = {};
		basePath = '/tmp';
		port = 3500;
		apiKey = '';
		useCustomCommand = false;
		manualCommandInput = '';
		activeTab = 'config';
		nameError = '';
		basePathError = '';
		portError = '';
	}
	
	function populateFormWithServer(server) {
		serverType = server.type || 'filesystem';
		serverName = server.name || '';
		serverUrl = server.url || '';
		serverCommand = server.command || 'npx';
		serverArgs = server.args || [];
		serverDescription = server.description || '';
		serverEnv = server.env || {};
		
		// Extract basePath from args if available
		if (serverType === 'filesystem' || serverType === 'filesystem-py') {
			const pathArg = serverArgs[serverArgs.length - 1];
			if (pathArg && !pathArg.startsWith('--')) {
				basePath = pathArg;
			}
		}
		
		// Extract port from args if available
		const portArgIndex = serverArgs.indexOf('--port');
		if (portArgIndex !== -1 && portArgIndex < serverArgs.length - 1) {
			port = parseInt(serverArgs[portArgIndex + 1], 10) || 3500;
		}
		
		apiKey = server.apiKey || '';
		
		// Determine if custom command is being used
		const standardConfig = standardMCPServers[serverType];
		if (standardConfig) {
			const standardCommand = standardConfig.defaultCommand;
			const standardBaseArgs = standardConfig.defaultArgs.slice(0, 2); // Usually 'npx' and '@modelcontextprotocol/server-xyz'
			
			useCustomCommand = serverCommand !== standardCommand || 
				!serverArgs.slice(0, 2).every((arg, i) => arg === standardBaseArgs[i]);
		} else {
			useCustomCommand = true;
		}
		
		// Generate manual command string if using custom command
		if (useCustomCommand) {
			manualCommandInput = `${serverCommand} ${serverArgs.join(' ')}`;
		}
	}
	
	function handleTypeChange(event) {
		serverType = event.target.value;
		
		if (!useCustomCommand) {
			// Update command and args based on selected type
			const config = standardMCPServers[serverType];
			if (config) {
				serverCommand = config.defaultCommand;
				serverArgs = [...config.defaultArgs];
				
				// Add basePath for filesystem type
				if (serverType === 'filesystem' || serverType === 'filesystem-py') {
					serverArgs.push(basePath);
				}
				
				// Update description
				serverDescription = config.description;
			}
		}
	}
	
	function handleSave() {
		// Validate form
		nameError = !serverName.trim() ? 'Server name is required' : '';
		
		if ((serverType === 'filesystem' || serverType === 'filesystem-py') && !useCustomCommand) {
			basePathError = !basePath.trim() ? 'Base path is required' : '';
		}
		
		portError = !port || port < 1000 || port > 65535 ? 'Port must be between 1000 and 65535' : '';
		
		if (nameError || basePathError || portError) {
			return;
		}
		
		// Build server configuration
		let serverConfig = {
			id: serverToEdit?.id || crypto.randomUUID(),
			name: serverName,
			type: serverType,
			description: serverDescription,
			status: 'disconnected'
		};
		
		if (useCustomCommand) {
			// Parse manual command input
			const parts = manualCommandInput.trim().split(/\s+/);
			if (parts.length > 0) {
				serverConfig.command = parts[0];
				serverConfig.args = parts.slice(1);
			} else {
				alert('Please enter a valid command');
				return;
			}
		} else {
			// Use standard configuration
			const standardConfig = generateMCPServerConfig({
				type: serverType,
				basePath,
				port
			});
			
			serverConfig.command = standardConfig.command;
			serverConfig.args = standardConfig.args;
			serverConfig.env = standardConfig.env;
		}
		
		// Add URL
		serverConfig.url = `http://localhost:${port}`;
		
		// Add API key if provided
		if (apiKey) {
			serverConfig.apiKey = apiKey;
		}
		
		dispatch('save', serverConfig);
		open = false;
	}
	
	function handleCancel() {
		open = false;
	}
</script>

{#if open}
<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" transition:fade>
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-2xl w-full mx-4 p-6" in:fade={{ duration: 200 }}>
        <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-semibold">{isEditMode ? 'Edit MCP Server' : 'Add MCP Server'}</h2>
            <button 
                class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                on:click={handleCancel}
            >
                ✕
            </button>
        </div>
        
        <p class="text-gray-600 dark:text-gray-400 mb-4">
            Configure a Model Context Protocol server to extend AI capabilities
        </p>
        
        <div class="mb-4">
            <div class="flex border-b border-gray-300 dark:border-gray-700">
                <button 
                    class="px-4 py-2 {activeTab === 'config' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-500'}"
                    on:click={() => activeTab = 'config'}
                >
                    Configuration
                </button>
                <button 
                    class="px-4 py-2 {activeTab === 'advanced' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-500'}"
                    on:click={() => activeTab = 'advanced'}
                >
                    Advanced
                </button>
            </div>
        </div>
        
        {#if activeTab === 'config'}
            <div class="space-y-4">
                <!-- Server Name -->
                <div class="grid grid-cols-4 gap-4">
                    <label for="server-name" class="col-span-1 flex items-center text-sm font-medium">
                        Name
                    </label>
                    <div class="col-span-3">
                        <input 
                            id="server-name" 
                            type="text" 
                            class="w-full rounded border border-gray-300 dark:border-gray-700 dark:bg-gray-900 px-3 py-2"
                            bind:value={serverName} 
                        />
                        {#if nameError}
                            <p class="text-red-500 text-xs mt-1">{nameError}</p>
                        {/if}
                    </div>
                </div>
                
                <!-- Server Type -->
                <div class="grid grid-cols-4 gap-4">
                    <label for="server-type" class="col-span-1 flex items-center text-sm font-medium">
                        Type
                    </label>
                    <div class="col-span-3">
                        <select 
                            id="server-type" 
                            class="w-full rounded border border-gray-300 dark:border-gray-700 dark:bg-gray-900 px-3 py-2"
                            bind:value={serverType}
                            on:change={handleTypeChange}
                        >
                            {#each Object.entries(standardMCPServers) as [type, config]}
                                <option value={type}>
                                    {config.name} - {config.description}
                                </option>
                            {/each}
                        </select>
                    </div>
                </div>
                
                <!-- Base Path (for filesystem) -->
                {#if serverType === 'filesystem' || serverType === 'filesystem-py'}
                    <div class="grid grid-cols-4 gap-4">
                        <label for="base-path" class="col-span-1 flex items-center text-sm font-medium">
                            Base Path
                        </label>
                        <div class="col-span-3">
                            <input 
                                id="base-path" 
                                type="text" 
                                class="w-full rounded border border-gray-300 dark:border-gray-700 dark:bg-gray-900 px-3 py-2"
                                bind:value={basePath} 
                            />
                            {#if basePathError}
                                <p class="text-red-500 text-xs mt-1">{basePathError}</p>
                            {/if}
                        </div>
                    </div>
                {/if}
                
                <!-- Port -->
                <div class="grid grid-cols-4 gap-4">
                    <label for="port" class="col-span-1 flex items-center text-sm font-medium">
                        Port
                    </label>
                    <div class="col-span-3">
                        <input 
                            id="port" 
                            type="number" 
                            class="w-full rounded border border-gray-300 dark:border-gray-700 dark:bg-gray-900 px-3 py-2"
                            bind:value={port} 
                        />
                        {#if portError}
                            <p class="text-red-500 text-xs mt-1">{portError}</p>
                        {/if}
                    </div>
                </div>
                
                <!-- Environment Variables -->
                {#if serverType === 'brave-search' && !useCustomCommand}
                    <div class="grid grid-cols-4 gap-4">
                        <label for="brave-api-key" class="col-span-1 flex items-center text-sm font-medium">
                            Brave API Key
                        </label>
                        <div class="col-span-3">
                            <input 
                                id="brave-api-key" 
                                type="password" 
                                class="w-full rounded border border-gray-300 dark:border-gray-700 dark:bg-gray-900 px-3 py-2"
                                bind:value={serverEnv.BRAVE_API_KEY} 
                            />
                        </div>
                    </div>
                {/if}
                
                {#if serverType === 'github' && !useCustomCommand}
                    <div class="grid grid-cols-4 gap-4">
                        <label for="github-token" class="col-span-1 flex items-center text-sm font-medium">
                            GitHub Token
                        </label>
                        <div class="col-span-3">
                            <input 
                                id="github-token" 
                                type="password" 
                                class="w-full rounded border border-gray-300 dark:border-gray-700 dark:bg-gray-900 px-3 py-2"
                                bind:value={serverEnv.GITHUB_PERSONAL_ACCESS_TOKEN} 
                            />
                        </div>
                    </div>
                {/if}
                
                <!-- API Key -->
                <div class="grid grid-cols-4 gap-4">
                    <label for="api-key" class="col-span-1 flex items-center text-sm font-medium">
                        API Key
                    </label>
                    <div class="col-span-3">
                        <input 
                            id="api-key" 
                            type="password" 
                            class="w-full rounded border border-gray-300 dark:border-gray-700 dark:bg-gray-900 px-3 py-2"
                            bind:value={apiKey} 
                            placeholder="Leave blank for no authentication"
                        />
                        <p class="text-gray-500 text-xs mt-1">Optional</p>
                    </div>
                </div>
            </div>
        {:else if activeTab === 'advanced'}
            <div class="space-y-4">
                <!-- Custom Command Toggle -->
                <div class="flex items-center mb-4">
                    <input 
                        id="use-custom-command" 
                        type="checkbox" 
                        class="w-4 h-4 text-blue-600"
                        bind:checked={useCustomCommand} 
                    />
                    <label for="use-custom-command" class="ml-2 text-sm font-medium">
                        Use custom command
                    </label>
                </div>
                
                <!-- Custom Command Input -->
                {#if useCustomCommand}
                    <div class="grid grid-cols-4 gap-4">
                        <label for="manual-command" class="col-span-1 flex items-center text-sm font-medium">
                            Command
                        </label>
                        <div class="col-span-3">
                            <input 
                                id="manual-command" 
                                type="text" 
                                class="w-full rounded border border-gray-300 dark:border-gray-700 dark:bg-gray-900 px-3 py-2"
                                bind:value={manualCommandInput} 
                                placeholder="npx -y @modelcontextprotocol/server-filesystem /path/to/files"
                            />
                        </div>
                    </div>
                {:else}
                    <!-- Generated Command Preview -->
                    <div class="border rounded p-3 border-gray-300 dark:border-gray-700">
                        <p class="text-sm font-medium mb-2">Generated Command:</p>
                        <pre class="text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded overflow-x-auto">{serverCommand} {serverArgs.join(' ')}</pre>
                    </div>
                {/if}
                
                <!-- Server URL -->
                <div class="grid grid-cols-4 gap-4">
                    <label for="server-url" class="col-span-1 flex items-center text-sm font-medium">
                        Server URL
                    </label>
                    <div class="col-span-3">
                        <input 
                            id="server-url" 
                            type="text" 
                            class="w-full rounded border border-gray-300 dark:border-gray-700 dark:bg-gray-900 px-3 py-2 bg-gray-100 dark:bg-gray-800"
                            value={`http://localhost:${port}`}
                            disabled
                        />
                        <p class="text-gray-500 text-xs mt-1">Auto-generated from port</p>
                    </div>
                </div>
            </div>
        {/if}
        
        <!-- Footer -->
        <div class="flex justify-end mt-6 space-x-2">
            <button 
                class="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                on:click={handleCancel}
            >
                Cancel
            </button>
            <button 
                class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                on:click={handleSave}
            >
                {isEditMode ? 'Update' : 'Add'} Server
            </button>
        </div>
    </div>
</div>
{/if}
