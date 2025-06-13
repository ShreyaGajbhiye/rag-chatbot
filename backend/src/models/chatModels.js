import { z } from 'zod';

/**
 * Validation schemas for chat functionality using Zod
 * Provides type safety and validation for all chat-related data structures
 */

// Message roles enum
export const MessageRole = z.enum(['user', 'assistant', 'system']);

// Chat history item schema
export const ChatHistoryItemSchema = z.object({
  role: MessageRole,
  content: z.string().min(1),
  timestamp: z.date().default(() => new Date()),
  metadata: z.record(z.any()).optional()
});

// Chat request schema  
export const ChatRequestSchema = z.object({
  message: z.string()
    .min(1, 'Message cannot be empty')
    .max(5000, 'Message too long (max 5000 characters)'),
  session_id: z.string().optional().default('default'),
  conversation_history: z.array(ChatHistoryItemSchema).optional().default([]),
  include_training_data: z.boolean().default(true)
});

// Simple chat message schema
export const ChatMessageSchema = z.object({
  message: z.string()
    .min(1, 'Message cannot be empty')
    .max(5000, 'Message too long (max 5000 characters)'),
  session_id: z.string().optional().default('default')
});

// Chat response schema
export const ChatResponseSchema = z.object({
  response: z.string(),
    session_id: z.string(),
  timestamp: z.date().default(() => new Date()),
  conversationTurn: z.number().int().min(0),
  maxTurns: z.number().int().min(1),
  documentsFound: z.number().int().min(0),
  usage: z.object({
    completion_tokens: z.number().int().min(0),
    prompt_tokens: z.number().int().min(0),
    total_tokens: z.number().int().min(0),
    completion_tokens_details: z.object({
      accepted_prediction_tokens: z.number().int().min(0),
      audio_tokens: z.number().int().min(0),
      reasoning_tokens: z.number().int().min(0),
      rejected_prediction_tokens: z.number().int().min(0)
    }).optional(),
    prompt_tokens_details: z.object({
      audio_tokens: z.number().int().min(0),
      cached_tokens: z.number().int().min(0)
    }).optional()
  }).optional(),
  reasoning: z.string().optional(),
  training_insights: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional()
});

// Conversation history schema
export const ConversationHistorySchema = z.object({
  session_id: z.string(),
  messages: z.array(ChatHistoryItemSchema),
  created_at: z.date().default(() => new Date()),
  last_activity: z.date().default(() => new Date()),
  turn_count: z.number().int().min(0),
  max_turns: z.number().int().min(1)
});

// Conversation status schema
export const ConversationStatusSchema = z.object({
  conversationTurn: z.number().int().min(0),
  maxTurns: z.number().int().min(1),
  hasHistory: z.boolean(),
  messagesInHistory: z.number().int().min(0),
  session_id: z.string().optional(),
  created_at: z.date().optional(),
  last_activity: z.date().optional()
});

// Error response schema
export const ErrorResponseSchema = z.object({
  error: z.string(),
  code: z.string().optional(),
    details: z.record(z.any()).optional(),
  timestamp: z.date().default(() => new Date())
});

// Health check response schema
export const HealthCheckResponseSchema = z.object({
  status: z.enum(['healthy', 'unhealthy']),
  timestamp: z.date().default(() => new Date()),
  services: z.object({
    openai: z.enum(['connected', 'disconnected', 'error']),
    search: z.enum(['connected', 'disconnected', 'error'])
  }),
  version: z.string().optional(),
  uptime: z.number().optional()
});

// Reset conversation response schema
export const ResetConversationResponseSchema = z.object({
  message: z.string(),
  conversationTurn: z.number().int().min(0),
  session_id: z.string().optional(),
  timestamp: z.date().default(() => new Date())
});

/**
 * Validation helper functions
 */
export const validateAndParse = (schema, data, context = '') => {
  try {
    return {
      success: true,
      data: schema.parse(data),
      error: null
    };
  } catch (error) {
    console.error(`Validation error in ${context}:`, error.errors);
    return {
      success: false,
      data: null,
      error: {
        message: 'Validation failed',
        details: error.errors || error.message,
        context
      }
    };
  }
};

// Safe parsing helper
export const safeParse = (schema, data) => {
  const result = schema.safeParse(data);
  return {
    success: result.success,
    data: result.success ? result.data : null,
    error: result.success ? null : result.error.errors
  };
};

// Message roles constants
export const MessageRoleEnum = {
  USER: 'user',
  ASSISTANT: 'assistant', 
  SYSTEM: 'system'
};

// Training insights schema
export const TrainingInsightsSchema = z.object({
  documentsUsed: z.number().int().min(0),
  searchQuery: z.string(),
  contextLength: z.number().int().min(0),
  relevanceScore: z.number().min(0).max(1).optional(),
  sources: z.array(z.string()).optional()
});
