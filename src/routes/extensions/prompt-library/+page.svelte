<script>
  import { onMount } from 'svelte';
  import { getExtensionSettings } from '$lib/extensions/api/registry';
  
  let promptCategories = [
    { id: 'general', name: 'General' },
    { id: 'coding', name: 'Coding' },
    { id: 'writing', name: 'Writing' },
    { id: 'research', name: 'Research' }
  ];
  
  let prompts = [
    { 
      id: '1', 
      title: 'Code Explanation', 
      content: 'Please explain the following code in detail:\n\n```\n{code}\n```',
      category: 'coding',
      tags: ['code', 'explanation']
    },
    { 
      id: '2', 
      title: 'Blog Post Outline', 
      content: 'Create a detailed outline for a blog post about {topic}. Include section headers, key points, and a compelling introduction and conclusion.',
      category: 'writing',
      tags: ['blog', 'outline']
    },
    { 
      id: '3', 
      title: 'Research Summary', 
      content: 'Summarize the key findings, methodology, and implications from this research on {topic}.',
      category: 'research',
      tags: ['summary', 'research']
    }
  ];
  
  let selectedCategory = 'all';
  let searchQuery = '';
  let selectedPrompt = null;
  let editMode = false;
  let newPrompt = {
    title: '',
    content: '',
    category: 'general',
    tags: []
  };
  
  // Filter prompts based on search and category
  $: filteredPrompts = prompts.filter(prompt => {
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!prompt.title.toLowerCase().includes(query) && 
          !prompt.content.toLowerCase().includes(query) &&
          !prompt.tags.some(tag => tag.toLowerCase().includes(query))) {
        return false;
      }
    }
    
    // Filter by category
    if (selectedCategory !== 'all' && prompt.category !== selectedCategory) {
      return false;
    }
    
    return true;
  });
  
  onMount(() => {
    // Load extension settings
    const settings = getExtensionSettings('prompt-library');
    
    // Load saved prompts from localStorage
    const savedPrompts = localStorage.getItem('promptLibrary');
    if (savedPrompts) {
      prompts = JSON.parse(savedPrompts);
    }
  });
  
  function selectPrompt(prompt) {
    selectedPrompt = prompt;
    editMode = false;
  }
  
  function editPrompt() {
    editMode = true;
    newPrompt = { ...selectedPrompt };
  }
  
  function savePrompt() {
    if (editMode && selectedPrompt) {
      // Update existing prompt
      const index = prompts.findIndex(p => p.id === selectedPrompt.id);
      if (index >= 0) {
        prompts[index] = { ...newPrompt, id: selectedPrompt.id };
        prompts = [...prompts]; // Trigger reactivity
      }
    } else {
      // Create new prompt
      const id = Date.now().toString();
      prompts = [...prompts, { ...newPrompt, id }];
    }
    
    // Save to localStorage
    localStorage.setItem('promptLibrary', JSON.stringify(prompts));
    
    // Reset
    selectedPrompt = null;
    editMode = false;
    newPrompt = { title: '', content: '', category: 'general', tags: [] };
  }
  
  function deletePrompt() {
    if (selectedPrompt) {
      prompts = prompts.filter(p => p.id !== selectedPrompt.id);
      localStorage.setItem('promptLibrary', JSON.stringify(prompts));
      selectedPrompt = null;
    }
  }
  
  function handleTagsInput(event) {
    const tagInput = event.target.value;
    // Split by comma and trim whitespace
    newPrompt.tags = tagInput.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
  }
  
  function cancelEdit() {
    editMode = false;
    if (!selectedPrompt) {
      newPrompt = { title: '', content: '', category: 'general', tags: [] };
    }
  }
  
  function createNewPrompt() {
    selectedPrompt = null;
    editMode = true;
    newPrompt = { title: '', content: '', category: 'general', tags: [] };
  }
  
  function usePrompt(prompt) {
    // Copy to clipboard
    navigator.clipboard.writeText(prompt.content).then(() => {
      alert(`Prompt "${prompt.title}" copied to clipboard!`);
    }).catch(err => {
      console.error('Failed to copy prompt:', err);
    });
  }
</script>

