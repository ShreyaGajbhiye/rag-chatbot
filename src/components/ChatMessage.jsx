import { marked } from 'marked';
import ChatbotIcon from "./ChatbotIcon";
import { useSpeech } from '../hooks/useAzureSpeech';

const ChatMessage = ({chat}) => {
  const { speakText, isSpeaking, stopSpeaking, error } = useSpeech();

  // Debug logging
  console.log('🔊 ChatMessage: Rendering message for role:', chat.role, 'isSpeaking:', isSpeaking, 'error:', error);

  // Configure marked options for better security and formatting
  marked.setOptions({
    breaks: true, // Convert line breaks to <br>
    gfm: true,    // GitHub flavored markdown
  });

  const renderMessage = () => {
    if (chat.loading) {
      return 'Thinking...';
    }
    
    // Only parse markdown for bot messages to preserve user input as-is
    if (chat.role === "model") {
      return { __html: marked(chat.text) };
    }
    
    return chat.text;
  };

  const handleTextToSpeech = async () => {
    console.log('🔊 Speaker button clicked!', {
      currentState: {
        isSpeaking,
        error,
        textLength: chat.text?.length || 0,
        messageRole: chat.role
      },
      timestamp: new Date().toISOString()
    });

    if (isSpeaking) {
      console.log('🔊 Stopping current speech...');
      stopSpeaking();
      return;
    }

    try {
      console.log('🔊 ChatMessage: Initiating TTS for text:', {
        textPreview: chat.text.substring(0, 100) + '...',
        fullLength: chat.text.length,
        messageRole: chat.role,
        timestamp: new Date().toISOString()
      });
      
      console.log('🔊 Calling speakText function...');
      await speakText(chat.text);
      console.log('🔊 speakText completed successfully');
    } catch (error) {
      console.error('🔊 ChatMessage: Text-to-speech failed:', {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      
      // Show user-friendly error message
      if (error.message.includes('autoplay') || error.message.includes('NotAllowedError')) {
        alert('Audio playback was blocked by your browser. Please click the speak button again to enable audio.');
      } else {
        alert(`Text-to-speech failed: ${error.message}`);
      }
    }
  };

  return (
    <div className={`message ${chat.role === "model" ? 'bot' : 'user'}-message ${chat.isError ? 'error' : ""} ${chat.loading ? 'loading' : ''}`}>
        {chat.role === "model" &&  <ChatbotIcon /> }
        {chat.role === "model" && !chat.loading ? (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', width: '100%' }}>
            <div 
              className="message-text markdown-content" 
              dangerouslySetInnerHTML={renderMessage()}
            />
            {/* Text-to-speech button for bot messages */}
            <button 
              onClick={() => {
                console.log('🔊 SPEAKER BUTTON CLICKED - Starting TTS flow...', {
                  messageText: chat.text?.substring(0, 50) + '...',
                  textLength: chat.text?.length || 0,
                  currentSpeakingState: isSpeaking,
                  currentError: error,
                  timestamp: new Date().toISOString(),
                  speechSynthesisSupported: 'speechSynthesis' in window,
                  windowLocation: window.location.href
                });
                handleTextToSpeech();
              }}
              className={`speak-button ${isSpeaking ? 'playing' : ''} ${error ? 'error' : ''}`}
              title={
                error ? `Error: ${error}` :
                isSpeaking ? "Stop speaking" : "Read aloud"
              }
            >
              <span className="material-symbols-rounded">
                {error ? 'volume_mute' : 
                 isSpeaking ? 'volume_off' : 'volume_up'}
              </span>
            </button>
          </div>
        ) : (
          <p className="message-text">
            {renderMessage()}
          </p>
        )}
    </div>
  );
};

export default ChatMessage;
