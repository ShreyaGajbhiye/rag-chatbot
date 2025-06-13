/**
 * Logging configuration for conversation monitoring
 * Set environment variables to control logging levels
 */

// Logging levels
export const LOG_LEVELS = {
  ERROR: 0,    // Always logged
  WARN: 1,     // Warnings and errors
  INFO: 2,     // General information
  DEBUG: 3,    // Detailed debugging
  VERBOSE: 4   // Everything including request details
};

// Current log level (can be set via environment variable)
const currentLogLevel = parseInt(process.env.LOG_LEVEL) || LOG_LEVELS.INFO;

// Logging functions with level control
export const logger = {
  error: (message, ...args) => {
    if (currentLogLevel >= LOG_LEVELS.ERROR) {
      console.error(`❌ ${new Date().toISOString()} ERROR:`, message, ...args);
    }
  },
  
  warn: (message, ...args) => {
    if (currentLogLevel >= LOG_LEVELS.WARN) {
      console.warn(`⚠️  ${new Date().toISOString()} WARN:`, message, ...args);
    }
  },
  
  info: (message, ...args) => {
    if (currentLogLevel >= LOG_LEVELS.INFO) {
      console.log(`ℹ️  ${new Date().toISOString()} INFO:`, message, ...args);
    }
  },
  
  debug: (message, ...args) => {
    if (currentLogLevel >= LOG_LEVELS.DEBUG) {
      console.log(`🐛 ${new Date().toISOString()} DEBUG:`, message, ...args);
    }
  },
  
  verbose: (message, ...args) => {
    if (currentLogLevel >= LOG_LEVELS.VERBOSE) {
      console.log(`🔍 ${new Date().toISOString()} VERBOSE:`, message, ...args);
    }
  },

  // Conversation specific loggers with emojis for easy identification
  conversation: {
    newSession: (sessionId) => {
      if (currentLogLevel >= LOG_LEVELS.INFO) {
        console.log(`🆕 ${new Date().toISOString()} New conversation started for session: ${sessionId}`);
      }
    },
    
    userMessage: (sessionId, message, turn, maxTurns) => {
      if (currentLogLevel >= LOG_LEVELS.INFO) {
        const preview = message.length > 100 ? message.substring(0, 100) + '...' : message;
        console.log(`💬 ${new Date().toISOString()} [${sessionId}] USER (${turn}/${maxTurns}): ${preview}`);
      }
    },
    
    assistantMessage: (sessionId, message, tokens) => {
      if (currentLogLevel >= LOG_LEVELS.INFO) {
        const preview = message.length > 100 ? message.substring(0, 100) + '...' : message;
        const tokenInfo = tokens ? ` (${tokens} tokens)` : '';
        console.log(`🤖 ${new Date().toISOString()} [${sessionId}] ASSISTANT${tokenInfo}: ${preview}`);
      }
    },
    
    searchResults: (sessionId, query, numResults) => {
      if (currentLogLevel >= LOG_LEVELS.DEBUG) {
        console.log(`🔍 ${new Date().toISOString()} [${sessionId}] Search: "${query}" → ${numResults} documents`);
      }
    },
    
    contextBuilding: (sessionId, historyCount, totalCount) => {
      if (currentLogLevel >= LOG_LEVELS.DEBUG) {
        console.log(`🔄 ${new Date().toISOString()} [${sessionId}] Context: ${historyCount} recent messages (${totalCount} total)`);
      }
    },
    
    request: (sessionId, method, path) => {
      if (currentLogLevel >= LOG_LEVELS.VERBOSE) {
        console.log(`📥 ${new Date().toISOString()} [${sessionId}] ${method} ${path}`);
      }
    }
  }
};

// Export current log level for external use
export const getLogLevel = () => currentLogLevel;
export const setLogLevel = (level) => {
  if (level >= LOG_LEVELS.ERROR && level <= LOG_LEVELS.VERBOSE) {
    process.env.LOG_LEVEL = level.toString();
    return true;
  }
  return false;
};
