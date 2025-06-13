import { useRef, useState } from 'react';
import { useSpeech } from '../hooks/useAzureSpeech';

const ChatForm = ({ chatHistory, setChatHistory, generateBotResponse }) => {
  const inputRef = useRef();
  const [isRecording, setIsRecording] = useState(false);
  const { isListening, speechSupported, startListening, stopListening } = useSpeech();

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const userMessage = inputRef.current.value.trim();
    if (!userMessage) return;
    inputRef.current.value = "";

    // Update the chat history with the user's message
    setChatHistory((history) => [...history, { role: "user", text: userMessage }]);
    
    // Delay 600ms before generating response (no duplicate "Thinking..." message)
    setTimeout(() => {
      // Call the function to generate the bot's response
      generateBotResponse([...chatHistory, { role: "user", text: userMessage }]);
    }, 600);
  };

  const handleSpeechToText = () => {
    if (isListening) {
      stopListening();
      setIsRecording(false);
      return;
    }

    setIsRecording(true);
    startListening(
      (transcript) => {
        inputRef.current.value = transcript;
        setIsRecording(false);
      },
      (error) => {
        console.error('Speech recognition error:', error);
        setIsRecording(false);
        alert('Speech recognition failed: ' + error);
      }
    );
  };

  return (
    <form action="#" className="chat-form" onSubmit={handleFormSubmit}>
      <input 
        ref={inputRef} 
        placeholder={isRecording ? "Listening..." : "Message..."} 
        className="message-input" 
        required 
        disabled={isRecording}
      />
      
      {speechSupported && (
        <button 
          type="button"
          onClick={handleSpeechToText}
          className={`material-symbols-rounded mic-button ${isRecording ? 'recording' : ''}`}
          title={isRecording ? "Stop recording" : "Click to speak"}
          style={{
            display: 'block',
            marginRight: '6px',
            background: isRecording ? '#ef4444' : '#6D4FC2',
            animation: isRecording ? 'pulse 1.5s infinite' : 'none'
          }}
        >
          {isRecording ? 'stop' : 'mic'}
        </button>
      )}
      
      <button className="material-symbols-rounded">arrow_upward</button>
    </form>
  );
};

export default ChatForm;
