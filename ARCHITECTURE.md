# DigiRestro SCM Training Chatbot - Architecture Documentation

## 🏗️ System Overview

The DigiRestro SCM Training Chatbot is a production-ready AI assistant built with Node.js/Express backend and React frontend, integrated with Azure AI services for intelligent training delivery.

## 📍 **SYSTEM PROMPT LOCATION**

**⚠️ IMPORTANT:** The main system prompt is located in:
```
/backend/src/services/conversationService.js
Line 83: buildSystemPrompt(context) method
```

This is where you should edit the chatbot's personality, training focus, and response behavior.

## 🏛️ Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    DIGIRESTRO SCM TRAINING CHATBOT                │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────┐    HTTP/WebSocket    ┌─────────────────────┐
│   REACT FRONTEND    │◄────────────────────►│   NODE.JS BACKEND   │
│    (Port 5173)      │                      │    (Port 3001)      │
└─────────────────────┘                      └─────────────────────┘
         │                                             │
         ▼                                             ▼
┌─────────────────────┐                      ┌─────────────────────┐
│  UI COMPONENTS      │                      │  API ROUTES         │
│  ├── ChatMessage    │                      │  ├── POST /chat     │
│  ├── ChatForm      │                      │  ├── GET /status    │
│  └── App           │                      │  └── POST /reset    │
└─────────────────────┘                      └─────────────────────┘
                                                       │
                                                       ▼
                                             ┌─────────────────────┐
                                             │   CONTROLLERS       │
                                             │  └── chatController │
                                             └─────────────────────┘
                                                       │
                                                       ▼
                                             ┌─────────────────────┐
                                             │    SERVICES         │
                                             │  ├── conversation   │
                                             │  ├── azureOpenAI    │
                                             │  └── azureSearch    │
                                             └─────────────────────┘
                                                       │
                                                       ▼
                                             ┌─────────────────────┐
                                             │   AZURE AI SERVICES │
                                             │  ├── OpenAI GPT-4   │
                                             │  └── Cognitive Search│
                                             └─────────────────────┘
```

## 📂 Project Structure & Key Files

### **Active Node.js/React Stack**

```
maypay-chatbot/
├── 📁 backend/                          # Node.js Backend
│   ├── server.js                        # ✅ Main server entry point
│   ├── 📁 src/
│   │   ├── 📁 controllers/
│   │   │   └── chatController.js        # ✅ Request handling logic
│   │   ├── 📁 services/
│   │   │   ├── conversationService.js   # 🎯 **SYSTEM PROMPT HERE**
│   │   │   ├── azureOpenAIService.js    # ✅ GPT-4 integration
│   │   │   └── azureSearchService.js    # ✅ RAG pipeline
│   │   ├── 📁 models/
│   │   │   └── chatModels.js            # ✅ Zod validation schemas
│   │   ├── 📁 middleware/
│   │   │   └── validation.js            # ✅ Request validation
│   │   └── 📁 routes/
│   │       └── chatRoutes.js            # ✅ API route definitions
│   └── package.json                     # ✅ Backend dependencies
├── 📁 src/                              # React Frontend
│   ├── App.jsx                          # ✅ Main React component
│   ├── 📁 components/
│   │   ├── ChatMessage.jsx              # ✅ Message rendering
│   │   └── ChatForm.jsx                 # ✅ Input form
│   ├── 📁 services/
│   │   └── chatService.js               # ✅ API client
│   └── index.css                        # ✅ Styling + Markdown CSS
├── package.json                         # ✅ Frontend dependencies
├── README.md                            # ✅ Setup documentation
└── ARCHITECTURE.md                      # 📝 This file
```

### **Inactive/Legacy Files** (Not Used)
```
├── 📁 python-backend/                   # ❌ Alternative implementation
└── 📁 src/services/package.json         # ❌ Duplicate file (removed)
```

## 🔄 Data Flow Architecture

### **1. User Interaction Flow**
```
User Input → ChatForm → App.jsx → chatService.js → Backend API
     ▲                                                    │
     └─── ChatMessage ◄─── App.jsx ◄─── Response ◄───────┘
```

### **2. Backend Processing Flow**
```
API Request → Validation → Controller → Services → Azure AI → Response
     │                                      │
     ▼                                      ▼
Session Storage                    Conversation Memory
(Express Sessions)                    (50 turns)
```

### **3. AI Service Integration**
```
User Query → RAG Pipeline → System Prompt → GPT-4 → Formatted Response
     │             │             │           │            │
     ▼             ▼             ▼           ▼            ▼
Azure Search   Training Docs   DigiStro    OpenAI      Markdown
   Index        Context        Expertise   API         Format
