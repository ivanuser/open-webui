<script lang="ts">
	import { getContext } from 'svelte';
	
	const i18n = getContext('i18n');
	
	export let onSubmit;
	export let onCancel;
	export let extension = null; // For editing existing extension
	
	// Form data with defaults
	let formData = {
		name: '',
		description: '',
		version: '0.1.0',
		author: '',
		type: 'ui',
		entry_point: '__init__.py',
		config: {}
	};
	
	// If editing, populate form data
	if (extension) {
		formData = { ...extension };
		// Convert config to string for editing
		formData.config = JSON.stringify(formData.config, null, 2);
	}
	
	// Extension types
	const extensionTypes = [
		{ value: 'ui', label: 'UI Extension' },
		{ value: 'api', label: 'API Extension' },
		{ value: 'model', label: 'Model Adapter' },
		{ value: 'tool', label: 'Tool Extension' },
		{ value: 'theme', label: 'Theme Extension' }
	];
	
	// Handle form submission
	function handleSubmit() {
		// Validate form
		if (!formData.name.trim()) {
			alert('Name is required');
			return;
		}
		
		// Process config - convert from string to object if needed
		let config = formData.config;
		if (typeof config === 'string') {
			try {
				config = JSON.parse(config);
			} catch (e) {
				alert('Invalid JSON in config');
				return;
			}
		}
		
		// Create final data object
		const extensionData = {
			...formData,
			config
		};
		
		// Submit
		onSubmit(extensionData);
	}
</script>

<form on:submit|preventDefault={handleSubmit} class="space-y-4">
	<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
		<div class="form-group">
			<label for="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
				{$i18n.t('Name')} *
			</label>
			<input
				type="text"
				id="name"
				bind:value={formData.name}
				required
				class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
			/>
		</div>
		
		<div class="form-group">
			<label for="version" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
				{$i18n.t('Version')} *
			</label>
			<input
				type="text"
				id="version"
				bind:value={formData.version}
				required
				placeholder="0.1.0"
				class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
			/>
		</div>
	</div>
	
	<div class="form-group">
		<label for="description" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
			{$i18n.t('Description')} *
		</label>
		<textarea
			id="description"
			bind:value={formData.description}
			required
			rows="3"
			class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
		></textarea>
	</div>
	
	<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
		<div class="form-group">
			<label for="author" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
				{$i18n.t('Author')} *
			</label>
			<input
				type="text"
				id="author"
				bind:value={formData.author}
				required
				class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
			/>
		</div>
		
		<div class="form-group">
			<label for="type" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
				{$i18n.t('Type')} *
			</label>
			<select
				id="type"
				bind:value={formData.type}
				required
				class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
			>
				{#each extensionTypes as type}
					<option value={type.value}>{type.label}</option>
				{/each}
			</select>
		</div>
	</div>
	
	<div class="form-group">
		<label for="entry_point" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
			{$i18n.t('Entry Point')} *
		</label>
		<input
			type="text"
			id="entry_point"
			bind:value={formData.entry_point}
			required
			placeholder="__init__.py"
			class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
		/>
		<p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
			{$i18n.t('Relative path to the entry point file (e.g., __init__.py)')}
		</p>
	</div>
	
	<div class="form-group">
		<label for="config" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
			{$i18n.t('Configuration')}
		</label>
		<textarea
			id="config"
			bind:value={formData.config}
			rows="5"
			placeholder="{}"
			class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary font-mono text-sm dark:bg-gray-700 dark:text-white"
		></textarea>
		<p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
			{$i18n.t('JSON configuration object')}
		</p>
	</div>
	
	<div class="flex justify-end space-x-4 pt-2">
		<button
			type="button"
			on:click={onCancel}
			class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
		>
			{$i18n.t('Cancel')}
		</button>
		
		<button
			type="submit"
			class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
		>
			{extension ? $i18n.t('Update') : $i18n.t('Install')}
		</button>
	</div>
</form>
