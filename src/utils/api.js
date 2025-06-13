// API utility functions for frontend-backend communication

const API_BASE_URL = import.meta.env.MODE === 'production' 
  ? 'https://mypay-staff-chatbot-a2ape5hwcmfxgvfg.eastus2-01.azurewebsites.net/api' 
  : 'http://localhost:8080/api';
console.log('🔄 API: Using base URL:', API_BASE_URL);

// Send message to chat API
export const sendMessage = async (message) => {
  try {
    console.log('🔄 API: Sending message to backend:', message);
    
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ message })
    });

    console.log('🔄 API: Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🔄 API: Error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data = await response.json();
    console.log('🔄 API: Response data:', data);
    return data;
  } catch (error) {
    console.error('🔄 API: Request failed:', error);
    throw error;
  }
};

// Reset conversation
export const resetConversation = async () => {
  try {
    console.log('🔄 API: Resetting conversation');
    
    const response = await fetch(`${API_BASE_URL}/reset-conversation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('🔄 API: Conversation reset:', data);
    return data;
  } catch (error) {
    console.error('🔄 API: Reset failed:', error);
    throw error;
  }
};

// Check health
export const healthCheck = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('🔄 API: Health check failed:', error);
    throw error;
  }
};
