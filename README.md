# DigiRestro Staff Training Chatbot

A production-ready AI-powered chatbot for training restaurant staff on DigiRestro Supply Chain Management (SCM) workflows. Features Azure AI integration, 50-turn conversation memory, RAG pipeline, and clean validation architecture.

## 🚀 Features

- ✅ **50-Turn Conversation Memory**: Maintains extended conversation context for comprehensive training sessions
- ✅ **Azure AI Integration**: Powered by Azure OpenAI GPT models with Azure Cognitive Search
- ✅ **RAG Pipeline**: Retrieval-Augmented Generation for accurate, document-based responses
- ✅ **Modular Architecture**: Clean, scalable backend with validation middleware
- ✅ **Session Management**: Persistent conversations with Express sessions
- ✅ **Modern React Frontend**: Responsive chatbot interface with Markdown rendering
- ✅ **Training-Focused**: Specialized for DigiRestro SCM workflows (Purchase Orders, Transfer Orders, Goods Receipt, Stock Adjustments)

## 📁 Project Structure

```
maypay-chatbot/
├── frontend/ (React app)
│   ├── src/
│   │   ├── components/           # React components
│   │   │   ├── ChatbotIcon.jsx   # Bot avatar icon
│   │   │   ├── ChatForm.jsx      # Message input form
│   │   │   └── ChatMessage.jsx   # Message display with Markdown
│   │   ├── services/
│   │   │   └── chatService.js    # API integration
│   │   ├── App.jsx               # Main app component
│   │   ├── main.jsx              # React entry point
│   │   └── index.css             # Styles + Markdown CSS
│   ├── package.json              # Frontend dependencies
│   └── vite.config.js            # Vite configuration
│
├── backend/ (Node.js/Express API)
│   ├── src/
│   │   ├── controllers/          # Request handlers
│   │   │   └── chatController.js # Main chat logic
│   │   ├── services/             # Business logic
│   │   │   ├── azureOpenAIService.js    # Azure OpenAI integration
│   │   │   ├── azureSearchService.js    # Azure AI Search integration
│   │   │   └── conversationService.js   # Conversation management
│   │   ├── models/               # Data validation
│   │   │   └── chatModels.js     # Zod schemas (Pydantic-style)
│   │   ├── middleware/           # Express middleware
│   │   │   ├── validation.js     # Request validation
│   │   │   └── session.js        # Session management
│   │   ├── routes/               # API routes
│   │   │   └── chatRoutes.js     # Chat endpoints
│   │   └── config/               # Configuration
│   │       └── azure.js          # Azure service config
│   ├── server.js                 # Express server entry point
│   └── package.json              # Backend dependencies
│
├── python-backend/ (Alternative - not active)
└── README.md                     # This file
```

## 🛠️ Quick Start

### Prerequisites

- Node.js 18+ and npm
- Azure OpenAI account with GPT deployment
- Azure Cognitive Search with indexed training documents

### 1. Environment Setup

Create `.env` file in the root directory:

```env
# Azure OpenAI Configuration
AZURE_API_KEY=your_azure_openai_api_key
ENDPOINT_URL=https://your-resource.openai.azure.com/
DEPLOYMENT_NAME=your_gpt_deployment_name

# Azure AI Search Configuration
AZURE_AI_SEARCH_ENDPOINT=https://your-search-service.search.windows.net
AZURE_AI_SEARCH_INDEX=your_search_index_name
AZURE_AI_SEARCH_KEY=your_search_admin_key

# Session Configuration
SESSION_SECRET=your_secure_session_secret_for_production

# Optional
AZURE_COGNITIVE_SERVICES_RESOURCE=your_cognitive_services_resource
PORT=3001
```

### 2. Installation & Running

