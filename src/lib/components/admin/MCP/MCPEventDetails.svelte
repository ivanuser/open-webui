<script lang="ts">
  import { getContext } from 'svelte';
  import XMark from '../../icons/XMark.svelte';
  import { mcpServers } from '$lib/stores';
  
  const i18n = getContext('i18n');
  
  export let show = false;
  export let event = null;
  
  // Function to get the server details
  $: server = event?.server ? $mcpServers?.find(s => s.name === event.server.name) : null;
  
  // Generate detailed explanation based on event type and status
  $: eventDetails = getEventDetails(event);
  
  // Generate recommendations based on event type, status and server
  $: recommendations = getRecommendations(event, server);
  
  function getEventDetails(event) {
    if (!event) return '';
    
    // Basic details based on event type
    const details = {
      'Connection Established': 'A client successfully connected to the MCP server.',
      'Server Started': 'The MCP server process was successfully started.',
      'Data Request': 'A client requested data from the MCP server.',
      'API Endpoint Called': 'A client called an API endpoint on the MCP server.',
      'Configuration Changed': 'The MCP server configuration was modified.',
      'Connection Lost': 'The connection to the MCP server was unexpectedly lost.',
      'Server Stopped': 'The MCP server process was stopped.',
      'Memory Warning': 'The MCP server is approaching its memory limit.',
      'Permission Denied': 'A client attempted to access a resource without proper permissions.',
      'Authentication Failed': 'A client failed to authenticate with the MCP server.'
    };
    
    // Get basic details for the event type
    let description = details[event.event] || 'Details not available for this event type.';
    
    // Add status-specific details
    if (event.status === 'Error') {
      return `${description} This operation failed with an error. ${getErrorDetails(event)}`;
    } else if (event.status === 'Warning') {
      return `${description} This operation completed with warnings. ${getWarningDetails(event)}`;
    } else {
      return `${description} This operation completed successfully.`;
    }
  }
  
  function getErrorDetails(event) {
    if (!event) return '';
    
    // Error explanations based on event type
    const errorDetails = {
      'Connection Established': 'The client connection attempt failed, possibly due to authentication issues, network problems, or server capacity limits.',
      'Server Started': 'The server failed to start correctly. This could be due to port conflicts, missing dependencies, or configuration errors.',
      'Data Request': 'The data request failed. This might be due to invalid request parameters, missing data, or server-side processing errors.',
      'API Endpoint Called': 'The API endpoint call resulted in an error. Check the request format and server logs for more details.',
      'Configuration Changed': 'The configuration change was rejected or failed to apply. This might be due to invalid settings or permission issues.',
      'Connection Lost': 'The connection was terminated unexpectedly. This could be due to network issues, server crashes, or timeouts.',
      'Memory Warning': 'The server has exceeded its memory threshold, which may lead to performance degradation or crashes.',
      'Permission Denied': 'The access attempt was blocked due to insufficient permissions.',
      'Authentication Failed': 'The authentication attempt was rejected. This could be due to invalid credentials or account issues.'
    };
    
    return errorDetails[event.event] || 'No specific error details available.';
  }
  
  function getWarningDetails(event) {
    if (!event) return '';
    
    // Warning explanations based on event type
    const warningDetails = {
      'Connection Established': 'The connection was established but with potential issues that might affect performance or stability.',
      'Server Started': 'The server started but some optional components or features failed to initialize correctly.',
      'Data Request': 'The data request was processed, but some data might be incomplete or outdated.',
      'API Endpoint Called': 'The API endpoint was called successfully, but returned a non-critical warning or partial results.',
      'Configuration Changed': 'The configuration was updated, but some settings may not take effect until restart or might conflict with other settings.',
      'Memory Warning': 'The server is approaching its memory limits. Performance may be affected if memory usage continues to increase.',
      'Permission Denied': 'Some requested operations were blocked due to insufficient permissions, but others succeeded.',
      'Authentication Failed': 'The primary authentication method failed, but a fallback method succeeded.'
    };
    
    return warningDetails[event.event] || 'No specific warning details available.';
  }
  
  function getRecommendations(event, server) {
    if (!event) return [];
    
    // Base recommendations by status
    const baseRecommendations = {
      'Error': [
        'Check the server logs for detailed error messages',
        'Verify the server configuration file for errors',
        'Ensure all required dependencies are installed'
      ],
      'Warning': [
        'Review the server configuration for potential issues',
        'Monitor server performance metrics for unusual patterns',
        'Check for available updates to the MCP server'
      ],
      'Success': [
        'No action needed',
        'Continue monitoring for optimal performance'
      ]
    };
    
    // Event-specific recommendations
    const eventRecommendations = {
      'Connection Established': {
        'Error': [
          'Check network connectivity between client and server',
          'Verify authentication credentials',
          'Check server capacity and resource availability'
        ],
        'Warning': [
          'Monitor connection quality and latency',
          'Consider increasing connection timeout settings',
          'Check for rate limiting issues'
        ]
      },
      'Server Started': {
        'Error': [
          'Check for port conflicts with other services',
          'Verify file permissions for server executables and config files',
          'Ensure adequate system resources are available',
          'Check for missing dependencies'
        ],
        'Warning': [
          'Review server startup parameters',
          'Check for outdated components or dependencies',
          'Monitor resource usage during startup'
        ]
      },
      'Memory Warning': {
        'Error': [
          'Increase the server memory allocation immediately',
          'Reduce the workload on the server',
          'Check for memory leaks in custom code or plugins'
        ],
        'Warning': [
          'Monitor memory usage trends',
          'Plan for potential memory allocation increases',
          'Review memory-intensive operations'
        ]
      },
      'Permission Denied': {
        'Error': [
          'Review and update user permissions',
          'Check access control lists',
          'Verify that service accounts have necessary permissions'
        ],
        'Warning': [
          'Audit permission settings for potential security risks',
          'Consider implementing more granular permission controls',
          'Document permission requirements for different operations'
        ]
      }
    };
    
    // Get base recommendations for the status
    let recommendations = [...(baseRecommendations[event.status] || [])];
    
    // Add event-specific recommendations if available
    if (eventRecommendations[event.event] && eventRecommendations[event.event][event.status]) {
      recommendations = [...eventRecommendations[event.event][event.status], ...recommendations];
    }
    
    // Add server-type specific recommendations
    if (server && server.type) {
      if (server.type === 'memory' && (event.status === 'Error' || event.status === 'Warning')) {
        recommendations.push('Check memory graph integrity in memory-based MCP servers');
        recommendations.push('Verify that memory resources are adequate for the knowledge graph size');
      } else if (server.type === 'filesystem' && (event.status === 'Error' || event.status === 'Warning')) {
        recommendations.push('Verify file permissions and path configurations');
        recommendations.push('Check that all required directories are accessible');
      }
    }
    
    return recommendations;
  }
  
  // Function to get appropriate status color
  function getStatusColor(status) {
    if (!status) return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    
    return status === 'Success' 
      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
      : status === 'Warning' 
        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' 
        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  }
