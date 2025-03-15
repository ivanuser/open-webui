<!--
  ExtensionForm.svelte
  UI component for adding a new extension or editing extension settings
-->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Button, Alert, AlertTitle, AlertDescription, Input, Textarea, Label, Select, Checkbox } from '$lib/components/ui';
  import { Upload, AlertCircle } from 'lucide-svelte';
  import type { Extension, ExtensionManifest, ExtensionSetting } from '../../framework/types';
  import { installExtension, updateExtensionSettings } from '../../api/registry';
  import JSZip from 'jszip';
  import { validateManifest, loadManifest } from '../../framework/utils';
  
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
        
        // Read the zip file
        const zip = await JSZip.loadAsync(file);
        
        // Look for manifest.json
        const manifestFile = zip.file('manifest.json');
        
        if (!manifestFile) {
          error = 'Invalid extension: manifest.json not found in the ZIP file';
          return;
        }
        
        // Read and parse the manifest
        const manifestContent = await manifestFile.async('string');
        manifest = loadManifest(manifestContent);
        
        if (!manifest) {
          error = 'Invalid extension manifest';
          return;
        }
      } catch (err) {
        error = `Failed to read extension file: ${err instanceof Error ? err.message : String(err)}`;
        console.error('Error reading extension file:', err);
      }
    }
  }
  
  async function handleInstall() {
    if (!file || !manifest) {
      error = 'Please select a valid extension file';
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
  
  // Render helper for settings
  function renderSetting(setting: ExtensionSetting) {
    switch (setting.type) {
      case 'string':
        return renderStringInput(setting);
      case 'number':
        return renderNumberInput(setting);
      case 'boolean':
        return renderBooleanInput(setting);
      case 'select':
        return renderSelectInput(setting);
      case 'multiselect':
        return renderMultiselectInput(setting);
      default:
        return null;
    }
  }
  
  function renderStringInput(setting: ExtensionSetting) {
    return (
      <div class="space-y-2">
        <Label for={setting.id}>{setting.name}</Label>
        <Input
          id={setting.id}
          type="text"
          placeholder={setting.placeholder}
          bind:value={settingsForm[setting.id]}
          required={setting.required}
        />
        {#if setting.description}
          <p class="text-xs text-muted-foreground">{setting.description}</p>
        {/if}
      </div>
    );
  }
  
  function renderNumberInput(setting: ExtensionSetting) {
    return (
      <div class="space-y-2">
        <Label for={setting.id}>{setting.name}</Label>
        <Input
          id={setting.id}
          type="number"
          placeholder={setting.placeholder}
          bind:value={settingsForm[setting.id]}
          required={setting.required}
          min={setting.validation?.min}
          max={setting.validation?.max}
        />
        {#if setting.description}
          <p class="text-xs text-muted-foreground">{setting.description}</p>
        {/if}
      </div>
    );
  }
  
  function renderBooleanInput(setting: ExtensionSetting) {
    return (
      <div class="flex items-start space-x-2">
        <Checkbox
          id={setting.id}
          bind:checked={settingsForm[setting.id]}
        />
        <div class="grid gap-1.5 leading-none">
          <Label for={setting.id}>{setting.name}</Label>
          {#if setting.description}
            <p class="text-xs text-muted-foreground">{setting.description}</p>
          {/if}
        </div>
      </div>
    );
  }
  
  function renderSelectInput(setting: ExtensionSetting) {
    return (
      <div class="space-y-2">
        <Label for={setting.id}>{setting.name}</Label>
        <Select
          id={setting.id}
          bind:value={settingsForm[setting.id]}
        >
          {#if setting.options}
            {#each setting.options as option}
              <option value={option.value}>{option.label}</option>
            {/each}
          {/if}
        </Select>
        {#if setting.description}
          <p class="text-xs text-muted-foreground">{setting.description}</p>
        {/if}
      </div>
    );
  }
  
  function renderMultiselectInput(setting: ExtensionSetting) {
    // Initialize as array if not already
    if (!Array.isArray(settingsForm[setting.id])) {
      settingsForm[setting.id] = [];
    }
    
    return (
      <div class="space-y-2">
        <Label>{setting.name}</Label>
        {#if setting.options}
          <div class="space-y-2">
            {#each setting.options as option}
              <div class="flex items-center space-x-2">
                <Checkbox
                  id={`${setting.id}-${option.value}`}
                  checked={settingsForm[setting.id].includes(option.value)}
                  on:change={(e) => {
                    if (e.currentTarget.checked) {
                      settingsForm[setting.id] = [...settingsForm[setting.id], option.value];
                    } else {
                      settingsForm[setting.id] = settingsForm[setting.id].filter((v: string) => v !== option.value);
                    }
                  }}
                />
                <Label for={`${setting.id}-${option.value}`}>{option.label}</Label>
              </div>
            {/each}
          </div>
        {/if}
        {#if setting.description}
          <p class="text-xs text-muted-foreground">{setting.description}</p>
        {/if}
      </div>
    );
  }
</script>

<div class="space-y-4">
  {#if error}
    <Alert variant="destructive">
      <AlertCircle class="w-4 h-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  {/if}
  
  {#if success}
    <Alert variant="success">
      <AlertCircle class="w-4 h-4" />
      <AlertTitle>Success</AlertTitle>
      <AlertDescription>{success}</AlertDescription>
    </Alert>
  {/if}
  
  {#if extension}
    <!-- Settings Form -->
    <div class="space-y-4">
      <h2 class="text-lg font-semibold">Extension Settings: {extension.manifest.name}</h2>
      
      {#if extension.manifest.settings && extension.manifest.settings.length > 0}
        <div class="space-y-4">
          {#each extension.manifest.settings as setting}
            {renderSetting(setting)}
          {/each}
        </div>
        
        <div class="flex justify-end gap-2">
          <Button variant="outline" on:click={handleCancel}>Cancel</Button>
          <Button on:click={handleUpdateSettings}>Save Settings</Button>
        </div>
      {:else}
        <p class="text-sm text-muted-foreground">This extension has no configurable settings.</p>
        <div class="flex justify-end">
          <Button variant="outline" on:click={handleCancel}>Back</Button>
        </div>
      {/if}
    </div>
  {:else}
    <!-- Install Form -->
    <div class="space-y-4">
      <h2 class="text-lg font-semibold">Install Extension</h2>
      
      <div class="space-y-2">
        <Label for="extension-file">Extension File (ZIP)</Label>
        <Input 
          id="extension-file" 
          type="file" 
          accept=".zip"
          on:change={handleFileChange} 
        />
        <p class="text-xs text-muted-foreground">
          Upload a ZIP file containing the extension. The ZIP must include a valid manifest.json file.
        </p>
      </div>
      
      {#if manifest}
        <div class="border rounded-md p-4 space-y-2">
          <h3 class="text-sm font-medium">Extension Details</h3>
          <div class="grid grid-cols-2 gap-2 text-sm">
            <div class="text-muted-foreground">Name:</div>
            <div>{manifest.name}</div>
            
            <div class="text-muted-foreground">Version:</div>
            <div>{manifest.version}</div>
            
            <div class="text-muted-foreground">Author:</div>
            <div>{manifest.author}</div>
            
            <div class="text-muted-foreground">Description:</div>
            <div>{manifest.description}</div>
            
            <div class="text-muted-foreground">Type:</div>
            <div>{Array.isArray(manifest.type) ? manifest.type.join(', ') : manifest.type}</div>
          </div>
        </div>
      {/if}
      
      <div class="flex justify-end gap-2">
        <Button variant="outline" on:click={handleCancel}>Cancel</Button>
        <Button 
          on:click={handleInstall} 
          disabled={!manifest || isInstalling}
          class="flex items-center gap-2"
        >
          <Upload class="w-4 h-4" />
          {isInstalling ? 'Installing...' : 'Install Extension'}
        </Button>
      </div>
    </div>
  {/if}
</div>
