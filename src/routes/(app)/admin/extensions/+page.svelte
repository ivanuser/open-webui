<!--
  Admin Extensions Page
  Page for managing extensions in the admin panel
-->
<script lang="ts">
  import { page } from '$app/stores';
  import { ExtensionManager } from '$lib/extensions/manager';
  import ArrowLeft from '$lib/components/icons/ArrowLeft.svelte';
  import BookOpen from '$lib/components/icons/BookOpen.svelte';
</script>

<svelte:head>
  <title>Extension Manager - Open WebUI</title>
</svelte:head>

<div class="container mx-auto py-6 space-y-6">
  <header class="flex items-center justify-between">
    <div class="flex items-center gap-2">
      <a href="/admin" class="mr-2 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-850 transition">
        <ArrowLeft class="h-4 w-4" />
      </a>
      <h1 class="text-2xl font-bold">Extension Manager</h1>
    </div>
    
    <a href="https://github.com/open-webui/open-webui/tree/main/docs/extensions" 
       class="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
       target="_blank"
       rel="noopener noreferrer">
      <BookOpen class="w-4 h-4" />
      <span>Documentation</span>
    </a>
  </header>
  
  <div class="px-1">
    <ExtensionManager />
  </div>
</div>
