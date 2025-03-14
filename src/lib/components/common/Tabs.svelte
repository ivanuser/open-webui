<script lang="ts">
  export let activeTab = 0;
  export let tabs = [];
</script>

<div class="border-b border-gray-200 dark:border-gray-700">
  <ul class="flex flex-wrap -mb-px text-sm font-medium text-center">
    {#each tabs as tab, i}
      <li class="mr-2">
        <button
          class="inline-block p-4 {activeTab === i 
            ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-500 dark:border-blue-500' 
            : 'border-b-2 border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'}"
          aria-current={activeTab === i ? "page" : undefined}
          on:click={() => activeTab = i}
        >
          {tab}
        </button>
      </li>
    {/each}
  </ul>
</div>
