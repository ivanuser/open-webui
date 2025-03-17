<!--
  PromptLibrary.svelte
  Main UI component for the Prompt Library extension
-->
<script>
  import { onMount } from 'svelte';
  
  // Example prompts data
  let prompts = [
    {
      id: 1,
      title: "Creative Story",
      content: "Write a short story about [topic] that includes [element] and has a twist ending.",
      category: "Creative Writing",
      tags: ["story", "creative"]
    },
    {
      id: 2,
      title: "Code Explanation",
      content: "Explain the following code in simple terms: \n\n```\n[code]\n```",
      category: "Programming",
      tags: ["code", "explanation"]
    },
    {
      id: 3,
      title: "Research Summary",
      content: "Summarize the key findings and implications of research on [topic].",
      category: "Academic",
      tags: ["research", "summary"]
    }
  ];
  
  let categories = ["All", "Creative Writing", "Programming", "Academic"];
  let selectedCategory = "All";
  let searchQuery = "";
  
  // Filter prompts based on category and search
  $: filteredPrompts = prompts.filter(prompt => {
    const matchesCategory = selectedCategory === "All" || prompt.category === selectedCategory;
    const matchesSearch = searchQuery === "" || 
      prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesCategory && matchesSearch;
  });
  
  // Function to use a prompt (in a real implementation, this would insert the prompt into the chat)
  function usePrompt(prompt) {
    alert(`Using prompt: ${prompt.title}`);
  }
</script>

<div class="p-4 max-w-4xl mx-auto">
  <h1 class="text-2xl font-bold mb-4">Prompt Library</h1>
  
  <div class="mb-6 flex flex-col sm:flex-row gap-4">
    <div class="flex-1">
      <input 
        type="text" 
        placeholder="Search prompts..."
        class="w-full p-2 border rounded-md"
        bind:value={searchQuery}
      />
    </div>
    
    <div class="flex gap-2 flex-wrap">
      {#each categories as category}
        <button 
          class="px-3 py-1 rounded-full {selectedCategory === category ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200'}"
          on:click={() => selectedCategory = category}
        >
          {category}
        </button>
      {/each}
    </div>
  </div>
  
  {#if filteredPrompts.length === 0}
    <div class="text-center py-8 bg-gray-100 dark:bg-gray-800 rounded-md">
      <p class="text-gray-500">No prompts found matching your criteria.</p>
    </div>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      {#each filteredPrompts as prompt}
        <div class="border rounded-md p-4 hover:shadow-md transition-shadow">
          <div class="flex justify-between items-start mb-2">
            <h3 class="text-lg font-bold">{prompt.title}</h3>
            <span class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded dark:bg-blue-900 dark:text-blue-200">
              {prompt.category}
            </span>
          </div>
          
          <div class="mb-4">
            <pre class="whitespace-pre-wrap bg-gray-50 dark:bg-gray-800 p-2 rounded text-sm overflow-auto max-h-40">{prompt.content}</pre>
          </div>
          
          <div class="flex justify-between items-center">
            <div class="flex flex-wrap gap-1">
              {#each prompt.tags as tag}
                <span class="bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded dark:bg-gray-700 dark:text-gray-300">
                  #{tag}
                </span>
              {/each}
            </div>
            
            <button 
              class="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              on:click={() => usePrompt(prompt)}
            >
              Use
            </button>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
