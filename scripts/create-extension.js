#!/usr/bin/env node

/**
 * Create Extension Script
 * Helper script to create a new Open WebUI extension
 * 
 * Usage: node create-extension.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { exec } = require('child_process');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Extension types
const EXTENSION_TYPES = ['ui', 'api', 'model-adapter', 'tool', 'theme'];

// Default manifest template
const manifestTemplate = {
  id: '',
  name: '',
  version: '1.0.0',
  description: '',
  author: '',
  homepage: '',
  repository: '',
  license: 'MIT',
  type: '',
  main: 'index.js',
  tags: [],
  settings: []
};

// Default index.js templates for different extension types
const indexTemplates = {
  ui: `/**
 * {{name}}
 * {{description}}
 */

import { UIExtension } from 'open-webui-extensions';
import { StandardHooks } from 'open-webui-extensions';

/**
 * {{name}} class
 */
export default class {{className}} extends UIExtension {
  /**
   * Initialize the extension
   */
  async initialize() {
    console.log('{{name}} initialized');
    
    // Register hooks
    this.registerHook({
      name: StandardHooks.UI_CHAT_SIDEBAR,
      handler: this.handleChatSidebar.bind(this),
      priority: 10
    });
  }
  
  /**
   * Activate the extension
   */
  async activate() {
    console.log('{{name}} activated');
  }
  
  /**
   * Deactivate the extension
   */
  async deactivate() {
    console.log('{{name}} deactivated');
  }
  
  /**
   * Handle the chat sidebar hook
   * @param {object} context The hook context
   * @returns {object} The component to render
   */
  handleChatSidebar(context) {
    // Return a component to render in the chat sidebar
    return null;
  }
  
  /**
   * Get UI components provided by this extension
   * @returns {Map} Map of component locations to component factories
   */
  getUIComponents() {
    return new Map();
  }
}
`,
  api: `/**
 * {{name}}
 * {{description}}
 */

import { APIExtension } from 'open-webui-extensions';

/**
 * {{name}} class
 */
export default class {{className}} extends APIExtension {
  /**
   * Initialize the extension
   */
  async initialize() {
    console.log('{{name}} initialized');
  }
  
  /**
   * Activate the extension
   */
  async activate() {
    console.log('{{name}} activated');
  }
  
  /**
   * Deactivate the extension
   */
  async deactivate() {
    console.log('{{name}} deactivated');
  }
  
  /**
   * Get API endpoints provided by this extension
   * @returns {Map} Map of endpoint paths to handler functions
   */
  getAPIEndpoints() {
    return new Map([
      ['/api/{{id}}/example', this.handleExampleEndpoint.bind(this)]
    ]);
  }
  
  /**
   * Handle the example endpoint
   * @param {object} request The request object
   * @returns {object} The response object
   */
  async handleExampleEndpoint(request) {
    return {
      status: 200,
      body: {
        message: 'Hello from {{name}}!'
      }
    };
  }
}
`,
  'model-adapter': `/**
 * {{name}}
 * {{description}}
 */

import { ModelAdapterExtension } from 'open-webui-extensions';

/**
 * {{name}} class
 */
export default class {{className}} extends ModelAdapterExtension {
  /**
   * Initialize the extension
   */
  async initialize() {
    console.log('{{name}} initialized');
  }
  
  /**
   * Activate the extension
   */
  async activate() {
    console.log('{{name}} activated');
  }
  
  /**
   * Deactivate the extension
   */
  async deactivate() {
    console.log('{{name}} deactivated');
  }
  
  /**
   * Get the model adapter configuration
   * @returns {object} Model adapter configuration
   */
  getModelAdapter() {
    return {
      id: '{{id}}',
      name: '{{name}}',
      models: []
    };
  }
}
`,
  tool: `/**
 * {{name}}
 * {{description}}
 */

import { ToolExtension } from 'open-webui-extensions';

/**
 * {{name}} class
 */
