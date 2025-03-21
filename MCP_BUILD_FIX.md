# Open WebUI MCP Build Fix

## Problem Overview

The Open WebUI build was failing with this error message:

```
error during build:
src/lib/apis/openai/index.ts (2:9): "getMCPTools" is not exported by "src/lib/components/chat/MCPHandler.js", imported by "src/lib/apis/openai/index.ts".
```

This was happening because:
1. The `openai/index.ts` file was trying to import `getMCPTools` from `MCPHandler.js`
2. But the function was actually defined in `mcp/tools.js` 
3. And the re-export from `MCPHandler.js` wasn't working correctly

## Changes Made

1. Created a new dedicated `tools.js` file in the `src/lib/apis/mcp/` directory to centralize MCP tool-related functions
2. Updated import paths in `src/lib/apis/openai/index.ts` to import directly from the tools module
3. Added proper re-exports in `MCPHandler.js` and `mcp/index.js` for backward compatibility
4. Fixed other dependency issues in package.json and requirements.txt

### Detailed Fixes

1. Fixed OpenAI index.ts import:
   ```typescript
   // Changed from:
   import { getMCPTools, processMCPModelResponse } from '$lib/components/chat/MCPHandler';
   // To:
   import { getMCPTools, processMCPModelResponse, getActiveMCPServer } from '$lib/apis/mcp/tools';
   ```

2. Ensured MCPHandler.js correctly re-exports these functions:
   ```javascript
   import { getMCPTools, processMCPModelResponse } from '$lib/apis/mcp/tools';
   
   // Re-export the functions
   export { getMCPTools, processMCPModelResponse };
   ```

3. Fixed npm dependencies in package.json:
   - Changed `@modelcontextprotocol/sdk` from version `^0.2.0` to `^0.1.0`

4. Fixed Python dependencies in backend/requirements.txt:
   - Changed `uv==0.1.52` to `uv==0.5.31`
   - Changed `modelcontextprotocol==0.2.0` to `modelcontextprotocol==0.1.5`

## How to Build

After these changes, you should be able to build successfully:

```bash
npm run build
```

And start the development server:

```bash
npm run dev
```

## MCP Components Structure

The MCP implementation is now organized as follows:

1. **tools.js** - Contains the core MCP tool functions:
   - `getMCPTools` - Gets tool definitions for a server type
   - `processMCPModelResponse` - Processes tool calls in model responses
   - `getActiveMCPServer` - Gets the active MCP server

2. **execute.js** - Contains the tool execution function:
   - `executeMCPTool` - Executes an MCP tool call on a server

3. **index.js** - Provides API functions for MCP server management:
   - Server management: start, stop, connect, disconnect
   - Re-exports tool functions from tools.js and execute.js

4. **MCPHandler.js** - Integrates MCP with the chat interface:
   - Re-exports functions from tools.js
   - Provides tools for handling MCP in chat context

This structure centralizes tool definitions and avoids circular dependencies, ensuring the codebase is more maintainable.
