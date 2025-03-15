<!--
  ExtensionForm.svelte
  UI component for adding a new extension or editing extension settings
-->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Checkbox from '$lib/components/common/Checkbox.svelte';
  import Textarea from '$lib/components/common/Textarea.svelte';
  import Info from '$lib/components/icons/Info.svelte';
  import type { Extension, ExtensionManifest, ExtensionSetting } from '../../framework/types';
  import { installExtension, updateExtensionSettings } from '../../api/registry';
  import { validateManifest, loadManifest } from '../../framework/utils';
  import CloudArrowUp from '$lib/components/icons/CloudArrowUp.svelte';
  
  // Props
  export let extension: Extension | null = null;
  
  // State
  let file: File | null = null;
  let manifest: ExtensionManifest | null = null;
  let isInstalling = false;
  let error: string | null = null;
  let success: string | null = null;
  
  // Settings form state
  let settingsForm: Record<string, any> = {};
  
  // Event dispatcher
  const dispatch = createEventDispatcher<{
    installed: { extension: Extension };
    settingsUpdated: { id: string; settings: Record<string, any> };
    cancel: void;
  }>();
  
  // Initialize
  $: if (extension) {
    settingsForm = { ...extension.settings };
  }
  
  // Methods
  async function handleFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    
    if (input.files && input.files.length > 0) {
      file = input.files[0];
      
      try {
        // Reset state
        manifest = null;
        error = null;
        
        // For browser-side validation, we'll just verify the file is a zip
        // and let the server handle the actual extraction and validation
        if (!file.name.endsWith('.zip')) {
          error = 'Invalid file type. Please upload a ZIP file.';
          return;
        }
        
        // Ask the user to manually specify manifest info
        // or we could extract it on the server
        manifest = {
          id: '',
          name: '',
          version: '1.0.0',
          description: 'Extension description',
          author: '',
          type: 'ui',
          main: 'index.js'
        };
      } catch (err) {
        error = `Failed to read extension file: ${err instanceof Error ? err.message : String(err)}`;
        console.error('Error reading extension file:', err);
      }
    }
  }
  
  function updateManifestField(field: string, value: any) {
    if (manifest) {
      manifest = {
        ...manifest,
        [field]: value
      };
    }
  }
  
  async function handleInstall() {
    if (!file || !manifest) {
      error = 'Please select a valid extension file';
      return;
    }
    
    // Validate manifest
    const errors = validateManifest(manifest);
    if (errors.length > 0) {
      error = `Invalid manifest: ${errors.join(', ')}`;
      return;
    }
    
    try {
      isInstalling = true;
      error = null;
      
      // Read file as ArrayBuffer
      const buffer = await file.arrayBuffer();
      
      // Install the extension
      const result = await installExtension(manifest, buffer);
      
      if (result) {
        success = `Successfully installed ${manifest.name}`;
        
        // Create a fake extension object for the event
        const installedExtension: Extension = {
          manifest,
          enabled: true,
          installed: true,
          installDate: new Date()
        };
        
        dispatch('installed', { extension: installedExtension });
      } else {
        error = 'Failed to install extension';
      }
    } catch (err) {
      error = `Installation failed: ${err instanceof Error ? err.message : String(err)}`;
      console.error('Error installing extension:', err);
    } finally {
      isInstalling = false;
    }
  }
  
  async function handleUpdateSettings() {
    if (!extension) {
      return;
    }
    
    try {
      error = null;
      
      // Update the extension settings
      const result = await updateExtensionSettings(extension.manifest.id, settingsForm);
      
      if (result) {
        success = 'Settings updated successfully';
        dispatch('settingsUpdated', { id: extension.manifest.id, settings: settingsForm });
      } else {
        error = 'Failed to update settings';
      }
    } catch (err) {
      error = `Failed to update settings: ${err instanceof Error ? err.message : String(err)}`;
      console.error('Error updating settings:', err);
    }
  }
  
  function handleCancel() {
    dispatch('cancel');
  }
</script>