export default class {{className}} extends ToolExtension {
  /**
   * Initialize the extension
   */
  async initialize() {
    console.log('{{name}} initialized');
  }
  
  /**
   * Activate the extension
   */
  async activate() {
    console.log('{{name}} activated');
  }
  
  /**
   * Deactivate the extension
   */
  async deactivate() {
    console.log('{{name}} deactivated');
  }
  
  /**
   * Get the tools provided by this extension
   * @returns {array} Array of tool definitions
   */
  getTools() {
    return [
      {
        type: 'function',
        function: {
          name: 'example_function',
          description: 'An example function provided by {{name}}',
          parameters: {
            type: 'object',
            properties: {
              param1: {
                type: 'string',
                description: 'An example parameter'
              }
            },
            required: ['param1']
          }
        }
      }
    ];
  }
  
  /**
   * Execute a tool
   * @param {string} toolName The name of the tool to execute
   * @param {object} params The parameters for the tool
   * @returns {object} The result of the tool execution
   */
  async executeTool(toolName, params) {
    if (toolName === 'example_function') {
      return {
        result: \`Executed example_function with param1: \${params.param1}\`
      };
    }
    
    throw new Error(\`Unknown tool: \${toolName}\`);
  }
}
`,
  theme: `/**
 * {{name}}
 * {{description}}
 */

import { ThemeExtension } from 'open-webui-extensions';

/**
 * {{name}} class
 */
export default class {{className}} extends ThemeExtension {
  /**
   * Initialize the extension
   */
  async initialize() {
    console.log('{{name}} initialized');
  }
  
  /**
   * Activate the extension
   */
  async activate() {
    console.log('{{name}} activated');
  }
  
  /**
   * Deactivate the extension
   */
  async deactivate() {
    console.log('{{name}} deactivated');
  }
  
  /**
   * Get the theme CSS
   * @returns {string} The theme CSS
   */
  getThemeCSS() {
    return \`
      :root {
        --background: #ffffff;
        --foreground: #000000;
        /* Add your theme variables here */
      }
      
      @media (prefers-color-scheme: dark) {
        :root {
          --background: #000000;
          --foreground: #ffffff;
          /* Add your dark theme variables here */
        }
      }
    \`;
  }
  
  /**
   * Get the theme variables
   * @returns {Map} Map of CSS variables
   */
  getThemeVariables() {
    return new Map([
      ['--background', '#ffffff'],
      ['--foreground', '#000000']
    ]);
  }
}
`
};

// Default README.md template
const readmeTemplate = `# {{name}}

{{description}}

## Installation

1. Download the extension ZIP file
2. Open the Admin Panel in Open WebUI
3. Navigate to the Extensions page
4. Click "Install Extension" and select the ZIP file

## Usage

TODO: Add usage instructions

## Configuration

TODO: Add configuration instructions

## License

{{license}}
`;

// Helper to create directory if it doesn't exist
const createDirectoryIfNotExists = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Helper to capitalize the first letter of each word
const capitalize = (str) => {
  return str
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
};

// Helper to create a class name from an ID
const createClassName = (id) => {
  return capitalize(id) + 'Extension';
};

// Helper to replace template variables
const replaceTemplateVars = (template, vars) => {
  return Object.entries(vars).reduce((result, [key, value]) => {
    return result.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }, template);
};

// Ask for extension details
const askQuestions = async () => {
  const questions = [
    {
      prompt: 'Extension ID (kebab-case, e.g., "my-extension"): ',
      key: 'id',
      validate: (value) => {
        if (!value) return 'ID is required';
        if (!/^[a-z0-9-]+$/.test(value)) return 'ID must be in kebab-case (lowercase with hyphens)';
        return null;
      }
    },
    {
      prompt: 'Extension Name: ',
      key: 'name',
      validate: (value) => {
        if (!value) return 'Name is required';
        return null;
      }
    },
    {
      prompt: 'Description: ',
      key: 'description',
      validate: (value) => {
        if (!value) return 'Description is required';
        return null;
      }
    },
    {
      prompt: 'Author: ',
      key: 'author',
      validate: (value) => {
        if (!value) return 'Author is required';
        return null;
      }
    },
    {
      prompt: `Extension Type (${EXTENSION_TYPES.join(', ')}): `,
      key: 'type',
      validate: (value) => {
        if (!EXTENSION_TYPES.includes(value)) return `Type must be one of: ${EXTENSION_TYPES.join(', ')}`;
        return null;
      }
    },
    {
      prompt: 'Homepage URL (optional): ',
      key: 'homepage',
      validate: () => null
    },
    {
      prompt: 'Repository URL (optional): ',
      key: 'repository',
      validate: () => null
    },
    {
      prompt: 'License (default: MIT): ',
      key: 'license',
      default: 'MIT',
      validate: () => null
    },
    {
      prompt: 'Tags (comma-separated, optional): ',
      key: 'tags',
      validate: () => null,
      transform: (value) => value ? value.split(',').map(tag => tag.trim()) : []
    }
  ];

  const answers = {};

  for (const question of questions) {
    let answer;
    let isValid = false;

    while (!isValid) {
      answer = await new Promise((resolve) => {
        rl.question(question.prompt, resolve);
      });

      // Use default value if answer is empty and default is provided
      if (!answer && 'default' in question) {
        answer = question.default;
      }

      const error = question.validate(answer);
      if (error) {
        console.error(`Error: ${error}`);
      } else {
        isValid = true;
      }
    }

    // Transform the answer if a transform function is provided
    answers[question.key] = question.transform ? question.transform(answer) : answer;
  }

  return answers;
};

// Create the extension
const createExtension = async () => {
  console.log('Create a new Open WebUI Extension');
  console.log('================================');

  try {
    // Ask for extension details
    const answers = await askQuestions();

    // Create extension directory
    const extensionDir = path.join(process.cwd(), answers.id);
    createDirectoryIfNotExists(extensionDir);

    // Create manifest
    const manifest = { ...manifestTemplate, ...answers };
    fs.writeFileSync(
      path.join(extensionDir, 'manifest.json'),
      JSON.stringify(manifest, null, 2)
    );

    // Create index.js
    const indexTemplate = indexTemplates[answers.type];
    const indexContent = replaceTemplateVars(indexTemplate, {
      ...answers,
      className: createClassName(answers.id)
    });
    fs.writeFileSync(path.join(extensionDir, 'index.js'), indexContent);

    // Create README.md
    const readmeContent = replaceTemplateVars(readmeTemplate, answers);
    fs.writeFileSync(path.join(extensionDir, 'README.md'), readmeContent);

    // Create directories
    createDirectoryIfNotExists(path.join(extensionDir, 'static'));
    if (answers.type === 'ui') {
      createDirectoryIfNotExists(path.join(extensionDir, 'components'));
    }

    console.log(`\nExtension created successfully in ${extensionDir}`);
    
    // Create a ZIP file
    const zipCommand = process.platform === 'win32'
      ? `powershell Compress-Archive -Path "${extensionDir}\\*" -DestinationPath "${extensionDir}.zip" -Force`
      : `cd "${extensionDir}" && zip -r "../${answers.id}.zip" .`;
    
    console.log('\nCreating ZIP file...');
    
    exec(zipCommand, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error creating ZIP file: ${error.message}`);
        console.log('\nPlease manually zip the extension directory to install it in Open WebUI.');
      } else {
        console.log(`ZIP file created successfully: ${answers.id}.zip`);
      }
      
      console.log('\nNext steps:');
      console.log('1. Review and modify the extension code as needed');
      console.log('2. Install the extension in Open WebUI using the Extensions Manager');
      
      rl.close();
    });
  } catch (error) {
    console.error('Error creating extension:', error);
    rl.close();
  }
};

// Run the script
createExtension();
