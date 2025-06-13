import { AzureOpenAI } from 'openai';
import { azureConfig } from '../config/azure.js';

/**
 * Azure OpenAI Service
 * Handles communication with Azure OpenAI for chat completions
 */
class AzureOpenAIService {
  constructor() {
    this.client = null;
    this.initialize();
  }

  /**
   * Initialize the Azure OpenAI client with configuration
   */
  initialize() {
    try {
      this.client = new AzureOpenAI({
        apiKey: azureConfig.openai.apiKey,
        endpoint: azureConfig.openai.endpoint,
        deployment: azureConfig.openai.deployment,
        apiVersion: azureConfig.openai.apiVersion
      });
    } catch (error) {
      console.error('Failed to initialize Azure OpenAI service:', error.message);
      throw error;
    }
  }

  /**
   * Generate AI response using Azure OpenAI
   * @param {Array} messages - Array of conversation messages
   * @param {Object} options - Additional options for the API call
   * @returns {Object} Response object with content, usage, and model info
   */
  async generateResponse(messages, options = {}) {
    try {
      const defaultOptions = {
        model: azureConfig.openai.deployment,
        temperature: 0.4,         // Balance between creativity and consistency
        max_tokens: 1000,         // Reasonable response length
        top_p: 0.9,              // Nucleus sampling for quality
        frequency_penalty: 0.2,   // Reduce repetition
        presence_penalty: 0.1     // Encourage topic diversity
      };

      const completion = await this.client.chat.completions.create({
        ...defaultOptions,
        ...options,
        messages
      });

      return {
        response: completion.choices[0].message.content,
        usage: completion.usage,
        model: completion.model
      };
    } catch (error) {
      console.error('Azure OpenAI API Error:', error.message);
      throw this.handleOpenAIError(error);
    }
  }

  /**
   * Handle and transform OpenAI API errors into user-friendly messages
   * @param {Error} error - The original error from OpenAI API
   * @returns {Error} User-friendly error
   */
  handleOpenAIError(error) {
    if (error.code === 'quota_exceeded' || error.status === 429) {
      return new Error('Service temporarily busy. Please wait a moment and try again.');
    } else if (error.code === 'content_filter') {
      return new Error('Your message was filtered. Please rephrase your question.');
    } else if (error.code === 'invalid_request_error') {
      return new Error('Invalid request. Please check your message and try again.');
    } else {
      return new Error('AI service temporarily unavailable. Please try again later.');
    }
  }
}

export default new AzureOpenAIService();
