<script lang="ts">
	import { onMount } from 'svelte';
	import { getContext } from 'svelte';
	import { toast } from 'svelte-sonner';
	
	import ExtensionCard from './ExtensionCard.svelte';
	import ExtensionForm from './ExtensionForm.svelte';
	
	const i18n = getContext('i18n');
	
	// Extension data
	let extensions = [];
	let loading = true;
	let error = null;
	
	// UI state
	let showAddForm = false;
	
	// Fetch extensions on mount
	onMount(async () => {
		await fetchExtensions();
	});
	
	async function fetchExtensions() {
		loading = true;
		error = null;
		
		try {
			const response = await fetch('/api/extensions', {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${localStorage.token}`
				}
			});
			
			if (!response.ok) {
				throw new Error(`HTTP error ${response.status}`);
			}
			
			const data = await response.json();
			extensions = data.extensions || [];
		} catch (err) {
			console.error('Error fetching extensions:', err);
			error = err.message || 'Failed to load extensions';
			toast.error(error);
		} finally {
			loading = false;
		}
	}
	
	async function handleEnable(extension) {
		try {
			const response = await fetch(`/api/extensions/${extension.id}/enable`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${localStorage.token}`
				}
			});
			
			if (!response.ok) {
				throw new Error(`HTTP error ${response.status}`);
			}
			
			const data = await response.json();
			toast.success(data.message || 'Extension enabled');
			
			// Refresh the list
			await fetchExtensions();
		} catch (err) {
			console.error('Error enabling extension:', err);
			toast.error(err.message || 'Failed to enable extension');
		}
	}
	
	async function handleDisable(extension) {
		try {
			const response = await fetch(`/api/extensions/${extension.id}/disable`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${localStorage.token}`
				}
			});
			
			if (!response.ok) {
				throw new Error(`HTTP error ${response.status}`);
			}
			
			const data = await response.json();
			toast.success(data.message || 'Extension disabled');
			
			// Refresh the list
			await fetchExtensions();
		} catch (err) {
			console.error('Error disabling extension:', err);
			toast.error(err.message || 'Failed to disable extension');
		}
	}
	
	async function handleUninstall(extension) {
		if (!confirm(`Are you sure you want to uninstall ${extension.name}?`)) {
			return;
		}
		
		try {
			const response = await fetch(`/api/extensions/${extension.id}`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${localStorage.token}`
				}
			});
			
			if (!response.ok) {
				throw new Error(`HTTP error ${response.status}`);
			}
			
			const data = await response.json();
			toast.success(data.message || 'Extension uninstalled');
			
			// Refresh the list
			await fetchExtensions();
		} catch (err) {
			console.error('Error uninstalling extension:', err);
			toast.error(err.message || 'Failed to uninstall extension');
		}
	}
	
	async function handleAddExtension(extension) {
		try {
			const response = await fetch('/api/extensions', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${localStorage.token}`
				},
				body: JSON.stringify(extension)
			});
			
			if (!response.ok) {
				throw new Error(`HTTP error ${response.status}`);
			}
			
			const data = await response.json();
			toast.success(`Extension ${data.name} installed`);
			
			// Close the form and refresh the list
			showAddForm = false;
			await fetchExtensions();
		} catch (err) {
			console.error('Error installing extension:', err);
			toast.error(err.message || 'Failed to install extension');
		}
	}
	
	function handleCancelAdd() {
		showAddForm = false;
	}
</script>

<div class="extension-manager p-4">
	<div class="flex justify-between items-center mb-6">
		<h2 class="text-2xl font-bold dark:text-white">{$i18n.t('Extensions')}</h2>
		
		<button
			on:click={() => (showAddForm = true)}
			class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 transition"
		>
			{$i18n.t('Add Extension')}
		</button>
	</div>
	
	{#if showAddForm}
		<div class="mb-6 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
			<h3 class="text-xl font-semibold mb-4 dark:text-white">{$i18n.t('Add New Extension')}</h3>
			<ExtensionForm onSubmit={handleAddExtension} onCancel={handleCancelAdd} />
		</div>
	{/if}
	
	{#if loading}
		<div class="flex justify-center items-center p-8">
			<div class="loader w-8 h-8 border-4 border-t-primary border-r-transparent border-b-primary border-l-transparent rounded-full animate-spin"></div>
		</div>
	{:else if error}
		<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
			<strong class="font-bold">Error!</strong>
			<span class="block sm:inline">{error}</span>
		</div>
	{:else if extensions.length === 0}
		<div class="bg-gray-50 dark:bg-gray-800 p-8 text-center rounded-lg">
			<p class="text-gray-500 dark:text-gray-400">
				{$i18n.t('No extensions installed. Click "Add Extension" to get started.')}
			</p>
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each extensions as extension (extension.id)}
				<ExtensionCard
					{extension}
					onEnable={() => handleEnable(extension)}
					onDisable={() => handleDisable(extension)}
					onUninstall={() => handleUninstall(extension)}
				/>
			{/each}
		</div>
	{/if}
</div>

<style>
	.extension-manager {
		min-height: 400px;
	}
	
	.loader {
		border-top-color: #3b82f6;
		border-bottom-color: #3b82f6;
	}
	
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
	
	.animate-spin {
		animation: spin 1s linear infinite;
	}
</style>