<div class="p-4 h-full flex flex-col">
  <h1 class="text-2xl font-bold mb-4">Prompt Library</h1>
  
  <div class="flex-1 flex gap-4 max-h-full">
    <!-- Left sidebar - Categories and prompt list -->
    <div class="w-64 flex flex-col border rounded-md">
      <div class="p-3 border-b">
        <input 
          type="text" 
          placeholder="Search prompts..." 
          class="w-full px-3 py-2 border rounded-md"
          bind:value={searchQuery}
        />
      </div>
      
      <div class="p-3 border-b">
        <h2 class="font-medium mb-2">Categories</h2>
        <div class="space-y-1">
          <button 
            class="w-full text-left px-2 py-1 rounded-md {selectedCategory === 'all' ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'}"
            on:click={() => selectedCategory = 'all'}
          >
            All Categories
          </button>
          
          {#each promptCategories as category}
            <button 
              class="w-full text-left px-2 py-1 rounded-md {selectedCategory === category.id ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'}"
              on:click={() => selectedCategory = category.id}
            >
              {category.name}
            </button>
          {/each}
        </div>
      </div>
      
      <div class="flex-1 overflow-y-auto">
        {#if filteredPrompts.length === 0}
          <div class="p-3 text-center text-gray-500">No prompts found</div>
        {:else}
          <div class="divide-y">
            {#each filteredPrompts as prompt}
              <button 
                class="w-full text-left p-3 hover:bg-gray-50 {selectedPrompt?.id === prompt.id ? 'bg-blue-50' : ''}"
                on:click={() => selectPrompt(prompt)}
              >
                <h3 class="font-medium">{prompt.title}</h3>
                <p class="text-sm text-gray-500 truncate">{prompt.content.substring(0, 50)}...</p>
                <div class="flex flex-wrap gap-1 mt-1">
                  {#each prompt.tags as tag}
                    <span class="text-xs bg-gray-200 rounded-full px-2 py-0.5">{tag}</span>
                  {/each}
                </div>
              </button>
            {/each}
          </div>
        {/if}
      </div>
      
      <div class="p-3 border-t">
        <button 
          class="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md"
          on:click={createNewPrompt}
        >
          Create New Prompt
        </button>
      </div>
    </div>
    
    <!-- Right panel - Prompt details or editor -->
    <div class="flex-1 border rounded-md">
      {#if editMode}
        <!-- Prompt editor -->
        <div class="p-4 flex flex-col h-full">
          <h2 class="text-xl font-bold mb-4">{selectedPrompt ? 'Edit Prompt' : 'Create New Prompt'}</h2>
          
          <div class="space-y-4 flex-1 overflow-y-auto">
            <div>
              <label class="block text-sm font-medium mb-1">Title</label>
              <input 
                type="text" 
                class="w-full px-3 py-2 border rounded-md"
                placeholder="Enter prompt title"
                bind:value={newPrompt.title}
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium mb-1">Category</label>
              <select 
                class="w-full px-3 py-2 border rounded-md"
                bind:value={newPrompt.category}
              >
                {#each promptCategories as category}
                  <option value={category.id}>{category.name}</option>
                {/each}
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium mb-1">Tags (comma-separated)</label>
              <input 
                type="text" 
                class="w-full px-3 py-2 border rounded-md"
                placeholder="tag1, tag2, tag3"
                value={newPrompt.tags.join(', ')}
                on:input={handleTagsInput}
              />
            </div>
            
            <div class="flex-1">
              <label class="block text-sm font-medium mb-1">Content</label>
              <textarea 
                class="w-full h-64 px-3 py-2 border rounded-md resize-none"
                placeholder="Enter your prompt template here. Use {placeholders} for variables."
                bind:value={newPrompt.content}
              ></textarea>
            </div>
          </div>
          
          <div class="flex justify-end space-x-3 mt-4">
            <button 
              class="px-4 py-2 border rounded-md hover:bg-gray-100"
              on:click={cancelEdit}
            >
              Cancel
            </button>
            
            <button 
              class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              on:click={savePrompt}
              disabled={!newPrompt.title || !newPrompt.content}
            >
              Save Prompt
            </button>
          </div>
        </div>
      {:else if selectedPrompt}
        <!-- Prompt details view -->
        <div class="p-4 flex flex-col h-full">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-bold">{selectedPrompt.title}</h2>
            
            <div class="flex space-x-2">
              <button 
                class="p-2 text-blue-500 hover:bg-blue-50 rounded-md"
                on:click={editPrompt}
                title="Edit"
              >
                Edit
              </button>
              
              <button 
                class="p-2 text-red-500 hover:bg-red-50 rounded-md"
                on:click={deletePrompt}
                title="Delete"
              >
                Delete
              </button>
            </div>
          </div>
          
          <div class="mb-4">
            <div class="flex space-x-2 items-center">
              <span class="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md text-sm">
                {promptCategories.find(c => c.id === selectedPrompt.category)?.name || selectedPrompt.category}
              </span>
              
              {#each selectedPrompt.tags as tag}
                <span class="bg-gray-200 text-gray-800 px-2 py-0.5 rounded-full text-sm">{tag}</span>
              {/each}
            </div>
          </div>
          
          <div class="flex-1 border rounded-md p-4 bg-gray-50 whitespace-pre-wrap overflow-y-auto">
            {selectedPrompt.content}
          </div>
          
          <div class="mt-4">
            <button 
              class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              on:click={() => usePrompt(selectedPrompt)}
            >
              Use This Prompt
            </button>
          </div>
        </div>
      {:else}
        <!-- No prompt selected -->
        <div class="flex items-center justify-center h-full p-8 text-center text-gray-500">
          <div>
            <h3 class="text-lg font-medium mb-2">Select a prompt or create a new one</h3>
            <p class="mb-4">Your prompt library helps you save and reuse effective prompts.</p>
            <button 
              class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              on:click={createNewPrompt}
            >
              Create New Prompt
            </button>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>
