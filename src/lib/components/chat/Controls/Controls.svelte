<!-- Ultra minimal Controls component -->
<script>
	import { onMount, createEventDispatcher } from 'svelte';
	import { get } from 'svelte/store';
	import { settings, mcpServers } from '$lib/stores';
	import { getMCPTools, getActiveMCPServer } from '$lib/apis/mcp';
	import MCPInstructions from './MCPInstructions.svelte';

	export let messages = [];
	export let generating = false;
	export let disabled = false;
	export let loading = false;
	export let modelsSelected = [];
	export let activeModel = {};
	export let defaultStartupMessage = '';
	export let placeholder = '';
	export let showContinue = false;
	export let continueSynthesizing = false;
	export let textareaRef = null;
	export let systemPrompt = '';
	export let isLandingPage = false;

	const dispatch = createEventDispatcher();
	let activeMCPServer = null;
	let activeMCPServerId = null;
	let value = defaultStartupMessage || '';

	// Simple text formatting function
	function formatText(text) {
		return text || '';
	}

	// Update content
	export function update(value_) {
		value = value_;
	}

	// Handle dynamic height
	export function handleHeight(e) {
		// Simplified height handling
		if (textareaRef?.elm) {
			try {
				textareaRef.elm.style.height = 'auto';
				textareaRef.elm.style.height = `${textareaRef.elm.scrollHeight}px`;
			} catch (error) {
				console.warn('Height adjustment error:', error);
			}
		}
	}

	// Submit message
	export function submitMessage() {
		if (loading || (disabled && !isLandingPage)) return;

		// Check if there is a message to submit
		let messageToSubmit = formatText(value);
		if (messageToSubmit.trim() === '') return;

		// Clear the input field
		value = '';
		handleHeight({ target: { value: '' } });

		// Prepare MCP system prompt
		let finalSystemPrompt = systemPrompt || '';
		
		// Add MCP prompt if active
		if (activeMCPServer) {
			const mcpPrompt = generateMCPSystemPrompt();
			if (mcpPrompt) {
				finalSystemPrompt = finalSystemPrompt 
					? `${finalSystemPrompt}\n\n${mcpPrompt}` 
					: mcpPrompt;
			}
		}
		
		// If no system prompt but model has template, use that
		if (!finalSystemPrompt && activeModel?.promptTemplate) {
			finalSystemPrompt = activeModel.promptTemplate;
		}

		// Create new message to send
		const messageToSend = {
			content: messageToSubmit,
			prompt: finalSystemPrompt,
			model: modelsSelected.length > 0 ? [...modelsSelected] : [activeModel],
			submitted: true,
			generating: true,
			continue: false,
			continueSynthesizing
		};

		dispatch('submit', messageToSend);
	}

	// Handle regenerate with continue function
	export function regenerateWithContinue() {
		if (generating) return;
		dispatch('regenerate', { continue: true, continueSynthesizing });
	}

	// Stop generation
	export function stopGeneration() {
		if (!generating) return;
		dispatch('stopGenerating');
	}

	// Handle content change
	export function handleContentChange(updatedValue) {
		value = updatedValue || '';
		handleHeight({ target: { value } });
	}

	// Generate MCP system prompt
	function generateMCPSystemPrompt() {
		if (!activeMCPServer) return '';
		
		// Get tools based on server type
		const tools = getMCPTools();
		if (!tools || tools.length === 0) return '';
		
		// Format the system prompt with tool definitions
		let prompt = 'You have access to the following tools through the Model Context Protocol:\n\n';
		
		tools.forEach(tool => {
			const name = tool.function?.name || '';
			const description = tool.function?.description || '';
			prompt += `Tool: ${name}\n`;
			prompt += `Description: ${description}\n\n`;
		});
		
		// Add server-specific instructions
		if (activeMCPServer.type === 'filesystem' || activeMCPServer.type === 'filesystem-py') {
			// Add allowed directory path
			const allowedPath = activeMCPServer.args[activeMCPServer.args.length - 1] || '';
			const isWindows = allowedPath.includes('\\') || allowedPath.includes(':');
			
			prompt += `\nThe filesystem tools only have access to paths under: ${allowedPath}\n`;
			prompt += `Use ${isWindows ? 'backslashes' : 'forward slashes'} for paths.\n`;
		}
		
		// Add tool usage instructions
		prompt += `\nWhen you need to use a tool, respond with a JSON object in this format inside a code block:

\`\`\`json
{
  "action": "tool_name",
  "params": {
    "param1": "value1",
    "param2": "value2"
  }
}
\`\`\`

Always wrap the JSON in a code block with \`\`\`json and \`\`\` markers.
Use tools directly when they're appropriate for the task.
Wait for tool results before continuing.
`;
		
		return prompt;
	}

	// Initialize MCP integration
	async function initializeMCPIntegration() {
		try {
			// Get current settings
			const currentSettings = get(settings);
			const defaultServerId = currentSettings?.defaultMcpServer;
			
			// Get all MCP servers
			const servers = get(mcpServers) || [];
			const connectedServers = servers.filter(server => server.status === 'connected');
			
			// Set active server
			if (defaultServerId) {
				activeMCPServer = connectedServers.find(server => server.id === defaultServerId);
				if (activeMCPServer) {
					activeMCPServerId = activeMCPServer.id;
				}
			}
			
			// If no active server but we have connected servers, use the first one
			if (!activeMCPServer && connectedServers.length > 0) {
				activeMCPServer = connectedServers[0];
				activeMCPServerId = activeMCPServer.id;
			}
		} catch (error) {
			console.error('Error initializing MCP:', error);
		}
	}

	onMount(() => {
		// Initialize MCP integration
		initializeMCPIntegration();
		
		// Initialize with default message
		if (defaultStartupMessage) {
			value = defaultStartupMessage;
			handleHeight({ target: { value } });
		}
	});
