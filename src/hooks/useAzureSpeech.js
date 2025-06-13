import { useState, useCallback, useRef } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL?.replace('/chat', '/speech') || 
  (import.meta.env.MODE === 'production' 
    ? 'https://mypay-staff-chatbot-a2ape5hwcmfxgvfg.eastus2-01.azurewebsites.net/api/speech'
    : 'http://localhost:8080/api/speech');

export const useSpeech = () => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const currentAudioRef = useRef(null);

  // Clean text for better speech synthesis by removing markdown
  const cleanTextForSpeech = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1') // Bold
      .replace(/\*(.*?)\*/g, '$1') // Italic  
      .replace(/`(.*?)`/g, '$1') // Inline code
      .replace(/#{1,6}\s*(.*?)(\n|$)/g, '$1. ') // Headers
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links
      .replace(/^\s*[-*+]\s+/gm, '') // List bullets
      .replace(/^\s*\d+\.\s+/gm, '') // Numbered lists
      .replace(/\n{2,}/g, '. ') // Multiple newlines to sentence breaks
      .replace(/\n/g, ' ') // Single newlines to spaces
      .trim();
  };

  // Text-to-Speech using Azure Speech Services
  const speakText = useCallback(async (text) => {
    try {
      console.log('🔊 TTS: Starting text-to-speech request for text:', text);
      console.log('🔊 TTS: API URL:', `${API_BASE_URL}/text-to-speech`);
      setIsSpeaking(true);
      setError(null);

      // Stop any currently playing audio
      if (currentAudioRef.current) {
        console.log('🔊 TTS: Stopping current audio');
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }

      // Check if we can play audio (autoplay policy detection)
      console.log('🔊 TTS: Starting autoplay detection test...');
      try {
        const testAudio = new Audio();
        console.log('🔊 TTS: Created test audio element');
        
        const canAutoplay = await Promise.race([
          testAudio.play().then(() => {
            console.log('🔊 TTS: Test audio play succeeded');
            testAudio.pause();
            return true;
          }).catch((playError) => {
            console.log('🔊 TTS: Test audio play failed:', playError);
            return false;
          }),
          new Promise(resolve => {
            setTimeout(() => {
              console.log('🔊 TTS: Autoplay test timed out');
              resolve(false);
            }, 1000);
          })
        ]);
        
        console.log('🔊 TTS: Autoplay test result:', canAutoplay);
        
        if (!canAutoplay) {
          console.log('🔊 TTS: Autoplay likely blocked, but continuing with synthesis...');
        }
      } catch (autoplayTestError) {
        console.log('🔊 TTS: Autoplay test failed:', autoplayTestError);
      }
      
      console.log('🔊 TTS: Autoplay detection completed, proceeding with TTS...');

      const cleanedText = cleanTextForSpeech(text);
      console.log('🔊 TTS: Text cleaned:', cleanedText);
      console.log('🔊 TTS: Making request to:', `${API_BASE_URL}/text-to-speech`);
      
      const requestBody = JSON.stringify({ text: cleanedText });
      console.log('🔊 TTS: Request body:', requestBody);
      
      console.log('🔊 TTS: About to call fetch...');
      let response;
      try {
        response = await fetch(`${API_BASE_URL}/text-to-speech`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: requestBody
        });
        console.log('🔊 TTS: Fetch completed successfully');
      } catch (fetchError) {
        console.error('🔊 TTS: Fetch failed with error:', fetchError);
        console.error('🔊 TTS: Fetch error details:', {
          name: fetchError.name,
          message: fetchError.message,
          stack: fetchError.stack
        });
        throw new Error(`Network request failed: ${fetchError.message}`);
      }

      console.log('🔊 TTS: Response received:', response.status, response.statusText);
      console.log('🔊 TTS: Response headers:', [...response.headers.entries()]);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔊 TTS: Response error:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const audioBlob = await response.blob();
      console.log('🔊 TTS: Audio blob received, size:', audioBlob.size, 'type:', audioBlob.type);
      
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      currentAudioRef.current = audio;

      audio.onended = () => {
        console.log('🔊 TTS: Audio playback ended');
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        currentAudioRef.current = null;
      };

      audio.onerror = (event) => {
        console.error('🔊 TTS: Audio playback error:', event);
        console.error('🔊 TTS: Audio error details:', {
          error: event.error,
          message: event.message,
          audioSrc: audio.src,
          readyState: audio.readyState,
          networkState: audio.networkState
        });
        setIsSpeaking(false);
        setError('Failed to play audio');
        URL.revokeObjectURL(audioUrl);
        currentAudioRef.current = null;
      };

      audio.oncanplaythrough = () => {
        console.log('🔊 TTS: Audio can play through');
      };

      audio.onloadeddata = () => {
        console.log('🔊 TTS: Audio data loaded');
      };

      console.log('🔊 TTS: Starting audio playback');
      console.log('🔊 TTS: Audio element details:', {
        src: audioUrl,
        readyState: audio.readyState,
        networkState: audio.networkState,
        duration: audio.duration,
        canPlayType: audio.canPlayType('audio/wav')
      });

      try {
        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
          await playPromise;
          console.log('🔊 TTS: Audio playback started successfully');
        } else {
          console.log('🔊 TTS: Audio play() returned undefined (older browser)');
        }
      } catch (playError) {
        console.error('🔊 TTS: Audio play() failed:', playError);
        console.error('🔊 TTS: Play error details:', {
          name: playError.name,
          message: playError.message,
          code: playError.code
        });
        
        // Check if it's an autoplay policy error
        if (playError.name === 'NotAllowedError') {
          setError('Audio autoplay blocked. Please interact with the page first.');
          console.log('🔊 TTS: Autoplay blocked - user interaction required');
        } else {
          setError(`Audio playback failed: ${playError.message}`);
        }
        
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        currentAudioRef.current = null;
        return;
      }
      
    } catch (err) {
      console.error('🔊 TTS: Text-to-speech error:', err);
      setError(err.message);
      setIsSpeaking(false);
    }
  }, []);

  // Speech-to-Text using Azure Speech Services with MediaRecorder
  const startListening = useCallback(async (onResult, onError) => {
    try {
      setIsListening(true);
      setError(null);
      chunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });

      // Try to use WAV format first for better Azure Speech compatibility
      let mimeType = 'audio/wav';
      let fileExtension = 'recording.wav';
      
      if (!MediaRecorder.isTypeSupported('audio/wav')) {
        // Fallback to WebM if WAV is not supported
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
          fileExtension = 'recording.webm';
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm';
          fileExtension = 'recording.webm';
        } else {
          // Final fallback
          mimeType = '';
          fileExtension = 'recording.webm';
        }
      }

      console.log('🎤 Recording with MIME type:', mimeType);

      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        try {
          const audioBlob = new Blob(chunksRef.current, { type: mimeType });
          console.log('🎤 Recording stopped. Audio blob size:', audioBlob.size, 'bytes');
          
          // Send audio as FormData for proper file upload
          const formData = new FormData();
          formData.append('audio', audioBlob, fileExtension);
          
          const response = await fetch(`${API_BASE_URL}/speech-to-text`, {
            method: 'POST',
            credentials: 'include',
            body: formData
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const result = await response.json();
          
          if (result.text && result.text.trim()) {
            console.log('✅ Speech recognition successful:', result.text);
            onResult?.(result.text);
          } else {
            console.log('⚠️ No speech detected');
            onError?.('No speech detected. Please try speaking louder and closer to the microphone.');
          }
          
        } catch (err) {
          console.error('❌ Speech-to-text error:', err);
          onError?.(err.message);
        } finally {
          // Clean up media stream
          stream.getTracks().forEach(track => track.stop());
          setIsListening(false);
        }
      };

      mediaRecorderRef.current.start();

      // Auto-stop after 10 seconds to prevent indefinite recording
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          stopListening();
        }
      }, 10000);

    } catch (err) {
      console.error('❌ Error starting speech recognition:', err);
      setError(err.message);
      setIsListening(false);
      onError?.(err.message);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
      setIsSpeaking(false);
    }
  }, []);

  // Check if browser supports required APIs
  const speechSupported = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

  // Test function for debugging
  const testTTS = useCallback(async () => {
    console.log('🔊 TTS TEST: Starting test');
    await speakText('This is a test of the text to speech system.');
  }, [speakText]);

  return {
    isListening,
    isSpeaking,
    speechSupported,
    error,
    startListening,
    stopListening,
    speakText,
    stopSpeaking,
    testTTS // Export test function
  };
};

export default useSpeech;
