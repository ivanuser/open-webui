<script lang="ts">
	import { getContext } from 'svelte';
	
	const i18n = getContext('i18n');
	
	export let extension;
	export let onEnable;
	export let onDisable;
	export let onUninstall;
	
	// Format date helper
	function formatDate(dateStr) {
		const date = new Date(dateStr);
		return date.toLocaleDateString(undefined, {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}
	
	// Get type badge color
	function getTypeBadgeColor(type) {
		const colors = {
			ui: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
			api: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
			model: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
			tool: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
			theme: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300'
		};
		
		return colors[type.toLowerCase()] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
	}
	
	// Get status badge color
	function getStatusBadgeColor(status) {
		const colors = {
			enabled: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
			disabled: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
			error: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
		};
		
		return colors[status.toLowerCase()] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
	}
</script>

<div class="extension-card bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
	<div class="p-4">
		<div class="flex justify-between items-start mb-2">
			<h3 class="text-lg font-semibold dark:text-white">{extension.name}</h3>
			
			<div class="flex flex-wrap gap-2">
				<span
					class="px-2 py-1 text-xs font-medium rounded-full {getTypeBadgeColor(extension.type)}"
				>
					{extension.type}
				</span>
				
				<span
					class="px-2 py-1 text-xs font-medium rounded-full {getStatusBadgeColor(extension.status)}"
				>
					{extension.status}
				</span>
			</div>
		</div>
		
		<p class="text-sm text-gray-600 dark:text-gray-300 mb-4">
			{extension.description}
		</p>
		
		<div class="text-xs text-gray-500 dark:text-gray-400 mb-4">
			<div class="flex justify-between mb-1">
				<span>{$i18n.t('Version')}:</span>
				<span>{extension.version}</span>
			</div>
			<div class="flex justify-between mb-1">
				<span>{$i18n.t('Author')}:</span>
				<span>{extension.author}</span>
			</div>
			<div class="flex justify-between">
				<span>{$i18n.t('Added')}:</span>
				<span>{formatDate(extension.created_at)}</span>
			</div>
		</div>
	</div>
	
	<div class="px-4 py-3 bg-gray-50 dark:bg-gray-700 flex justify-between">
		{#if extension.status === 'disabled'}
			<button
				on:click={onEnable}
				class="px-3 py-1 bg-primary text-white text-sm rounded hover:bg-opacity-90 transition"
			>
				{$i18n.t('Enable')}
			</button>
		{:else if extension.status === 'enabled'}
			<button
				on:click={onDisable}
				class="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-opacity-90 transition"
			>
				{$i18n.t('Disable')}
			</button>
		{:else}
			<button
				on:click={onEnable}
				class="px-3 py-1 bg-primary text-white text-sm rounded hover:bg-opacity-90 transition"
			>
				{$i18n.t('Retry')}
			</button>
		{/if}
		
		<button
			on:click={onUninstall}
			class="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-opacity-90 transition"
		>
			{$i18n.t('Uninstall')}
		</button>
	</div>
</div>
