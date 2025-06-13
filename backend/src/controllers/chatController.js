import azureOpenAIService from '../services/azureOpenAIService.js';
import azureSearchService from '../services/azureSearchService.js';
import conversationService from '../services/conversationService.js';
import { 
  ChatResponseSchema,
  ConversationStatusSchema,
  HealthCheckResponseSchema,
  ResetConversationResponseSchema,
  ErrorResponseSchema,
  TrainingInsightsSchema,
  safeParse
} from '../models/chatModels.js';

export const handleChatMessage = async (req, res) => {
  try {
    // Use validated data from middleware (if available) or fallback to req.body
    const { message } = req.validatedData || req.body;
    const sessionId = req.sessionID || 'unknown';

    console.log(`🚀 [${sessionId}] Processing chat request: "${message.substring(0, 100)}${message.length > 100 ? '...' : ''}"`);

    // Search for relevant documents
    const searchResults = await azureSearchService.searchDocuments(message);
    console.log(`🔍 [${sessionId}] Found ${searchResults.documents.length} relevant documents`);

    // Build context from search results
    const context = azureSearchService.buildContext(searchResults);

    // Build system prompt with context
    const systemPrompt = conversationService.buildSystemPrompt(context);

    // Build messages array with conversation history
    const messages = conversationService.buildMessages(req.session, message, systemPrompt);

    console.log(`📝 [${sessionId}] Sending ${messages.length} messages to AI (including ${messages.length - 2} from history)`);

    // Generate response using Azure OpenAI
    const aiResponse = await azureOpenAIService.generateResponse(messages);
    console.log(`✅ [${sessionId}] AI response generated (${aiResponse.usage?.total_tokens || 'unknown'} tokens)`);

    // Add to conversation history
    const currentTurn = conversationService.addToConversation(
      req.session, 
      message, 
      aiResponse.response
    );

    // Build enhanced training insights
    const trainingInsights = {
      documentsUsed: searchResults.documents?.length || 0,
      searchQuery: message,
      contextLength: context.length,
      relevanceScore: searchResults.documents?.length > 0 ? 
        searchResults.documents.reduce((acc, doc) => acc + (doc.score || 0), 0) / searchResults.documents.length : 0,
      sources: searchResults.documents?.map(doc => doc.title).filter(Boolean) || []
    };

    // Create response data
    const responseData = {
      response: aiResponse.response,
      session_id: req.sessionID || 'default',
      timestamp: new Date(),
      conversationTurn: currentTurn,
      maxTurns: conversationService.maxTurns,
      documentsFound: searchResults.totalFound,
      usage: aiResponse.usage,
      training_insights: trainingInsights
    };

    // Validate response before sending
    const validation = safeParse(ChatResponseSchema, responseData);
    
    if (!validation.success) {
      console.error('Response validation failed:', validation.error);
      throw new Error(`Response validation failed: ${JSON.stringify(validation.error)}`);
    }

    res.json(validation.data);

  } catch (error) {
    console.error('Chat Controller Error:', error.message);
    
    const errorResponse = ErrorResponseSchema.parse({
      error: error.message || 'Internal server error. Please try again later.',
      code: 'CHAT_ERROR',
      details: {
        originalError: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      timestamp: new Date()
    });
    
    res.status(500).json(errorResponse);
  }
};

export const resetConversation = (req, res) => {
  try {
    const result = conversationService.resetConversation(req.session);
    
    const responseData = {
      message: result.message,
      conversationTurn: result.conversationTurn,
      session_id: req.sessionID,
      timestamp: new Date()
    };

    const validation = safeParse(ResetConversationResponseSchema, responseData);
    
    if (!validation.success) {
      throw new Error(`Reset response validation failed: ${JSON.stringify(validation.error)}`);
    }

    res.json(validation.data);
  } catch (error) {
    console.error('Reset Conversation Error:', error.message);
    
    const errorResponse = ErrorResponseSchema.parse({
      error: 'Failed to reset conversation',
      code: 'RESET_ERROR',
      details: { originalError: error.message },
      timestamp: new Date()
    });
    
    res.status(500).json(errorResponse);
  }
};

export const getConversationStatus = (req, res) => {
  try {
    const status = conversationService.getConversationStatus(req.session);
    
    const statusData = {
      ...status,
      session_id: req.sessionID,
      created_at: new Date(), // You might want to track this properly
      last_activity: new Date()
    };

    const validation = safeParse(ConversationStatusSchema, statusData);
    
    if (!validation.success) {
      throw new Error(`Status response validation failed: ${JSON.stringify(validation.error)}`);
    }

    res.json(validation.data);
  } catch (error) {
    console.error('Get Conversation Status Error:', error.message);
    
    const errorResponse = ErrorResponseSchema.parse({
      error: 'Failed to get conversation status',
      code: 'STATUS_ERROR',
      details: { originalError: error.message },
      timestamp: new Date()
    });
    
    res.status(500).json(errorResponse);
  }
};

export const healthCheck = async (req, res) => {
  try {
    // Test Azure services
    let openaiStatus = 'connected';
    let searchStatus = 'connected';
    
    try {
      // Quick health check for Azure OpenAI (light test)
      await azureOpenAIService.generateResponse([
        { role: 'user', content: 'health check' }
      ], { max_tokens: 1 });
    } catch (error) {
      console.warn('Azure OpenAI health check failed:', error.message);
      openaiStatus = 'error';
    }
    
    try {
      // Quick health check for Azure Search
      await azureSearchService.searchDocuments('health check', { top: 1 });
    } catch (error) {
      console.warn('Azure Search health check failed:', error.message);
      searchStatus = 'error';
    }

    const healthData = {
      status: (openaiStatus === 'connected' && searchStatus === 'connected') ? 'healthy' : 'unhealthy',
      timestamp: new Date(),
      services: {
        openai: openaiStatus,
        search: searchStatus
      },
      version: '1.0.0',
      uptime: process.uptime()
    };

    const validation = safeParse(HealthCheckResponseSchema, healthData);
    
    if (!validation.success) {
      throw new Error(`Health response validation failed: ${JSON.stringify(validation.error)}`);
    }

    const statusCode = validation.data.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(validation.data);
    
  } catch (error) {
    console.error('Health Check Error:', error.message);
    
    const errorResponse = ErrorResponseSchema.parse({
      error: 'Health check failed',
      code: 'HEALTH_CHECK_ERROR',
      details: { originalError: error.message },
      timestamp: new Date()
    });
    
    res.status(500).json(errorResponse);
  }
};
