import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { sessionMiddleware, sessionTracker } from './src/middleware/session.js';
import chatRoutes from './src/routes/chatRoutes.js';
import speechRoutes from './src/routes/speechRoutes.js';

// Initialize Express app
const app = express();

// Get directory path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
console.log(`Current NODE_ENV: ${process.env.NODE_ENV}`); // Add this line

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? 
    'https://mypay-staff-chatbot-a2ape5hwcmfxgvfg.eastus2-01.azurewebsites.net':
    'http://localhost:5173',
  credentials: true, // Allow credentials (cookies/sessions)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Session management for conversation history
app.use(sessionMiddleware);
app.use(sessionTracker);

// Serve static files from the "public" directory (for any additional assets)
app.use(express.static(path.join(__dirname, 'public')));

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  // Serve built frontend files from public directory
  app.use(express.static(path.join(__dirname, 'public')));
}

// Routes
app.use('/api', chatRoutes);
app.use('/api/speech', speechRoutes);

// Handle client-side routing - serve index.html for non-API routes (must be after API routes)
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(__dirname, 'public', 'index.html'));
    } else {
      res.status(404).json({ error: 'API endpoint not found' });
    }
  });
}

// Health check endpoint for deployment
app.get('/api/health', (req, res) => {
  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    services: {
      azureOpenAI: process.env.AZURE_API_KEY ? 'connected' : 'missing config',
      azureSpeech: process.env.AZURE_SPEECH_KEY ? 'connected' : 'missing config',
      azureSearch: process.env.AZURE_AI_SEARCH_KEY ? 'connected' : 'missing config'
    }
  };
  
  res.status(200).json(healthStatus);
});

// Debug endpoint to check environment variables (only in production for troubleshooting)
app.get('/api/debug/env', (req, res) => {
  if (process.env.NODE_ENV !== 'production') {
    return res.status(403).json({ error: 'Debug endpoint only available in production' });
  }
  
  res.json({
    nodeEnv: process.env.NODE_ENV,
    envVars: {
      AZURE_API_KEY: process.env.AZURE_API_KEY ? 'PRESENT' : 'MISSING',
      AZURE_SPEECH_KEY: process.env.AZURE_SPEECH_KEY ? 'PRESENT' : 'MISSING',
      AZURE_SPEECH_REGION: process.env.AZURE_SPEECH_REGION || 'MISSING',
      AZURE_SPEECH_ENDPOINT: process.env.AZURE_SPEECH_ENDPOINT || 'MISSING',
      AZURE_AI_SEARCH_KEY: process.env.AZURE_AI_SEARCH_KEY ? 'PRESENT' : 'MISSING',
      ENDPOINT_URL: process.env.ENDPOINT_URL || 'MISSING',
      DEPLOYMENT_NAME: process.env.DEPLOYMENT_NAME || 'MISSING'
    }
  });
});

// Root route - API information
app.get('/', (req, res) => {
  res.json({
    name: 'Maypay Staff Training Chatbot API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: 'GET /api/health',
      chat: 'POST /api/chat',
      conversationStatus: 'GET /api/conversation-status',
      resetConversation: 'POST /api/reset-conversation',
      textToSpeech: 'POST /api/speech/text-to-speech',
      speechToText: 'POST /api/speech/speech-to-text',
      voices: 'GET /api/speech/voices',
      test: 'GET /api/test'
    },
    documentation: 'Visit /api/health to check service status',
    timestamp: new Date()
  });
});

// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('Modular chatbot service initialized successfully');
});