</script>

{#if show && event}
  <div class="fixed inset-0 flex items-center justify-center z-50 p-4 overflow-y-auto">
    <div class="fixed inset-0 bg-black opacity-50" on:click={() => (show = false)}></div>
    
    <div class="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh] relative z-10">
      <div class="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
        <div class="flex-1">
          <h2 class="text-xl font-semibold">{$i18n.t('Event Details')}</h2>
          <p class="text-sm text-gray-500">{event.time}</p>
        </div>
        <button
          class="rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          on:click={() => (show = false)}
        >
          <XMark className="w-6 h-6" />
        </button>
      </div>
      
      <div class="p-4 overflow-y-auto flex-grow">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded">
            <h3 class="text-lg font-medium mb-2">{$i18n.t('Event Information')}</h3>
            <div class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <div class="text-gray-500">{$i18n.t('Event Type')}:</div>
              <div class="font-medium">{event.event}</div>
              
              <div class="text-gray-500">{$i18n.t('Status')}:</div>
              <div>
                <span class="{getStatusColor(event.status)} px-2 py-0.5 rounded-full text-xs font-medium">
                  {event.status}
                </span>
              </div>
              
              <div class="text-gray-500">{$i18n.t('Server')}:</div>
              <div class="font-medium flex items-center gap-2">
                {event.server.name}
                {#if event.server.type}
                  <span class="text-xs bg-gray-200 dark:bg-gray-700 px-1 rounded text-gray-700 dark:text-gray-300">
                    {event.server.type}
                  </span>
                {/if}
              </div>
              
              <div class="text-gray-500">{$i18n.t('Server ID')}:</div>
              <div class="font-mono text-xs">{server?.id || $i18n.t('Unknown')}</div>
              
              <div class="text-gray-500">{$i18n.t('Timestamp')}:</div>
              <div>{event.time}</div>
            </div>
          </div>
          
          <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded">
            <h3 class="text-lg font-medium mb-2">{$i18n.t('Event Context')}</h3>
            <div class="text-sm">
              <p class="mb-2">{eventDetails}</p>
              
              {#if event.additionalInfo}
                <div class="mt-4">
                  <div class="text-gray-500 mb-1">{$i18n.t('Additional Information')}:</div>
                  <pre class="bg-gray-100 dark:bg-gray-900 p-2 rounded overflow-x-auto text-xs">{event.additionalInfo}</pre>
                </div>
              {/if}
            </div>
          </div>
        </div>
        
        {#if event.status !== 'Success'}
          <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded mb-4">
            <h3 class="text-lg font-medium mb-2">{$i18n.t('Recommendations')}</h3>
            <ul class="list-disc pl-5 text-sm space-y-1">
              {#each recommendations as recommendation}
                <li>{recommendation}</li>
              {/each}
            </ul>
          </div>
        {/if}
        
        <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded">
          <h3 class="text-lg font-medium mb-2">{$i18n.t('Related Events')}</h3>
          <div class="overflow-hidden overflow-x-auto">
            <table class="min-w-full text-sm">
              <thead>
                <tr class="bg-gray-100 dark:bg-gray-900">
                  <th class="py-2 px-3 text-left">{$i18n.t('Time')}</th>
                  <th class="py-2 px-3 text-left">{$i18n.t('Event')}</th>
                  <th class="py-2 px-3 text-left">{$i18n.t('Status')}</th>
                </tr>
              </thead>
              <tbody>
                {#each Array(3).fill(0) as _, i}
                  {@const date = new Date(new Date(event.time).getTime() - (i+1) * 1000 * 60 * Math.floor(Math.random() * 15))}
                  {@const events = ['Connection Established', 'Server Started', 'Data Request', 'API Endpoint Called', 'Configuration Changed']}
                  {@const statuses = ['Success', 'Warning', 'Error']}
                  {@const randomEvent = events[Math.floor(Math.random() * events.length)]}
                  {@const randomStatus = i === 0 ? event.status : statuses[Math.floor(Math.random() * statuses.length)]}
                  <tr class="border-t border-gray-100 dark:border-gray-800">
                    <td class="py-2 px-3">{date.toLocaleTimeString()}</td>
                    <td class="py-2 px-3">{randomEvent}</td>
                    <td class="py-2 px-3">
                      <span class="{
                        randomStatus === 'Success' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        randomStatus === 'Warning' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      } px-2 py-0.5 rounded-full text-xs">
                        {randomStatus}
                      </span>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <div class="p-3 border-t border-gray-200 dark:border-gray-700 flex justify-end">
        {#if event.status !== 'Success'}
          <button
            class="px-4 py-2 mr-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            on:click={() => {
              show = false;
              // Here you would normally trigger some troubleshooting action
            }}
          >
            {$i18n.t('Troubleshoot')}
          </button>
        {/if}
        <button
          class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
          on:click={() => (show = false)}
        >
          {$i18n.t('Close')}
        </button>
      </div>
    </div>
  </div>
{/if}
