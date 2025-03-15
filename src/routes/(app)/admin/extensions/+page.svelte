<!--
  Admin Extensions Page
  Page for managing extensions in the admin panel
-->
<script lang="ts">
  import { page } from '$app/stores';
  import { ExtensionManager } from '$lib/extensions/manager';
  import { Button } from '$lib/components/ui';
  import { ArrowLeft, BookOpen } from 'lucide-svelte';
</script>

<svelte:head>
  <title>Extension Manager - Open WebUI</title>
</svelte:head>

<div class="container mx-auto py-6 space-y-6">
  <header class="flex items-center justify-between">
    <div class="flex items-center gap-2">
      <Button variant="ghost" size="icon" href="/admin" class="mr-2">
        <ArrowLeft class="h-4 w-4" />
      </Button>
      <h1 class="text-2xl font-bold">Extension Manager</h1>
    </div>
    
    <Button variant="outline" class="flex items-center gap-2" as="a" href="https://github.com/open-webui/open-webui/tree/main/docs/extensions" target="_blank">
      <BookOpen class="w-4 h-4" />
      <span>Documentation</span>
    </Button>
  </header>
  
  <div class="px-1">
    <ExtensionManager />
  </div>
</div>
