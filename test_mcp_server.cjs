#!/usr/bin/env node
/**
 * MCP Server Test Script (CommonJS version)
 * 
 * This script tests the MCP server by directly sending tool calls.
 * It's useful for debugging and testing the MCP server outside of the web UI.
 */

const { spawn } = require('child_process');
const path = require('path');
const readline = require('readline');

// Get the path to the MCP server script from the command line
const serverScript = process.argv[2] || './mcp_filesystem_server.js';
const allowedPath = process.argv[3] || '/home/ihoner';

if (!serverScript) {
  console.error('Usage: node test_mcp_server.cjs <server_script> [allowed_path]');
  process.exit(1);
}

console.log(`Testing MCP server: ${serverScript}`);
console.log(`Allowed path: ${allowedPath}`);

// Function to execute a tool call
async function executeToolCall(tool, args) {
  return new Promise((resolve, reject) => {
    // Create the tool call request
    const request = {
      jsonrpc: "2.0",
      method: "callTool",
      params: {
        name: tool,
        arguments: args
      },
      id: Date.now()
    };
    
    // Spawn the MCP server process
    const serverProcess = spawn(
      serverScript.endsWith('.py') ? 'python' : 'node', 
      [serverScript, allowedPath], 
      { stdio: ['pipe', 'pipe', 'pipe'] }
    );
    
    let stdout = '';
    let stderr = '';
    
    serverProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    serverProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    serverProcess.on('error', (error) => {
      reject(`Failed to start MCP server: ${error.message}`);
    });
    
    serverProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`MCP server process exited with code ${code}`);
        console.error('stderr:', stderr);
        reject(`MCP server error: ${stderr}`);
        return;
      }
      
      try {
        // Parse the response
        const responseLines = stdout.split('\n').filter(line => line.trim());
        let resultText = '';
        
        for (const line of responseLines) {
          try {
            const parsed = JSON.parse(line);
            if (parsed.result && parsed.id) {
              // This is a response to our tool call
              if (parsed.result.content && parsed.result.content.length > 0) {
                resultText = parsed.result.content[0].text;
              } else {
                resultText = JSON.stringify(parsed.result, null, 2);
              }
              break;
            }
          } catch (e) {
            // Not a valid JSON response, might be debugging output
            console.log('Non-JSON output from MCP server:', line);
          }
        }
        
        // If we didn't find a valid response, use the entire output
        if (!resultText && stdout.trim()) {
          resultText = stdout.trim();
        }
        
        resolve(resultText || `Executed ${tool} successfully but no output was returned`);
      } catch (error) {
        console.error('Error parsing MCP server response:', error);
        reject('Invalid response from MCP server');
      }
    });
    
    // Write the tool call request to the server's stdin
    serverProcess.stdin.write(JSON.stringify(request) + '\n');
    serverProcess.stdin.end();
  });
}

// Function to list tools
async function listTools() {
  return new Promise((resolve, reject) => {
    // Create the list tools request
    const request = {
      jsonrpc: "2.0",
      method: "listTools",
      params: {},
      id: Date.now()
    };
    
    // Spawn the MCP server process
    const serverProcess = spawn(
      serverScript.endsWith('.py') ? 'python' : 'node', 
      [serverScript, allowedPath], 
      { stdio: ['pipe', 'pipe', 'pipe'] }
    );
    
    let stdout = '';
    let stderr = '';
    
    serverProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    serverProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    serverProcess.on('error', (error) => {
      reject(`Failed to start MCP server: ${error.message}`);
    });
    
    serverProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`MCP server process exited with code ${code}`);
        console.error('stderr:', stderr);
        reject(`MCP server error: ${stderr}`);
        return;
      }
      
      try {
        // Parse the response
        const responseLines = stdout.split('\n').filter(line => line.trim());
        let tools = [];
        
        for (const line of responseLines) {
          try {
            const parsed = JSON.parse(line);
            if (parsed.result && parsed.result.tools && parsed.id) {
              tools = parsed.result.tools;
              break;
            }
          } catch (e) {
            // Not a valid JSON response, might be debugging output
          }
        }
        
        resolve(tools);
      } catch (error) {
        console.error('Error parsing MCP server response:', error);
        reject('Invalid response from MCP server');
      }
    });
    
    // Write the list tools request to the server's stdin
    serverProcess.stdin.write(JSON.stringify(request) + '\n');
    serverProcess.stdin.end();
  });
}

// Create readline interface for interactive testing
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Start the interactive testing loop
async function startInteractiveTesting() {
  try {
    // First, list the available tools
    console.log('Getting available tools...');
    const tools = await listTools();
    console.log('\nAvailable tools:');
    for (const tool of tools) {
      console.log(`- ${tool.name}: ${tool.description}`);
    }
    
    // Start the interactive loop
    console.log('\nInteractive MCP testing. Enter commands in the format: tool_name args_json');
    console.log('Example: list_directory {"path":"' + allowedPath + '"}');
    console.log('Enter "exit" to quit.');
    
    const promptUser = () => {
      rl.question('\n> ', async (input) => {
        if (input.toLowerCase() === 'exit') {
          rl.close();
          return;
        }
        
        // Parse the input
        try {
          // Split into tool name and args
          const match = input.match(/^(\w+)\s+(.*)$/);
          if (!match) {
            console.log('Invalid format. Use: tool_name args_json');
            promptUser();
            return;
          }
          
          const [_, tool, argsString] = match;
          const args = JSON.parse(argsString);
          
          // Execute the tool call
          console.log(`Executing ${tool} with args:`, args);
          const result = await executeToolCall(tool, args);
          console.log('\nResult:');
          console.log(result);
        } catch (error) {
          console.error('Error:', error.message || error);
        }
        
        promptUser();
      });
    };
    
    promptUser();
  } catch (error) {
    console.error('Error starting interactive testing:', error);
    rl.close();
  }
}

// Start the interactive testing
startInteractiveTesting();
