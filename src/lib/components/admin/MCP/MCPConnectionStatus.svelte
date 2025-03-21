<!-- MCP Connection Status Component -->
<script>
    export let status = 'disconnected';
    
    function getStatusColor(status) {
        switch (status) {
            case 'running':
                return 'bg-yellow-400';
            case 'connected':
                return 'bg-green-500';
            case 'stopped':
            case 'disconnected':
                return 'bg-gray-400';
            case 'error':
                return 'bg-red-500';
            default:
                return 'bg-gray-400';
        }
    }
    
    function getStatusText(status) {
        switch (status) {
            case 'running':
                return 'Running';
            case 'connected':
                return 'Connected';
            case 'stopped':
                return 'Stopped';
            case 'disconnected':
                return 'Disconnected';
            case 'error':
                return 'Error';
            default:
                return 'Unknown';
        }
    }
</script>

<div class="flex items-center ml-2">
    <span 
        class="w-2 h-2 rounded-full {getStatusColor(status)}"
        title={getStatusText(status)}
    ></span>
    <span class="ml-1 text-xs text-gray-500">{getStatusText(status)}</span>
</div>
