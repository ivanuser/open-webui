<!-- MCP Server Configuration Modal -->
<script>
	import { createEventDispatcher } from 'svelte';
	import { fade } from 'svelte/transition';
	import { standardMCPServers, generateMCPServerConfig } from './MCPServerConfig.js';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Card from '$lib/components/ui/card';
	import * as Button from '$lib/components/ui/button';
	import * as Select from '$lib/components/ui/select';
	import * as Input from '$lib/components/ui/input';
	import * as Label from '$lib/components/ui/label';
	import * as Tabs from '$lib/components/ui/tabs';
	import { toast } from '$lib/components/ui/toasts';
	
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
	let serverTabs = 'config';
	
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
		serverTabs = 'config';
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
		if (serverType === 'filesystem') {
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
				if (serverType === 'filesystem') {
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
		
		if (serverType === 'filesystem' && !useCustomCommand) {
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
				toast({
					title: 'Invalid Command',
					description: 'Please enter a valid command',
					type: 'error'
				});
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

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-[600px]">
		<Dialog.Header>
			<Dialog.Title>{isEditMode ? 'Edit MCP Server' : 'Add MCP Server'}</Dialog.Title>
			<Dialog.Description>
				Configure a Model Context Protocol server to extend AI capabilities
			</Dialog.Description>
		</Dialog.Header>
		
		<Tabs.Root value={serverTabs}>
			<Tabs.List>
				<Tabs.Trigger value="config">Configuration</Tabs.Trigger>
				<Tabs.Trigger value="advanced">Advanced</Tabs.Trigger>
			</Tabs.List>
			
			<Tabs.Content value="config" class="pt-4">
				<div class="grid gap-4">
					<div class="grid grid-cols-4 items-center gap-4">
						<Label.Root for="server-name" class="text-right">
							Name
						</Label.Root>
						<Input.Root id="server-name" class="col-span-3" bind:value={serverName} />
						{#if nameError}
							<div class="col-span-3 col-start-2 text-xs text-red-500">{nameError}</div>
						{/if}
					</div>
					
					<div class="grid grid-cols-4 items-center gap-4">
						<Label.Root for="server-type" class="text-right">
							Type
						</Label.Root>
						<Select.Root bind:value={serverType} onchange={handleTypeChange} class="col-span-3">
							<Select.Trigger id="server-type">
								<Select.Value placeholder="Select server type" />
							</Select.Trigger>
							<Select.Content>
								<Select.Group>
									{#each Object.entries(standardMCPServers) as [type, config]}
										<Select.Item value={type}>
											{config.name} - {config.description}
										</Select.Item>
									{/each}
								</Select.Group>
							</Select.Content>
						</Select.Root>
					</div>
					
					{#if serverType === 'filesystem'}
						<div class="grid grid-cols-4 items-center gap-4">
							<Label.Root for="base-path" class="text-right">
								Base Path
							</Label.Root>
							<Input.Root id="base-path" class="col-span-3" bind:value={basePath} />
							{#if basePathError}
								<div class="col-span-3 col-start-2 text-xs text-red-500">{basePathError}</div>
							{/if}
						</div>
					{/if}
					
					<div class="grid grid-cols-4 items-center gap-4">
						<Label.Root for="port" class="text-right">
							Port
						</Label.Root>
						<Input.Root id="port" type="number" class="col-span-3" bind:value={port} />
						{#if portError}
							<div class="col-span-3 col-start-2 text-xs text-red-500">{portError}</div>
						{/if}
					</div>
					
					{#if serverType === 'github'}
						<div class="grid grid-cols-4 items-center gap-4">
							<Label.Root for="github-token" class="text-right">
								GitHub Token
							</Label.Root>
							<Input.Root id="github-token" type="password" class="col-span-3" 
								bind:value={serverEnv.GITHUB_PERSONAL_ACCESS_TOKEN} />
						</div>
					{/if}
					
					<div class="grid grid-cols-4 items-center gap-4">
						<Label.Root for="api-key" class="text-right">
							API Key (Optional)
						</Label.Root>
						<Input.Root id="api-key" type="password" class="col-span-3" 
							bind:value={apiKey} placeholder="Leave blank for no authentication" />
					</div>
				</div>
			</Tabs.Content>
			
			<Tabs.Content value="advanced" class="pt-4">
				<div class="grid gap-4">
					<div class="flex items-center gap-2">
						<input type="checkbox" id="use-custom-command" bind:checked={useCustomCommand} />
						<Label.Root for="use-custom-command">
							Use custom command
						</Label.Root>
					</div>
					
					{#if useCustomCommand}
						<div class="grid grid-cols-4 items-center gap-4">
							<Label.Root for="manual-command" class="text-right">
								Command
							</Label.Root>
							<Input.Root id="manual-command" class="col-span-3" 
								bind:value={manualCommandInput} 
								placeholder="npx -y @modelcontextprotocol/server-filesystem /path/to/files" />
						</div>
					{:else}
						<div class="border p-3 rounded-md">
							<p class="text-sm font-medium mb-2">Generated Command:</p>
							<pre class="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto">{serverCommand} {serverArgs.join(' ')}</pre>
						</div>
					{/if}
					
					<div class="grid grid-cols-4 items-center gap-4">
						<Label.Root for="server-url" class="text-right">
							Server URL
						</Label.Root>
						<div class="col-span-3">
							<Input.Root id="server-url" disabled value={`http://localhost:${port}`} />
							<p class="text-xs text-gray-500 mt-1">Auto-generated from port</p>
						</div>
					</div>
				</div>
			</Tabs.Content>
		</Tabs.Root>
		
		<Dialog.Footer>
			<Button.Root variant="outline" on:click={handleCancel}>Cancel</Button.Root>
			<Button.Root on:click={handleSave}>{isEditMode ? 'Update' : 'Add'} Server</Button.Root>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
