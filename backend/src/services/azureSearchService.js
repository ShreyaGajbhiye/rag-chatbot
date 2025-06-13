import { SearchClient, AzureKeyCredential } from '@azure/search-documents';
import { azureConfig } from '../config/azure.js';

/**
 * Azure AI Search Service
 * Handles document search and retrieval for training data context
 */
class AzureSearchService {
  constructor() {
    this.client = null;
    this.initialize();
  }

  /**
   * Initialize the Azure AI Search client
   */
  initialize() {
    try {
      this.client = new SearchClient(
        azureConfig.search.endpoint,
        azureConfig.search.index,
        new AzureKeyCredential(azureConfig.search.key)
      );
    } catch (error) {
      console.error('Failed to initialize Azure AI Search service:', error.message);
      throw error;
    }
  }

  /**
   * Search for relevant documents based on user query
   * @param {string} query - The search query
   * @param {Object} options - Search options
   * @returns {Object} Search results with documents and metadata
   */
  async searchDocuments(query, options = {}) {
    try {
      const defaultOptions = {
        top: 5,                           // Limit results for relevance
        queryType: 'simple',              // Use simple search by default
        searchFields: ['content', 'title'], // Search in content and title fields
        select: ['content', 'title']      // Return only necessary fields
      };

      const searchResults = await this.client.search(query, {
        ...defaultOptions,
        ...options
      });

      const documents = [];
      for await (const result of searchResults.results) {
        if (result.document.content) {
          documents.push({
            content: result.document.content,
            title: result.document.title || 'Training Material',
            score: result.score || 0
          });
        }
      }

      return {
        documents,
        query,
        totalFound: documents.length
      };
    } catch (error) {
      console.error('Azure Search Error:', error.message);
      // Fallback to simple search if semantic fails (only if not already using simple)
      if ((error.message.includes('semantic') || error.message.includes('Semantic')) && 
          options.queryType !== 'simple') {
        return this.searchDocuments(query, { ...options, queryType: 'simple' });
      }
      
      // If simple search also fails, return empty results
      console.warn('Search failed, returning empty results');
      return {
        documents: [],
        query,
        totalFound: 0
      };
    }
  }

  /**
   * Build context string from search results for AI prompt
   * @param {Object} searchResults - Results from document search
   * @returns {string} Formatted context for AI prompt
   */
  buildContext(searchResults) {
    if (!searchResults.documents || searchResults.documents.length === 0) {
      return 'No specific training documents found for this query.';
    }

    let context = '';
    searchResults.documents.forEach((doc, index) => {
      context += `Training Document ${index + 1}:\n`;
      if (doc.title) {
        context += `Title: ${doc.title}\n`;
      }
      context += `Content: ${doc.content}\n\n`;
    });

    return context;
  }
}

export default new AzureSearchService();