```bash
# Install all dependencies (frontend + backend)
npm install

# Start both frontend and backend concurrently
npm start

# Or run separately:
# Backend only
npm run server

# Frontend only (in another terminal)
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001

## 🔗 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | API information and status |
| `POST` | `/api/chat` | Send message to chatbot |
| `GET` | `/api/conversation-status` | Get current conversation status |
| `POST` | `/api/reset-conversation` | Reset conversation history |
| `GET` | `/api/health` | Health check for Azure services |
| `GET` | `/api/test` | Test endpoint |

### Example Chat Request

```json
POST /api/chat
{
  "message": "How do I create a purchase order in DigiRestro?"
}
```

### Example Response

```json
{
  "response": "To create a purchase order in DigiRestro, follow these steps:\n\n**Step 1: Access Purchase Orders**\n- Navigate to the SCM module...",
  "session_id": "sess_abc123",
  "conversationTurn": 5,
  "maxTurns": 50,
  "documentsFound": 3,
  "training_insights": {
    "documentsUsed": 3,
    "searchQuery": "create purchase order",
    "contextLength": 1200,
    "relevanceScore": 0.89
  }
}
```

## 🎯 Training Focus Areas

The chatbot specializes in DigiRestro SCM workflows:

1. **Purchase Orders (PO)** 
   - Creating supplier orders
   - Approval workflows
   - Tracking and management

2. **Transfer Orders (TO)**
   - Inter-location inventory transfers
   - Warehouse management
   - Stock movement tracking

3. **Goods Receipt (GR)**
   - Receiving incoming inventory
   - Quality verification
   - System updates

4. **Stock Adjustments**
   - Inventory corrections
   - Discrepancy management
   - Audit trails

## 🧠 AI Configuration

### Conversation Management
- **Max Turns**: 50 per session
- **Context Memory**: Last 20 messages for API calls
- **Session Persistence**: 24 hours
- **Response Format**: Markdown with structured formatting

### Prompt Engineering
The system uses a specialized prompt designed for:
- Step-by-step guidance
- Real-world restaurant context
- Progressive learning approach
- Best practices and troubleshooting

## 🎨 Frontend Features

- **Markdown Rendering**: Full support for formatted responses
- **Responsive Design**: Works on desktop and mobile
- **Real-time Chat**: Immediate responses with loading states
- **Session Persistence**: Conversations survive page refreshes
- **Error Handling**: User-friendly error messages

## 🔧 Development

### Code Quality
- **ESLint**: Configured for React best practices
- **Validation**: Zod schemas for type-safe API validation
- **Error Handling**: Comprehensive error catching and logging
- **Session Management**: Express sessions with proper security

### File Structure Explanation

#### Frontend (`/src`)
- `App.jsx`: Main React component with chat state management
- `components/ChatMessage.jsx`: Renders messages with Markdown parsing
- `components/ChatForm.jsx`: Input form with validation
- `services/chatService.js`: API communication layer
- `index.css`: Comprehensive styling including Markdown support

#### Backend (`/backend/src`)
- `controllers/chatController.js`: Request handling with validation
- `services/conversationService.js`: Memory management and prompt building
- `services/azureOpenAIService.js`: Azure OpenAI API integration
- `services/azureSearchService.js`: Document retrieval and context building
- `models/chatModels.js`: Zod validation schemas (Pydantic-style)
- `middleware/validation.js`: Request validation middleware

## 📊 Monitoring & Health

The application includes comprehensive health checks:
- Azure OpenAI connectivity
- Azure Search service status
- Session management health
- Token usage tracking

Access health status at: `GET /api/health`

## 🚀 Production Deployment

### Environment Variables
Ensure all required environment variables are set:
- Set `SESSION_SECRET` to a strong, unique value
- Use HTTPS in production (update CORS settings)
- Configure proper Azure resource permissions

### Security Considerations
- Enable HTTPS for secure cookie transmission
- Implement rate limiting for API endpoints
- Monitor Azure service quotas and usage
- Regular security updates for dependencies

## 🔄 Updates & Maintenance

### Adding New Training Content
1. Upload documents to Azure Cognitive Search index
2. Update system prompt in `conversationService.js` if needed
3. Test with sample queries to ensure proper retrieval

### Scaling Considerations
- Azure OpenAI: Monitor token usage and rate limits
- Azure Search: Consider index optimization for large document sets
- Session Storage: Consider Redis for multi-server deployments

## 📝 License

MIT License - Built for DigiRestro Staff Training

## 🆘 Support

For technical issues:
1. Check `/api/health` endpoint for service status
2. Review console logs for detailed error information
3. Verify Azure service connectivity and quotas
4. Check environment variable configuration

---

**Built with**: Node.js, Express, React, Azure OpenAI, Azure Cognitive Search, Zod Validation
