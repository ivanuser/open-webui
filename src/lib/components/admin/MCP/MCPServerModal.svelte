<script lang="ts">
	import { createEventDispatcher, getContext } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { v4 as uuidv4 } from 'uuid';
	
	import { createMCPServer, updateMCPServer } from '$lib/apis/mcp';
	import Modal from '$lib/components/common/Modal.svelte';
	import Radio from '$lib/components/common/Radio.svelte';
	import RangeSlider from '$lib/components/common/RangeSlider.svelte';
	
	const i18n = getContext('i18n');
	const dispatch = createEventDispatcher();
	
	export let show = true;
	export let server = null;
	export let isEditing = false;
	
	let serverTypes = [
		{
			id: 'memory',
			name: 'Memory Server', 
			description: 'Knowledge graph-based persistent memory system',
			command: 'npx',
			args: ['-y', '@modelcontextprotocol/server-memory']
		},
		{
			id: 'filesystem',
			name: 'Filesystem Server', 
			description: 'File system operations with configurable access controls',
			command: 'node',
			args: ['mcp_filesystem_server.js', 'C:\\Users\\ihoner\\Documents'] // Using our custom implementation
		},
		{
			id: 'filesystem-py',
			name: 'Filesystem Server (Python)', 
			description: 'Python-based file system operations',
			command: 'python',
			args: ['filesystem_mcp_server.py', 'C:\\Users\\ihoner\\Documents'] // Using Python implementation
		}
	];
	
	// Set up form fields
	let id = server?.id || '';
	let name = server?.name || '';
	let type = server?.type || 'memory';
	let description = server?.description || '';
	let command = server?.command || 'npx';
	let args = server?.args ? [...server?.args] : [];
	
	// Set up the selected server type
	let selectedType = serverTypes.find(t => t.id === type) || serverTypes[0];
	
	// Update args when the type changes
	$: {
		if (selectedType && !isEditing) {
			command = selectedType.command;
			args = [...selectedType.args];
		}
	}
	
	// Function to update args as string for the text input
	let argsString = '';
	$: {
		// Update argsString when args changes
		argsString = args.join(' ');
	}
	
	// Update args when argsString changes
	function updateArgsFromString() {
		args = argsString.split(/\s+/).filter(a => a.trim() !== '');
	}
	
	const getDirectoryPath = () => {
		// For filesystem servers, get the last arg which should be the directory path
		if ((type === 'filesystem' || type === 'filesystem-py') && args.length > 0) {
			return args[args.length - 1];
		}
		return 'C:\\Users\\ihoner\\Documents'; // Default path
	};
	
	const setDirectoryPath = (path) => {
		// For filesystem servers, update the last arg which should be the directory path
		if (type === 'filesystem') {
			// Ensure we have the basic args
			if (args.length < 1) {
				args = ['mcp_filesystem_server.js'];
			}
			
			// Update or add the path
			if (args.length > 1) {
				args[args.length - 1] = path;
			} else {
				args.push(path);
			}
			
			// Update the args string
			argsString = args.join(' ');
		} else if (type === 'filesystem-py') {
			// Ensure we have the basic args
			if (args.length < 1) {
				args = ['filesystem_mcp_server.py'];
			}
			
			// Update or add the path
			if (args.length > 1) {
				args[args.length - 1] = path;
			} else {
				args.push(path);
			}
			
			// Update the args string
			argsString = args.join(' ');
		}
	};
	
	// For editing the directory path
	let directoryPath = getDirectoryPath();
	
	const validateForm = () => {
		if (!name.trim()) {
			toast.error($i18n.t('Server name is required'));
			return false;
		}
		
		if (!type.trim()) {
			toast.error($i18n.t('Server type is required'));
			return false;
		}
		
		if (!command.trim()) {
			toast.error($i18n.t('Command is required'));
			return false;
		}
		
		// Specific validation for filesystem type
		if (type === 'filesystem' || type === 'filesystem-py') {
			// Check if a directory path is specified
			if (directoryPath.trim() === '') {
				toast.error($i18n.t('A directory path must be specified for filesystem server'));
				return false;
			}
		}
		
		return true;
	};
	
	const handleSave = async () => {
		if (!validateForm()) {
			return;
		}
		
		// Update the directory path for filesystem type
		if (type === 'filesystem' || type === 'filesystem-py') {
			setDirectoryPath(directoryPath);
		}
		
		// Update args from argsString
		updateArgsFromString();
		
		try {
			if (isEditing) {
				// Update existing server
				const updatedServer = await updateMCPServer(localStorage.token, id, {
					id,
					name,
					type,
					description,
					command,
					args
				});
				
				if (updatedServer) {
					dispatch('update', updatedServer);
				}
			} else {
				// Create new server
				const newServer = await createMCPServer(localStorage.token, {
					id: uuidv4(),
					name,
					type,
					description,
					command,
					args
				});
				
				if (newServer) {
					dispatch('add', newServer);
				}
			}
		} catch (error) {
			console.error('Error saving MCP server:', error);
			toast.error($i18n.t('Error saving MCP server'));
		}
	};
	
	// Initialize form with server data if editing
	if (isEditing && server) {
		id = server.id;
		name = server.name;
		type = server.type;
		description = server.description || '';
		command = server.command || '';
		args = server.args || [];
		argsString = args.join(' ');
		directoryPath = getDirectoryPath();
	}
