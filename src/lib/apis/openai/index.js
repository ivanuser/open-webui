/**
 * OpenAI API Integration
 * Re-exports all functions from the TypeScript implementation
 */

// Re-export all functions from the TypeScript file
export * from './index.ts';

// Explicitly re-export the chatCompletion function to ensure it's available
export { chatCompletion } from './index.ts';
