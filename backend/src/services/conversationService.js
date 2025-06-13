import { ChatHistoryItemSchema, ResetConversationResponseSchema, ConversationStatusSchema } from '../models/chatModels.js';

class ConversationService {
  constructor() {
    this.maxTurns = 50;
    this.maxMessagesInContext = 20; // For API calls to manage tokens
  }

  initializeConversation(session) {
    if (!session.conversationHistory) {
      session.conversationHistory = [];
    }
    if (!session.conversationCreatedAt) {
      session.conversationCreatedAt = new Date();
    }
    return session.conversationHistory;
  }

  addToConversation(session, userMessage, assistantResponse) {
    const history = this.initializeConversation(session);
    
    // Log conversation activity
    const sessionId = session.id || 'unknown';
    if (history.length === 0) {
      console.log(`🆕 New conversation started for session: ${sessionId}`);
    }
    
    // Create validated chat history items
    const userHistoryItem = ChatHistoryItemSchema.parse({
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    });

    const assistantHistoryItem = ChatHistoryItemSchema.parse({
      role: 'assistant',
      content: assistantResponse,
      timestamp: new Date()
    });

    // Add new messages to conversation history
    history.push(userHistoryItem, assistantHistoryItem);

    // Log the conversation exchange
    console.log(`💬 [${sessionId}] USER: ${userMessage.substring(0, 100)}${userMessage.length > 100 ? '...' : ''}`);
    console.log(`🤖 [${sessionId}] ASSISTANT: ${assistantResponse.substring(0, 100)}${assistantResponse.length > 100 ? '...' : ''}`);

    // Maintain only last 50 turns (100 messages) to prevent memory issues
    if (history.length > this.maxTurns * 2) {
      session.conversationHistory = history.slice(-(this.maxTurns * 2 - 2));
    }

    // Update last activity
    session.lastActivity = new Date();

    const currentTurn = this.getCurrentTurn(session);
    console.log(`📊 [${sessionId}] Turn: ${currentTurn}/${this.maxTurns}, Total messages: ${history.length}`);

    return currentTurn;
  }

  getConversationContext(session) {
    const history = this.initializeConversation(session);
    
    // Return recent messages for API context (to manage token limits)
    const recentHistory = history.slice(-this.maxMessagesInContext);
    
    const sessionId = session.id || 'unknown';
    console.log(`🔄 [${sessionId}] Building context with ${recentHistory.length} recent messages (${history.length} total)`);
    
    // Format for OpenAI API (only role and content, no timestamp)
    return recentHistory.map(item => ({
      role: item.role,
      content: item.content
    }));
  }

  getCurrentTurn(session) {
    const history = this.initializeConversation(session);
    return Math.floor(history.length / 2);
  }

  resetConversation(session) {
    session.conversationHistory = [];
    session.conversationCreatedAt = new Date();
    session.lastActivity = new Date();
    
    return ResetConversationResponseSchema.parse({
      message: 'Conversation history reset successfully',
      conversationTurn: 0,
      timestamp: new Date()
    });
  }

  getConversationStatus(session) {
    const currentTurn = this.getCurrentTurn(session);
    
    return ConversationStatusSchema.parse({
      conversationTurn: currentTurn,
      maxTurns: this.maxTurns,
      hasHistory: currentTurn > 0,
      messagesInHistory: session.conversationHistory ? session.conversationHistory.length : 0,
      created_at: session.conversationCreatedAt || new Date(),
      last_activity: session.lastActivity || new Date()
    });
  }

  buildSystemPrompt(context) {
    return `You are a helpful and professional staff training assistant for DigiRestro Supply Chain Management. Your job is to guide new and existing employees through business workflows and best practices. Be clear, encouraging, and patient.
- Explain processes clearly and encourage best practices.
- Offer practical advice, tips, and clarifications as needed.
- Maintain a friendly, professional, and supportive tone.
- If a question is unclear or missing context, ask polite clarifying questions.
- Tailor your response to the user’s experience level when possible.
- Format responses using **bold**, *italic*, bullet points, and clear headings for better readability.
- Always ensure the information you provide is accurate and actionable.
`    + (context ? `\nContext: ${context}` : '');
  }

  buildMessages(session, userMessage, systemPrompt) {
    const messages = [
      { role: 'system', content: systemPrompt }
    ];

    // Add conversation history
    const recentHistory = this.getConversationContext(session);
    messages.push(...recentHistory);

    // Add current user message
    messages.push({ role: 'user', content: userMessage });

    return messages;
  }
}

export default new ConversationService();
