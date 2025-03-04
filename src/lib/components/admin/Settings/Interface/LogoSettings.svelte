<!-- src/lib/components/admin/Settings/Interface/LogoSettings.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { toast } from 'svelte-sonner';
  import { uploadLogo, resetLogo, getLogo } from '$lib/apis/configs';
  import { config, user } from '$lib/stores';
  import { getContext } from 'svelte';

  const i18n = getContext('i18n');

  let customLogoPath = '';
  let fileInput;
  let isUploading = false;
  let logoFile = null;
  let previewUrl = '';

  onMount(async () => {
    try {
      const result = await getLogo(localStorage.token);
      customLogoPath = result.CUSTOM_LOGO_PATH || '';
      if (customLogoPath) {
        previewUrl = customLogoPath;
      }
    } catch (error) {
      console.error('Failed to load logo settings:', error);
    }
  });

  const handleFileChange = (event) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      logoFile = files[0];

      // Create a preview URL
      previewUrl = URL.createObjectURL(logoFile);
    }
  };

  const handleUpload = async () => {
    if (!logoFile) {
      toast.error($i18n.t('Please select a file first'));
      return;
    }

    try {
      isUploading = true;
      const formData = new FormData();
      formData.append('file', logoFile);

      const result = await uploadLogo(localStorage.token, formData);
      customLogoPath = result.CUSTOM_LOGO_PATH;

      // Refresh the config store to update the logo in the UI
      const currentConfig = $config;
      config.set({ ...currentConfig, CUSTOM_LOGO_PATH: customLogoPath });

      toast.success($i18n.t('Logo uploaded successfully'));
    } catch (error) {
      console.error('Failed to upload logo:', error);
      toast.error($i18n.t('Failed to upload logo'));
    } finally {
      isUploading = false;
    }
  };

  const handleReset = async () => {
    try {
      isUploading = true;
      await resetLogo(localStorage.token);
      customLogoPath = '';
      previewUrl = '';
      logoFile = null;

      // Reset the file input
      if (fileInput) {
        fileInput.value = '';
      }

      // Refresh the config store to update the logo in the UI
      const currentConfig = $config;
      config.set({ ...currentConfig, CUSTOM_LOGO_PATH: null });

      toast.success($i18n.t('Logo reset to default'));
    } catch (error) {
      console.error('Failed to reset logo:', error);
      toast.error($i18n.t('Failed to reset logo'));
    } finally {
      isUploading = false;
    }
  };
</script>

<div class="space-y-3">
  <div class="mb-3">
    <div class="mb-2.5 text-base font-medium">{$i18n.t('Custom Logo')}</div>
    <hr class="border-gray-100 dark:border-gray-850 my-2" />

    <!-- Logo preview -->
    <div class="mb-4">
      <div class="text-xs mb-2 font-medium">{$i18n.t('Current Logo')}</div>
      <div class="flex items-center space-x-4">
        <div class="w-16 h-16 bg-gray-100 dark:bg-gray-850 rounded-lg flex items-center justify-center overflow-hidden">
          {#if previewUrl}
            <img src={previewUrl} alt="Logo preview" class="max-w-full max-h-full object-contain" />
          {:else}
            <div class="text-gray-400 text-xs">{$i18n.t('Default')}</div>
          {/if}
        </div>
      </div>
    </div>

    <!-- File input -->
    <div class="mb-4">
      <div class="text-xs mb-2 font-medium">{$i18n.t('Upload New Logo')}</div>
      <div class="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
        <label class="flex-1">
          <div class="relative">
            <input
              bind:this={fileInput}
              type="file"
              accept="image/*"
              on:change={handleFileChange}
              class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div class="bg-gray-50 dark:bg-gray-850 border border-gray-100 dark:border-gray-800 rounded-lg px-3 py-2 text-sm flex items-center justify-between">
              <span class="truncate">{logoFile ? logoFile.name : $i18n.t('Choose file...')}</span>
              <span class="text-xs text-gray-500">{$i18n.t('Browse')}</span>
            </div>
          </div>
        </label>
        <div class="flex space-x-2">
          <button
            type="button"
            class="px-3 py-2 text-sm font-medium bg-black hover:bg-gray-900 text-white dark:bg-white dark:text-black dark:hover:bg-gray-100 transition rounded-lg"
            on:click={handleUpload}
            disabled={isUploading || !logoFile}
          >
            {isUploading ? $i18n.t('Uploading...') : $i18n.t('Upload')}
          </button>
          {#if customLogoPath}
            <button
              type="button"
              class="px-3 py-2 text-sm font-medium bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-black dark:text-white border border-gray-300 dark:border-gray-700 transition rounded-lg"
              on:click={handleReset}
              disabled={isUploading}
            >
              {$i18n.t('Reset to Default')}
            </button>
          {/if}
        </div>
      </div>
      <div class="text-xs text-gray-500 mt-2">
        {$i18n.t('Recommended size: 32x32 pixels. Supported formats: PNG, JPEG, SVG.')}
      </div>
    </div>
  </div>
</div>