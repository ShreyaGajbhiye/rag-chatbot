const BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.MODE === 'production' 
    ? 'https://mypay-staff-chatbot-a2ape5hwcmfxgvfg.eastus2-01.azurewebsites.net/api/chat'
    : 'http://localhost:8080/api/chat');

console.log('ChatService VITE_API_URL:', import.meta.env.VITE_API_URL);
console.log('ChatService MODE:', import.meta.env.MODE);
console.log('ChatService Effective BASE_URL:', BASE_URL); 

export const sendMessage = async (message) => {
  try {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include session cookies
      body: JSON.stringify({ message }),
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('Server response:', errorData);
      throw new Error(`Server error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Chat service error:', error);
    throw error;
  }
};
