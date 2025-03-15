<script lang="ts">
  import type { MarketplaceExtension } from '../api';
  
  // Props
  export let featured: MarketplaceExtension[] = [];
  export let spotlight = null;
  export let onViewDetails: (extension: MarketplaceExtension) => void;
  export let onInstall: (extension: MarketplaceExtension) => void;
</script>

<div class="space-y-6">
  <!-- Spotlight feature (if available) -->
  {#if spotlight}
    <div class="relative rounded-xl overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
      <div class="absolute top-0 left-0 w-full h-full bg-black opacity-30"></div>
      
      <div class="relative z-10 p-6 md:p-8 flex flex-col md:flex-row gap-6">
        <div class="md:w-2/3">
          <h3 class="text-xl md:text-2xl font-bold mb-2">{spotlight.title}</h3>
          <p class="mb-4 text-sm md:text-base">{spotlight.description}</p>
          
          <div class="flex flex-wrap gap-2">
            {#each featured as extension (extension.id)}
              {#if extension.id === spotlight.id}
                <button
                  on:click={() => onViewDetails(extension)}
                  class="px-4 py-2 bg-white text-blue-700 hover:bg-blue-50 rounded-md text-sm font-medium"
                >
                  Learn More
                </button>
                
                <button
                  on:click={() => onInstall(extension)}
                  class="px-4 py-2 bg-blue-800 text-white hover:bg-blue-900 rounded-md text-sm font-medium"
                >
                  Install Now
                </button>
              {/if}
            {/each}
          </div>
        </div>
        
        <!-- Optional image -->
        {#if spotlight.banner}
          <div class="md:w-1/3 flex items-center justify-center">
            <img 
              src={spotlight.banner} 
              alt={spotlight.title} 
              class="max-h-48 md:max-h-64 object-contain"
            />
          </div>
        {/if}
      </div>
    </div>
  {/if}
  
  <!-- Featured extensions section -->
  <div>
    <h3 class="text-lg font-medium mb-4">Featured Extensions</h3>
    
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      {#each featured.slice(0, 3) as extension (extension.id)}
        <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
          <div class="p-4">
            <h4 class="font-medium mb-1 dark:text-white">{extension.name}</h4>
            <p class="text-sm text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">{extension.description}</p>
            
            {#if extension.featuredReason}
              <div class="mb-3 text-xs text-blue-600 dark:text-blue-400 italic">
                {extension.featuredReason}
              </div>
            {/if}
            
            <div class="flex justify-between mt-2">
              <button
                on:click={() => onViewDetails(extension)}
                class="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                View Details
              </button>
              
              <button
                on:click={() => onInstall(extension)}
                class="text-sm text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 px-2 py-1 rounded"
              >
                Install
              </button>
            </div>
          </div>
        </div>
      {/each}
    </div>
  </div>
</div>
