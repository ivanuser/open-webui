<script>
  import { onMount } from 'svelte';
  import { MARKETPLACE_BASE_URL, MARKETPLACE_API } from '$lib/extensions/marketplace/config';
  
  let apiStatus = 'Checking...';
  let apiEndpoints = [];
  let requestErrors = [];
  
  // Convert the API object to key-value pairs for display
  for (const [key, value] of Object.entries(MARKETPLACE_API)) {
    if (typeof value === 'string') {
      apiEndpoints.push({ key, url: value });
    }
  }
  
  onMount(async () => {
    // Check API health
    try {
      const healthResponse = await fetch('/api/health');
      if (healthResponse.ok) {
        const data = await healthResponse.json();
        apiStatus = `API is working: ${data.message} at ${data.timestamp}`;
      } else {
        apiStatus = `API health check failed: ${healthResponse.status} ${healthResponse.statusText}`;
      }
    } catch (error) {
      apiStatus = `API health check error: ${error.message}`;
    }
    
    // Test marketplace endpoints
    for (const endpoint of apiEndpoints) {
      try {
        const response = await fetch(endpoint.url);
        endpoint.status = response.ok ? 'Ok' : `Failed: ${response.status}`;
        endpoint.contentType = response.headers.get('content-type');
      } catch (error) {
        endpoint.status = `Error: ${error.message}`;
        requestErrors.push({
          endpoint: endpoint.key,
          url: endpoint.url,
          error: error.message
        });
      }
    }
  });
  
  function testEndpoint(url) {
    window.open(url, '_blank');
  }
</script>

<div class="container mx-auto p-6">
  <h1 class="text-2xl font-bold mb-6">Debug Information</h1>
  
  <div class="grid gap-6">
    <!-- API Health -->
    <div class="p-4 border rounded-lg">
      <h2 class="text-lg font-semibold mb-2">API Health</h2>
      <div class="p-3 bg-gray-100 rounded">
        <code>{apiStatus}</code>
      </div>
    </div>
    
    <!-- Marketplace Configuration -->
    <div class="p-4 border rounded-lg">
      <h2 class="text-lg font-semibold mb-2">Marketplace Configuration</h2>
      <div class="p-3 bg-gray-100 rounded mb-4">
        <p><strong>Base URL:</strong> {MARKETPLACE_BASE_URL}</p>
      </div>
      
      <h3 class="font-medium mb-2">API Endpoints</h3>
      <div class="overflow-x-auto">
        <table class="min-w-full border">
          <thead>
            <tr class="bg-gray-50">
              <th class="px-4 py-2 text-left border-b">Endpoint</th>
              <th class="px-4 py-2 text-left border-b">URL</th>
              <th class="px-4 py-2 text-left border-b">Status</th>
              <th class="px-4 py-2 text-left border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each apiEndpoints as endpoint}
              <tr class="hover:bg-gray-50">
                <td class="px-4 py-2 border-b">{endpoint.key}</td>
                <td class="px-4 py-2 border-b">
                  <div class="truncate max-w-md">{endpoint.url}</div>
                </td>
                <td class="px-4 py-2 border-b">
                  <span class={endpoint.status?.includes('Error') || endpoint.status?.includes('Failed') ? 'text-red-500' : 'text-green-500'}>
                    {endpoint.status || 'Not tested'}
                  </span>
                </td>
                <td class="px-4 py-2 border-b">
                  <button 
                    class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                    on:click={() => testEndpoint(endpoint.url)}
                  >
                    Test
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
    
    <!-- Request Errors -->
    {#if requestErrors.length > 0}
      <div class="p-4 border rounded-lg border-red-300 bg-red-50">
        <h2 class="text-lg font-semibold mb-2 text-red-600">Request Errors</h2>
        <div class="space-y-3">
          {#each requestErrors as error}
            <div class="p-3 bg-white rounded border border-red-200">
              <p><strong>Endpoint:</strong> {error.endpoint}</p>
              <p><strong>URL:</strong> {error.url}</p>
              <p><strong>Error:</strong> {error.error}</p>
            </div>
          {/each}
        </div>
      </div>
    {/if}
    
    <!-- Browser Information -->
    <div class="p-4 border rounded-lg">
      <h2 class="text-lg font-semibold mb-2">Browser Information</h2>
      <div class="p-3 bg-gray-100 rounded">
        <p><strong>User Agent:</strong> {navigator.userAgent}</p>
        <p><strong>Current URL:</strong> {window.location.href}</p>
      </div>
    </div>
  </div>
</div>
