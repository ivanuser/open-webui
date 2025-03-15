/**
 * Hello World Extension
 * A simple example extension for Open WebUI
 */

import { UIExtension } from 'open-webui-extensions';
import GreetingComponent from './components/Greeting.svelte';
import { StandardHooks } from 'open-webui-extensions';

/**
 * Hello World Extension class
 */
export default class HelloWorldExtension extends UIExtension {
  /**
   * Initialize the extension
   */
  async initialize() {
    console.log('Hello World Extension initialized');
    
    // Register hooks
    this.registerHook({
      name: StandardHooks.UI_CHAT_SIDEBAR,
      handler: this.handleChatSidebar.bind(this),
      priority: 10
    });
    
    this.registerHook({
      name: StandardHooks.UI_HEADER,
      handler: this.handleHeader.bind(this),
      priority: 10
    });
  }
  
  /**
   * Activate the extension
   */
  async activate() {
    console.log('Hello World Extension activated');
  }
  
  /**
   * Deactivate the extension
   */
  async deactivate() {
    console.log('Hello World Extension deactivated');
  }
  
  /**
   * Handle the chat sidebar hook
   * @param {object} context The hook context
   * @returns {object} The component to render
   */
  handleChatSidebar(context) {
    return {
      component: GreetingComponent,
      props: {
        message: this.settings.message || 'Hello, World!',
        showTimestamp: this.settings.showTimestamp !== false,
        textColor: this.settings.textColor || 'default'
      }
    };
  }
  
  /**
   * Handle the header hook
   * @param {object} context The hook context
   * @returns {object} The component to render
   */
  handleHeader(context) {
    // This example doesn't add anything to the header
    return null;
  }
  
  /**
   * Get UI components provided by this extension
   * @returns {Map} Map of component locations to component factories
   */
  getUIComponents() {
    return new Map([
      ['chat-sidebar', () => Promise.resolve(GreetingComponent)]
    ]);
  }
}