</script>

<Modal bind:show title={isEditing ? $i18n.t('Edit MCP Server') : $i18n.t('Add MCP Server')} on:close>
	<div class="flex flex-col gap-4 p-2">
		<div>
			<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
				{$i18n.t('Server Name')}
			</label>
			<input
				type="text"
				bind:value={name}
				class="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
				placeholder={$i18n.t('Enter server name')}
			/>
		</div>
		
		<div>
			<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
				{$i18n.t('Server Type')}
			</label>
			<div class="grid grid-cols-1 gap-2">
				{#each serverTypes as serverType}
					<Radio
						value={serverType.id}
						bind:group={type}
						label={serverType.name}
						description={serverType.description}
						on:change={() => {
							selectedType = serverType;
							if (!isEditing) {
								command = serverType.command;
								args = [...serverType.args];
								argsString = args.join(' ');
								directoryPath = getDirectoryPath();
							}
						}}
					/>
				{/each}
			</div>
		</div>
		
		<div>
			<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
				{$i18n.t('Description')} ({$i18n.t('Optional')})
			</label>
			<input
				type="text"
				bind:value={description}
				class="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
				placeholder={$i18n.t('Enter description')}
			/>
		</div>
		
		<div>
			<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
				{$i18n.t('Command')}
			</label>
			<input
				type="text"
				bind:value={command}
				class="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
				placeholder={$i18n.t('Enter command (e.g. npx, node, python)')}
			/>
		</div>
		
		{#if type === 'filesystem' || type === 'filesystem-py'}
			<div>
				<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
					{$i18n.t('Directory Path')}
				</label>
				<input
					type="text"
					bind:value={directoryPath}
					class="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
					placeholder={$i18n.t('Enter directory path (e.g. C:\\Users\\username\\Documents)')}
				/>
				<p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
					{$i18n.t('Only operations within this directory will be allowed')}
				</p>
			</div>
			
			<div>
				<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
					{$i18n.t('Script Path')}
				</label>
				<input
					type="text"
					bind:value={args[0]}
					class="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
					placeholder={type === 'filesystem' ? 'mcp_filesystem_server.js' : 'filesystem_mcp_server.py'}
				/>
				<p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
					{$i18n.t('Path to the MCP server script')}
				</p>
			</div>
		{:else}
			<div>
				<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
					{$i18n.t('Arguments')}
				</label>
				<input
					type="text"
					bind:value={argsString}
					on:change={updateArgsFromString}
					class="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
					placeholder={$i18n.t('Enter arguments (space separated)')}
				/>
			</div>
		{/if}
		
		<div class="flex justify-end gap-2 mt-4">
			<button
				class="px-4 py-2 border border-gray-300 rounded-md dark:border-gray-700 dark:text-gray-300"
				on:click={() => {
					show = false;
				}}
			>
				{$i18n.t('Cancel')}
			</button>
			<button
				class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
				on:click={handleSave}
			>
				{isEditing ? $i18n.t('Update') : $i18n.t('Add')}
			</button>
		</div>
	</div>
</Modal>
