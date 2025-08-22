<script lang="ts">
	import { toast } from 'svelte-sonner';
	import { createEventDispatcher, onMount, getContext } from 'svelte';
	
	const dispatch = createEventDispatcher();
	const i18n = getContext('i18n');
	
	import Switch from '$lib/components/common/Switch.svelte';
	import Tooltip from '$lib/components/common/Tooltip.svelte';
	import Spinner from '$lib/components/common/Spinner.svelte';
	import SolidCircle from '$lib/components/icons/SolidCircle.svelte';
	
	export let getModels: Function;
	
	// Claude Code Configuration
	let ENABLE_CLAUDE_CODE: boolean = false;
	let CLAUDE_CODE_COMMAND_PATH: string = 'claude';
	let CLAUDE_CODE_WORKING_DIRECTORY: string = '';
	let claudeCodeStatus: any = null;
	let checkingStatus: boolean = false;
	
	// Fetch Claude Code configuration
	const getClaudeCodeConfig = async () => {
		try {
			const response = await fetch('/api/v1/claude-code/config', {
				headers: {
					Authorization: `Bearer ${localStorage.token}`
				}
			});
			
			if (response.ok) {
				const config = await response.json();
				ENABLE_CLAUDE_CODE = config.enabled;
				CLAUDE_CODE_COMMAND_PATH = config.command_path || 'claude';
				CLAUDE_CODE_WORKING_DIRECTORY = config.working_directory || '';
			}
		} catch (error) {
			console.error('Failed to fetch Claude Code config:', error);
		}
	};
	
	// Update Claude Code configuration
	const updateClaudeCodeConfig = async () => {
		try {
			const response = await fetch('/api/v1/claude-code/config', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${localStorage.token}`
				},
				body: JSON.stringify({
					enabled: ENABLE_CLAUDE_CODE,
					command_path: CLAUDE_CODE_COMMAND_PATH,
					working_directory: CLAUDE_CODE_WORKING_DIRECTORY || null
				})
			});
			
			if (response.ok) {
				toast.success($i18n.t('Claude Code settings updated'));
				await getModels();
				await checkClaudeCodeStatus();
			} else {
				const error = await response.json();
				toast.error(error.detail || 'Failed to update Claude Code settings');
			}
		} catch (error) {
			toast.error(`${error}`);
		}
	};
	
	// Check Claude Code CLI status
	const checkClaudeCodeStatus = async () => {
		checkingStatus = true;
		try {
			const response = await fetch('/api/v1/claude-code/status', {
				headers: {
					Authorization: `Bearer ${localStorage.token}`
				}
			});
			
			if (response.ok) {
				claudeCodeStatus = await response.json();
			}
		} catch (error) {
			console.error('Failed to check Claude Code status:', error);
			claudeCodeStatus = {
				status: 'error',
				message: 'Failed to check Claude Code status'
			};
		}
		checkingStatus = false;
	};
	
	onMount(async () => {
		await getClaudeCodeConfig();
		if (ENABLE_CLAUDE_CODE) {
			await checkClaudeCodeStatus();
		}
	});
</script>

<div class="flex flex-col gap-4 mt-4">
	<div class="border border-gray-100 dark:border-gray-850 rounded-xl px-4 py-2">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2">
				<div class="text-lg font-medium">Claude Code CLI</div>
				{#if claudeCodeStatus}
					<div class="flex items-center gap-1">
						{#if claudeCodeStatus.status === 'active'}
							<SolidCircle className="size-2 text-green-500" />
							<span class="text-xs text-gray-500">Connected</span>
						{:else if claudeCodeStatus.status === 'disabled'}
							<SolidCircle className="size-2 text-gray-500" />
							<span class="text-xs text-gray-500">Disabled</span>
						{:else}
							<SolidCircle className="size-2 text-red-500" />
							<span class="text-xs text-gray-500">Error</span>
						{/if}
					</div>
				{/if}
			</div>
			
			<div class="flex items-center gap-2">
				{#if checkingStatus}
					<Spinner className="size-4" />
				{/if}
				<Switch bind:state={ENABLE_CLAUDE_CODE} on:change={updateClaudeCodeConfig} />
			</div>
		</div>
		
		{#if ENABLE_CLAUDE_CODE}
			<div class="mt-4 space-y-3">
				<div>
					<label for="claude-code-command" class="block text-sm font-medium text-gray-900 dark:text-white mb-1">
						{$i18n.t('Command Path')}
					</label>
					<div class="flex items-center gap-2">
						<input
							id="claude-code-command"
							type="text"
							bind:value={CLAUDE_CODE_COMMAND_PATH}
							placeholder="claude"
							class="w-full rounded-lg px-3 py-2 text-sm bg-gray-50 dark:bg-gray-850 dark:text-gray-200 outline-none"
						/>
						<Tooltip content="Path to the Claude Code CLI command. Usually 'claude' if installed globally.">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								stroke-width="1.5"
								stroke="currentColor"
								class="size-4"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
								/>
							</svg>
						</Tooltip>
					</div>
				</div>
				
				<div>
					<label for="claude-code-workdir" class="block text-sm font-medium text-gray-900 dark:text-white mb-1">
						{$i18n.t('Working Directory (Optional)')}
					</label>
					<div class="flex items-center gap-2">
						<input
							id="claude-code-workdir"
							type="text"
							bind:value={CLAUDE_CODE_WORKING_DIRECTORY}
							placeholder="/path/to/workspace"
							class="w-full rounded-lg px-3 py-2 text-sm bg-gray-50 dark:bg-gray-850 dark:text-gray-200 outline-none"
						/>
						<Tooltip content="Optional working directory for Claude Code. Leave empty to use temporary directories.">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								stroke-width="1.5"
								stroke="currentColor"
								class="size-4"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
								/>
							</svg>
						</Tooltip>
					</div>
				</div>
				
				<div class="flex gap-2">
					<button
						type="button"
						on:click={updateClaudeCodeConfig}
						class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
					>
						{$i18n.t('Save')}
					</button>
					
					<button
						type="button"
						on:click={checkClaudeCodeStatus}
						disabled={checkingStatus}
						class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
					>
						{#if checkingStatus}
							{$i18n.t('Checking...')}
						{:else}
							{$i18n.t('Test Connection')}
						{/if}
					</button>
				</div>
				
				{#if claudeCodeStatus && claudeCodeStatus.message}
					<div class="p-3 rounded-lg text-sm {claudeCodeStatus.status === 'active' ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200' : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'}">
						{claudeCodeStatus.message}
						{#if claudeCodeStatus.version}
							<div class="mt-1 text-xs opacity-75">Version: {claudeCodeStatus.version}</div>
						{/if}
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>