```

## 🧠 AI Architecture Details

### **System Prompt Engineering**
**Location:** `/backend/src/services/conversationService.js` (Line 83)

The system prompt defines:
- **Role**: DigiRestro SCM Expert trainer
- **Mission**: Train staff on supply chain processes
- **Training Areas**: PO, TO, GR, Stock Adjustments
- **Teaching Style**: Step-by-step, real-world focused
- **Response Format**: Markdown with clear structure

### **RAG Pipeline Components**
1. **Azure Cognitive Search**: Indexes training documents
2. **Semantic Retrieval**: Finds relevant context for queries
3. **Context Injection**: Adds training materials to system prompt
4. **GPT-4 Processing**: Generates contextually aware responses

### **Memory Management**
- **Session Storage**: Express sessions for user state
- **Conversation History**: 50-turn memory (100 messages)
- **Context Window**: Last 20 messages for API efficiency
- **Token Management**: Prevents context overflow

## 🛠️ Key Technologies

### **Frontend Stack**
- **React 18**: Modern UI framework
- **Vite**: Fast build tool and dev server
- **Marked**: Markdown parsing for rich text display
- **CSS3**: Custom styling with Markdown support

### **Backend Stack**
- **Node.js**: JavaScript runtime
- **Express**: Web framework with session management
- **Zod**: Runtime validation (Pydantic-like for JS)
- **ESM Modules**: Modern JavaScript imports

### **AI Services**
- **Azure OpenAI**: GPT-4 for conversation
- **Azure Cognitive Search**: RAG document retrieval
- **REST APIs**: Service integration

## 🔧 Configuration & Environment

### **Development Ports**
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`

### **Environment Variables** (`.env`)
```env
AZURE_OPENAI_ENDPOINT=your-endpoint
AZURE_OPENAI_API_KEY=your-key
AZURE_OPENAI_DEPLOYMENT_NAME=your-deployment
AZURE_SEARCH_ENDPOINT=your-search-endpoint
AZURE_SEARCH_API_KEY=your-search-key
AZURE_SEARCH_INDEX_NAME=your-index
SESSION_SECRET=your-session-secret
```

## 🚀 API Endpoints

### **Chat Endpoints**
| Method | Endpoint | Description | Validation |
|--------|----------|-------------|------------|
| POST | `/api/chat` | Send message to AI | MessageSchema |
| GET | `/api/chat/status` | Get conversation status | None |
| POST | `/api/chat/reset` | Reset conversation | None |
| GET | `/` | Health check | None |

### **Request/Response Schemas**
```javascript
// Input Validation (Zod Schemas)
MessageSchema: { message: string, context?: string }
ChatHistoryItemSchema: { role, content, timestamp }

// Response Types
ChatResponseSchema: { response, conversationTurn, timestamp }
ConversationStatusSchema: { conversationTurn, maxTurns, hasHistory, ... }
```

## 🎯 System Prompt Customization Guide

To modify the chatbot's behavior, edit the `buildSystemPrompt()` method in:
`/backend/src/services/conversationService.js`

### **Key Sections to Customize:**
1. **Role Definition**: Line 84-85 (AI persona)
2. **Training Areas**: Lines 90-93 (Focus topics)
3. **Teaching Approach**: Lines 95-101 (Methodology)
4. **Response Format**: Lines 103-108 (Markdown guidelines)
5. **Guidelines**: Lines 110-118 (Conversation rules)

### **Example Customization:**
```javascript
// To add new training area:
**KEY TRAINING AREAS:**
1. **Purchase Orders (PO)** - Creating, managing, and tracking supplier orders
2. **Transfer Orders (TO)** - Moving inventory between locations/warehouses
3. **Goods Receipt (GR)** - Receiving and verifying incoming inventory
4. **Stock Adjustments** - Managing inventory discrepancies and corrections
5. **NEW AREA** - Your new training focus
```

## 🔍 Troubleshooting Guide

### **Common Issues & Solutions**

1. **"Cannot GET /" Error**
   - **Cause**: Missing root route
   - **Solution**: Added in `/backend/server.js` ✅

2. **Azure Search Semantic Error**
   - **Cause**: Invalid semantic configuration
   - **Solution**: Changed to 'simple' search in `azureSearchService.js` ✅

3. **Duplicate "Thinking..." Messages**
   - **Cause**: Redundant state updates
   - **Solution**: Cleaned up `ChatForm.jsx` ✅

4. **Markdown Not Rendering**
   - **Cause**: Missing markdown parser
   - **Solution**: Added 'marked' package and CSS styles ✅

### **Development Workflow**
1. Start backend: `cd backend && npm run dev`
2. Start frontend: `npm run dev`
3. Access: `http://localhost:5173`
4. Edit system prompt: `/backend/src/services/conversationService.js`
5. Test changes: Refresh browser

## 📊 Performance Considerations

- **Memory Management**: 50-turn conversation limit
- **Token Optimization**: 20-message context window
- **Session Storage**: Express sessions for scalability
- **Error Handling**: Comprehensive validation and error responses
- **Markdown Caching**: Efficient parsing with 'marked' library

## 🔮 Future Enhancements

1. **Advanced RAG**: Vector embeddings for better context retrieval
2. **Multi-language**: Support for different languages
3. **Analytics**: Training completion tracking
4. **Offline Mode**: PWA capabilities for offline access
5. **Voice Input**: Speech-to-text integration
6. **Mobile App**: React Native version

---

## 🎯 Quick Reference

**Need to modify the AI's behavior?**
➡️ Edit: `/backend/src/services/conversationService.js` (Line 83)

**Need to change the UI?**
➡️ Edit: `/src/components/ChatMessage.jsx` or `/src/components/ChatForm.jsx`

**Need to adjust styling?**
➡️ Edit: `/src/index.css`

**Need to modify API behavior?**
➡️ Edit: `/backend/src/controllers/chatController.js`

This architecture ensures scalability, maintainability, and production-readiness for the DigiRestro SCM Training Chatbot.
