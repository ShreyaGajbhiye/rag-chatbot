import { 
  ChatMessageSchema, 
  ErrorResponseSchema,
  safeParse 
} from '../models/chatModels.js';

/**
 * Validation middleware for request data
 */

// Main validation middleware for chat messages
export const validateChatMessage = (req, res, next) => {
  const validation = safeParse(ChatMessageSchema, req.body);
  
  if (!validation.success) {
    console.error('Chat message validation failed:', validation.error);
    
    const errorResponse = ErrorResponseSchema.parse({
      error: 'Invalid request data',
      code: 'VALIDATION_ERROR',
      details: {
        validationErrors: validation.error,
        receivedData: req.body
      },
      timestamp: new Date()
    });
    
    return res.status(400).json(errorResponse);
  }
  
  req.validatedData = validation.data;
  next();
};

// Generic validation middleware factory
export const validateSchema = (schema, source = 'body') => {
  return (req, res, next) => {
    const data = source === 'body' ? req.body : 
                 source === 'params' ? req.params : 
                 source === 'query' ? req.query : req[source];
    
    const validation = safeParse(schema, data);
    
    if (!validation.success) {
      const errorResponse = ErrorResponseSchema.parse({
        error: `Invalid ${source} data`,
        code: 'VALIDATION_ERROR',
        details: {
          validationErrors: validation.error,
          source,
          receivedData: data
        },
        timestamp: new Date()
      });
      
      return res.status(400).json(errorResponse);
    }
    
    req.validatedData = validation.data;
    next();
  };
};

// Request logging middleware (enabled for conversation tracking)
export const logRequest = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const sessionId = req.sessionID || 'unknown';
  console.log(`📥 [${sessionId}] ${timestamp} - ${req.method} ${req.path}`);
  next();
};

// Legacy validation middleware (maintained for backward compatibility)
export const validateRequest = (schema) => {
  return (req, res, next) => {
    const validation = safeParse(schema, req.body);
    
    if (!validation.success) {
      const errorResponse = ErrorResponseSchema.parse({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: { validationErrors: validation.error },
        timestamp: new Date()
      });
      
      return res.status(400).json(errorResponse);
    }
    
    req.body = validation.data;
    next();
  };
};