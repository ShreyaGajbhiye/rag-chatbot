import express from 'express';
import { 
  handleChatMessage, 
  resetConversation, 
  getConversationStatus, 
  healthCheck 
} from '../controllers/chatController.js';
import { 
  validateChatMessage, 
  logRequest 
} from '../middleware/validation.js';

const router = express.Router();

// Apply request logging to all routes
router.use(logRequest);

// Chat endpoints with validation
router.post('/chat', validateChatMessage, handleChatMessage);
router.post('/reset-conversation', resetConversation);
router.get('/conversation-status', getConversationStatus);
router.get('/health', healthCheck);

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ 
    status: 'Server is running',
    timestamp: new Date(),
    message: 'Maypay Chatbot API is healthy'
  });
});

export default router;
