import { configDotenv } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Only load .env file in development (Azure App Service provides env vars directly)
if (process.env.NODE_ENV !== 'production') {
  configDotenv({ path: path.resolve(__dirname, '../../../.env') });
}

// Validate environment variables
const requiredEnvVars = {
  AZURE_API_KEY: process.env.AZURE_API_KEY,
  ENDPOINT_URL: process.env.ENDPOINT_URL,
  DEPLOYMENT_NAME: process.env.DEPLOYMENT_NAME,
  AZURE_COGNITIVE_SERVICES_RESOURCE: process.env.AZURE_COGNITIVE_SERVICES_RESOURCE,
  AZURE_AI_SEARCH_ENDPOINT: process.env.AZURE_AI_SEARCH_ENDPOINT,
  AZURE_AI_SEARCH_INDEX: process.env.AZURE_AI_SEARCH_INDEX,
  AZURE_AI_SEARCH_KEY: process.env.AZURE_AI_SEARCH_KEY,
  AZURE_SPEECH_KEY: process.env.AZURE_SPEECH_KEY,
  AZURE_SPEECH_REGION: process.env.AZURE_SPEECH_REGION
};

// Check for missing environment variables
const missingVars = Object.entries(requiredEnvVars)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  console.error('Missing required environment variables:', missingVars);
  console.log('Available environment variables:', Object.keys(process.env).filter(key => key.startsWith('AZURE_')));
  // Don't exit in production, just log the error - let the app start and show proper error messages
  if (process.env.NODE_ENV !== 'production') {
    console.warn('Some services may not work properly due to missing environment variables');
  }
}

export const azureConfig = {
  openai: {
    apiKey: process.env.AZURE_API_KEY,
    endpoint: process.env.ENDPOINT_URL,
    deployment: process.env.DEPLOYMENT_NAME,
    apiVersion: '2024-06-01'
  },
  search: {
    endpoint: process.env.AZURE_AI_SEARCH_ENDPOINT,
    index: process.env.AZURE_AI_SEARCH_INDEX,
    key: process.env.AZURE_AI_SEARCH_KEY
  },
  speech: {
    key: process.env.AZURE_SPEECH_KEY,
    region: process.env.AZURE_SPEECH_REGION,
    endpoint: process.env.AZURE_SPEECH_ENDPOINT
  },
  session: {
    secret: process.env.SESSION_SECRET || 'maypay-chatbot-secret-key'
  }
};