</script>

<div class="flex flex-col w-full">
	<!-- MCP Instructions -->
	<MCPInstructions selectedMCPServer={activeMCPServerId} />
	
	<!-- Textarea for message input -->
	<div class="relative flex flex-col w-full">
		<slot name="textarea" {value} {handleContentChange} {submitMessage} {disabled} {placeholder} />
		
		<div class="flex items-center justify-end py-2">
			<!-- Submit button -->
			{#if !generating || isLandingPage}
				<button
					disabled={loading || (disabled && !isLandingPage)}
					class="flex justify-center items-center text-white p-1 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
					on:click={submitMessage}
				>
					<svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path
							d="M10.3009 13.6949L20.102 3.89742M10.5795 14.1355L12.8019 18.5804C13.339 19.6545 13.6075 20.1916 13.9458 20.3356C14.2394 20.4606 14.575 20.4379 14.8492 20.2747C15.1651 20.0866 15.34 19.5183 15.6898 18.3818L19.7882 4.08434C20.1229 2.9942 20.2902 2.44913 20.1787 2.12573C20.0813 1.84298 19.8748 1.62951 19.5975 1.52252C19.2776 1.40091 18.7326 1.56233 17.6426 1.88517L3.29176 5.96938C2.15504 6.31768 1.58668 6.49183 1.40446 6.80221C1.24481 7.07443 1.22708 7.40923 1.35743 7.70131C1.5062 8.03803 2.04345 8.30551 3.11795 8.84047L7.44509 11.0629C7.93254 11.3 8.17626 11.4101 8.38334 11.5841C8.5677 11.738 8.61544 11.9199 8.61902 12.1056C8.6229 12.3094 8.56267 12.5515 8.44221 13.0359C8.33451 13.4658 8.28066 13.6808 8.18336 13.8608C8.09655 14.0213 7.98398 14.1645 7.85104 14.2829C7.70576 14.4145 7.52553 14.5158 7.16507 14.7184C6.59661 15.0272 6.31238 15.1816 6.08626 15.2029C5.88925 15.221 5.69223 15.1793 5.51766 15.0828C5.31935 14.9729 5.1656 14.7648 4.8581 14.3486L2.68276 11.5306"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
				</button>
			{/if}
		</div>
	</div>

	<!-- Stop/Continue buttons -->
	{#if generating && !isLandingPage}
		<div class="flex justify-center my-2">
			<button
				class="flex justify-center items-center gap-2 px-4 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
				on:click={stopGeneration}
			>
				<span>Stop</span>
			</button>
		</div>
	{:else if showContinue && !generating && !isLandingPage}
		<div class="flex justify-center my-2">
			<button
				class="flex justify-center items-center gap-2 px-4 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
				on:click={regenerateWithContinue}
			>
				<span>Continue</span>
			</button>
		</div>
	{/if}
</div>
