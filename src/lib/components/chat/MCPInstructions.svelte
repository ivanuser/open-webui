<!-- Instructions for using MCP tools -->
<script>
	import { fade } from 'svelte/transition';
	
	export let serverType = 'filesystem';
</script>

<div class="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm mb-3 max-w-full overflow-auto" in:fade={{ duration: 300 }}>
	<h4 class="font-medium mb-2">How to Use MCP Tools</h4>
	
	{#if serverType === 'filesystem' || serverType === 'filesystem-py'}
		<p class="mb-1">The AI can interact with your files using these commands:</p>
		<ul class="list-disc pl-5 space-y-1 mb-2">
			<li><code>list_directory</code> - Lists files in a directory</li>
			<li><code>read_file</code> - Reads a file's contents</li>
			<li><code>write_file</code> - Creates or updates a file</li>
			<li><code>create_directory</code> - Creates folders</li>
			<li><code>search_files</code> - Finds files matching a pattern</li>
		</ul>
		<p class="mb-1">Example prompts:</p>
		<ul class="list-disc pl-5 space-y-1">
			<li>Show me what files are in /tmp</li>
			<li>Read the content of file.txt</li>
			<li>Create a new file called hello.txt with "Hello World" inside</li>
			<li>Create a directory called "test"</li>
			<li>Find all python files in this directory</li>
		</ul>
	{:else if serverType === 'memory'}
		<p class="mb-1">The AI can remember information using these commands:</p>
		<ul class="list-disc pl-5 space-y-1 mb-2">
			<li><code>store_memory</code> - Saves information</li>
			<li><code>retrieve_memory</code> - Recalls saved information</li>
			<li><code>search_memory</code> - Searches through saved information</li>
		</ul>
		<p class="mb-1">Example prompts:</p>
		<ul class="list-disc pl-5 space-y-1">
			<li>Remember that my favorite color is blue</li>
			<li>What's my favorite color?</li>
			<li>Find information about colors</li>
		</ul>
	{:else}
		<p>This MCP server provides additional capabilities to the AI. Try asking it about what tools it has available.</p>
	{/if}
</div>