<div class="space-y-4">
  {#if error}
    <div class="p-4 border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20 dark:border-red-400 text-red-700 dark:text-red-300">
      <div class="flex items-start">
        <Info class="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
        <div>
          <h3 class="font-medium">Error</h3>
          <p class="mt-1 text-sm">{error}</p>
        </div>
      </div>
    </div>
  {/if}
  
  {#if success}
    <div class="p-4 border-l-4 border-green-500 bg-green-50 dark:bg-green-900/20 dark:border-green-400 text-green-700 dark:text-green-300">
      <div class="flex items-start">
        <Info class="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
        <div>
          <h3 class="font-medium">Success</h3>
          <p class="mt-1 text-sm">{success}</p>
        </div>
      </div>
    </div>
  {/if}
  
  {#if extension}
    <!-- Settings Form -->
    <div class="space-y-4">
      <h2 class="text-lg font-semibold">Extension Settings: {extension.manifest.name}</h2>
      
      {#if extension.manifest.settings && extension.manifest.settings.length > 0}
        <div class="space-y-4">
          {#each extension.manifest.settings as setting}
            {#if setting.type === 'string'}
              <div class="space-y-2">
                <label for={setting.id} class="block text-sm font-medium">{setting.name}</label>
                <input
                  id={setting.id}
                  type="text"
                  class="w-full px-3 py-2 border rounded-md"
                  placeholder={setting.placeholder}
                  bind:value={settingsForm[setting.id]}
                  required={setting.required}
                />
                {#if setting.description}
                  <p class="text-xs text-gray-500 dark:text-gray-400">{setting.description}</p>
                {/if}
              </div>
            {:else if setting.type === 'number'}
              <div class="space-y-2">
                <label for={setting.id} class="block text-sm font-medium">{setting.name}</label>
                <input
                  id={setting.id}
                  type="number"
                  class="w-full px-3 py-2 border rounded-md"
                  placeholder={setting.placeholder}
                  bind:value={settingsForm[setting.id]}
                  required={setting.required}
                  min={setting.validation?.min}
                  max={setting.validation?.max}
                />
                {#if setting.description}
                  <p class="text-xs text-gray-500 dark:text-gray-400">{setting.description}</p>
                {/if}
              </div>
            {:else if setting.type === 'boolean'}
              <div class="flex items-start space-x-2">
                <Checkbox
                  id={setting.id}
                  bind:checked={settingsForm[setting.id]}
                />
                <div class="grid gap-1.5 leading-none">
                  <label for={setting.id} class="text-sm font-medium">{setting.name}</label>
                  {#if setting.description}
                    <p class="text-xs text-gray-500 dark:text-gray-400">{setting.description}</p>
                  {/if}
                </div>
              </div>
            {:else if setting.type === 'select'}
              <div class="space-y-2">
                <label for={setting.id} class="block text-sm font-medium">{setting.name}</label>
                <select
                  id={setting.id}
                  class="w-full px-3 py-2 border rounded-md"
                  bind:value={settingsForm[setting.id]}
                >
                  {#if setting.options}
                    {#each setting.options as option}
                      <option value={option.value}>{option.label}</option>
                    {/each}
                  {/if}
                </select>
                {#if setting.description}
                  <p class="text-xs text-gray-500 dark:text-gray-400">{setting.description}</p>
                {/if}
              </div>
            {:else if setting.type === 'multiselect'}
              <div class="space-y-2">
                <label class="block text-sm font-medium">{setting.name}</label>
                {#if setting.options}
                  <div class="space-y-2">
                    {#each setting.options as option}
                      <div class="flex items-center space-x-2">
                        <Checkbox
                          id={`${setting.id}-${option.value}`}
                          checked={settingsForm[setting.id]?.includes(option.value)}
                          on:change={(e) => {
                            if (!Array.isArray(settingsForm[setting.id])) {
                              settingsForm[setting.id] = [];
                            }
                            
                            if (e.currentTarget.checked) {
                              settingsForm[setting.id] = [...settingsForm[setting.id], option.value];
                            } else {
                              settingsForm[setting.id] = settingsForm[setting.id].filter((v: string) => v !== option.value);
                            }
                          }}
                        />
                        <label for={`${setting.id}-${option.value}`} class="text-sm">{option.label}</label>
                      </div>
                    {/each}
                  </div>
                {/if}
                {#if setting.description}
                  <p class="text-xs text-gray-500 dark:text-gray-400">{setting.description}</p>
                {/if}
              </div>
            {/if}
          {/each}
        </div>
        
        <div class="flex justify-end gap-2 mt-6">
          <button 
            class="px-4 py-2 border rounded-md hover:bg-gray-50 dark:hover:bg-gray-800"
            on:click={handleCancel}>
            Cancel
          </button>
          <button 
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-500"
            on:click={handleUpdateSettings}>
            Save Settings
          </button>
        </div>
      {:else}
        <p class="text-sm text-gray-500 dark:text-gray-400">This extension has no configurable settings.</p>
        <div class="flex justify-end">
          <button 
            class="px-4 py-2 border rounded-md hover:bg-gray-50 dark:hover:bg-gray-800"
            on:click={handleCancel}>
            Back
          </button>
        </div>
      {/if}
    </div>
  {:else}
    <!-- Install Form -->
    <div class="space-y-4">
      <h2 class="text-lg font-semibold">Install Extension</h2>
      
      <div class="space-y-2">
        <label for="extension-file" class="block text-sm font-medium">Extension File (ZIP)</label>
        <input 
          id="extension-file" 
          type="file" 
          accept=".zip"
          on:change={handleFileChange} 
          class="w-full px-3 py-2 border rounded-md"
        />
        <p class="text-xs text-gray-500 dark:text-gray-400">
          Upload a ZIP file containing the extension. The ZIP must include a valid manifest.json file.
        </p>
      </div>
      
      {#if manifest}
        <div class="border rounded-md p-4 space-y-4">
          <h3 class="text-sm font-medium">Extension Details</h3>
          <div class="p-4 border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400 text-blue-700 dark:text-blue-300">
            <div class="flex items-start">
              <Info class="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <h3 class="font-medium">Enter Extension Information</h3>
                <p class="mt-1 text-sm">
                  Please provide the following extension details or verify the details if auto-detected.
                </p>
              </div>
            </div>
          </div>
          
          <div class="space-y-3">
            <div class="space-y-2">
              <label for="extension-id" class="block text-sm font-medium">Extension ID</label>
              <input 
                id="extension-id" 
                placeholder="my-extension"
                bind:value={manifest.id}
                class="w-full px-3 py-2 border rounded-md"
              />
              <p class="text-xs text-gray-500 dark:text-gray-400">
                A unique identifier for the extension (kebab-case).
              </p>
            </div>
            
            <div class="space-y-2">
              <label for="extension-name" class="block text-sm font-medium">Name</label>
              <input 
                id="extension-name" 
                placeholder="My Extension"
                bind:value={manifest.name}
                class="w-full px-3 py-2 border rounded-md"
              />
            </div>
            
            <div class="space-y-2">
              <label for="extension-description" class="block text-sm font-medium">Description</label>
              <Textarea 
                id="extension-description" 
                placeholder="A description of what your extension does"
                bind:value={manifest.description}
              />
            </div>
            
            <div class="space-y-2">
              <label for="extension-author" class="block text-sm font-medium">Author</label>
              <input 
                id="extension-author" 
                placeholder="Your Name"
                bind:value={manifest.author}
                class="w-full px-3 py-2 border rounded-md"
              />
            </div>
            
            <div class="space-y-2">
              <label for="extension-type" class="block text-sm font-medium">Type</label>
              <select id="extension-type" bind:value={manifest.type} class="w-full px-3 py-2 border rounded-md">
                <option value="ui">UI</option>
                <option value="api">API</option>
                <option value="model-adapter">Model Adapter</option>
                <option value="tool">Tool</option>
                <option value="theme">Theme</option>
              </select>
            </div>
          </div>
        </div>
      {/if}
      
      <div class="flex justify-end gap-2 mt-6">
        <button 
          class="px-4 py-2 border rounded-md hover:bg-gray-50 dark:hover:bg-gray-800"
          on:click={handleCancel}>
          Cancel
        </button>
        <button 
          on:click={handleInstall} 
          disabled={!manifest || isInstalling || !manifest.id || !manifest.name || !manifest.author}
          class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          <CloudArrowUp class="w-4 h-4" />
          {isInstalling ? 'Installing...' : 'Install Extension'}
        </button>
      </div>
    </div>
  {/if}
</div>
