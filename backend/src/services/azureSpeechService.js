import * as speechSdk from 'microsoft-cognitiveservices-speech-sdk';
import { azureConfig } from '../config/azure.js';
import { logger } from '../utils/logger.js';

class AzureSpeechService {
  constructor() {
    try {
      console.log('Azure Speech Service initialization started...');
      console.log('Environment check:', {
        NODE_ENV: process.env.NODE_ENV,
        hasKey: !!azureConfig.speech.key,
        hasRegion: !!azureConfig.speech.region,
        keyLength: azureConfig.speech.key?.length || 0,
        region: azureConfig.speech.region
      });
      
      if (!azureConfig.speech.key || !azureConfig.speech.region) {
        throw new Error(`Azure Speech Service configuration missing - Key: ${!!azureConfig.speech.key}, Region: ${!!azureConfig.speech.region}`);
      }
      
      this.speechConfig = speechSdk.SpeechConfig.fromSubscription(
        azureConfig.speech.key,
        azureConfig.speech.region
      );
      
      // Set default speech synthesis voice to a more polite/professional voice
      // Lisa (en-US-AriaNeural) is known for being warm and professional
      // Alternative: en-US-SaraNeural for a gentle, friendly tone
      this.speechConfig.speechSynthesisVoiceName = "en-US-AriaNeural";
      this.speechConfig.speechRecognitionLanguage = "en-US";
      
      this.isConfigured = true;
      logger.info('Azure Speech Service initialized successfully');
      console.log('Azure Speech Service initialization completed successfully');
    } catch (error) {
      this.isConfigured = false;
      logger.error('Failed to initialize Azure Speech Service:', error.message);
      console.error('Speech service initialization failed:', {
        error: error.message,
        stack: error.stack,
        hasKey: !!azureConfig.speech.key,
        hasRegion: !!azureConfig.speech.region,
        keyPreview: azureConfig.speech.key ? azureConfig.speech.key.substring(0, 8) + '...' : 'none',
        region: azureConfig.speech.region || 'none'
      });
    }
  }

  checkConfiguration() {
    if (!this.isConfigured) {
      throw new Error('Azure Speech Service is not properly configured. Please check your environment variables.');
    }
  }

  /**
   * Convert text to speech and return audio buffer
   * @param {string} text - Text to convert to speech
   * @returns {Promise<Buffer>} Audio buffer
   */
  async textToSpeech(text) {
    try {
      console.log('TTS request started:', { 
        textLength: text.length, 
        isConfigured: this.isConfigured,
        timestamp: new Date().toISOString()
      });
      
      this.checkConfiguration();
      
      logger.info('TTS request:', { textLength: text.length });
      
      // Clean text for better speech synthesis
      const cleanedText = this.cleanTextForSpeech(text);
      console.log('Text cleaned for TTS:', { 
        originalLength: text.length, 
        cleanedLength: cleanedText.length 
      });
      
      // For short text (under 800 chars), use direct synthesis
      if (cleanedText.length <= 800) {
        console.log('Using direct synthesis for short text');
        logger.info('Using direct synthesis');
        return await this.synthesizeChunk(cleanedText);
      }
      
      // For long text, split into chunks and concatenate
      console.log('Using chunked synthesis for long text');
      logger.info('Using chunked synthesis');
      const chunks = this.splitTextIntoChunks(cleanedText, 600);
      logger.info('Split into chunks:', { count: chunks.length });
      console.log('Text split into chunks:', { count: chunks.length });
      
      if (chunks.length === 1) {
        return await this.synthesizeChunk(chunks[0]);
      }
      
      // Synthesize all chunks
      const audioBuffers = [];
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        
        try {
          const audioBuffer = await this.synthesizeChunk(chunk);
          audioBuffers.push(audioBuffer);
          logger.info(`Chunk ${i + 1}/${chunks.length} synthesized`);
        } catch (error) {
          logger.error(`Failed to synthesize chunk ${i + 1}:`, error);
          throw new Error(`Failed to synthesize text chunk ${i + 1}: ${error.message}`);
        }
      }
      
      // Simple WAV concatenation
      const concatenatedAudio = this.simpleWavConcatenation(audioBuffers);
      logger.info('TTS completed:', { 
        chunks: audioBuffers.length,
        finalSize: Math.round(concatenatedAudio.length / 1024) + 'KB' 
      });
      
      return concatenatedAudio;
      
    } catch (error) {
      logger.error('Error in textToSpeech:', error);
      throw error;
    }
  }

  /**
   * Simple WAV concatenation by combining audio data portions
   * @param {Array<Buffer>} audioBuffers - Array of WAV audio buffers
   * @returns {Buffer} Concatenated WAV buffer
   */
  simpleWavConcatenation(audioBuffers) {
    if (audioBuffers.length === 0) {
      throw new Error('No audio buffers to concatenate');
    }
    
    if (audioBuffers.length === 1) {
      return audioBuffers[0];
    }
    
    // Take the header from the first WAV file (first 44 bytes)
    const firstBuffer = audioBuffers[0];
    const wavHeader = firstBuffer.slice(0, 44);
    
    // Extract audio data from all buffers (skip 44-byte header)
    const audioDataBuffers = audioBuffers.map(buffer => buffer.slice(44));
    
    // Concatenate all audio data
    const totalAudioSize = audioDataBuffers.reduce((sum, buf) => sum + buf.length, 0);
    const combinedAudioData = Buffer.concat(audioDataBuffers);
    
    // Update the WAV header with new file size
    const newFileSize = 44 + totalAudioSize - 8; // Total file size minus 8 bytes
    wavHeader.writeUInt32LE(newFileSize, 4); // ChunkSize
    wavHeader.writeUInt32LE(totalAudioSize, 40); // Subchunk2Size
    
    // Combine header with audio data
    const finalBuffer = Buffer.concat([wavHeader, combinedAudioData]);
    
    logger.info('WAV concatenation completed:', {
      chunks: audioBuffers.length,
      finalSize: Math.round(finalBuffer.length / 1024) + 'KB'
    });
    
    return finalBuffer;
  }

  /**
   * Convert speech audio buffer to text
   * @param {Buffer} wavBuffer - WAV audio buffer (16kHz, 16-bit, mono PCM)
   * @returns {Promise<string>} Recognized text
   */
  async speechToText(wavBuffer) {
    try {
      logger.info('STT request:', { 
        bufferSize: Math.round(wavBuffer.length / 1024) + 'KB'
      });
      
      // Create audio input stream with WAV format specification
      const audioFormat = speechSdk.AudioStreamFormat.getWaveFormatPCM(16000, 16, 1);
      const pushStream = speechSdk.AudioInputStream.createPushStream(audioFormat);
      
      // Write the WAV buffer to the stream
      pushStream.write(wavBuffer);
      pushStream.close();
      
      const audioConfig = speechSdk.AudioConfig.fromStreamInput(pushStream);
      
      // Create speech config
      const speechConfig = speechSdk.SpeechConfig.fromSubscription(
        azureConfig.speech.key,
        azureConfig.speech.region
      );
      speechConfig.speechRecognitionLanguage = "en-US";
      
      const recognizer = new speechSdk.SpeechRecognizer(speechConfig, audioConfig);
      
      return new Promise((resolve, reject) => {
        recognizer.recognizeOnceAsync(
          (result) => {
            
            if (result.reason === speechSdk.ResultReason.RecognizedSpeech) {
              logger.info('STT completed:', { text: result.text });
              recognizer.close();
              resolve(result.text);
            } else if (result.reason === speechSdk.ResultReason.NoMatch) {
              logger.warn('No speech recognized');
              recognizer.close();
              resolve(''); // Return empty string for no match
            } else {
              logger.error('STT failed:', { reason: result.reason });
              recognizer.close();
              reject(new Error(`Speech recognition failed: ${result.errorDetails || 'Unknown error'}`));
            }
          },
          (error) => {
            logger.error('Speech recognition error:', error);
            recognizer.close();
            reject(error);
          }
        );
      });
    } catch (error) {
      logger.error('Error in speechToText:', error);
      throw error;
    }
  }

  /**
   * Alternative speech to text method with better audio handling
   * @param {Buffer} audioBuffer - Audio buffer to convert
   * @returns {Promise<string>} Recognized text
   */
  async speechToTextWithRetry(audioBuffer) {
    try {
      // First attempt with default configuration
      logger.info('Attempting speech recognition (attempt 1):', { bufferSize: audioBuffer.length });
      
      // Try with default audio input format
      const pushStream1 = speechSdk.AudioInputStream.createPushStream();
      pushStream1.write(audioBuffer);
      pushStream1.close();
      
      const audioConfig1 = speechSdk.AudioConfig.fromStreamInput(pushStream1);
      const speechConfig1 = speechSdk.SpeechConfig.fromSubscription(
        azureConfig.speech.key,
        azureConfig.speech.region
      );
      speechConfig1.speechRecognitionLanguage = "en-US";
      
      const recognizer1 = new speechSdk.SpeechRecognizer(speechConfig1, audioConfig1);
      
      const result1 = await new Promise((resolve, reject) => {
        recognizer1.recognizeOnceAsync(resolve, reject);
      });
      
      recognizer1.close();
      
      if (result1.reason === speechSdk.ResultReason.RecognizedSpeech && result1.text.trim()) {
        logger.info('Speech recognition successful on first attempt:', { text: result1.text });
        return result1.text;
      }
      
      // Second attempt with different audio format
      logger.info('First attempt failed, trying with WAV format specification...');
      
      const audioFormat = speechSdk.AudioStreamFormat.getWaveFormatPCM(16000, 16, 1);
      const pushStream2 = speechSdk.AudioInputStream.createPushStream(audioFormat);
      pushStream2.write(audioBuffer);
      pushStream2.close();
      
      const audioConfig2 = speechSdk.AudioConfig.fromStreamInput(pushStream2);
      const speechConfig2 = speechSdk.SpeechConfig.fromSubscription(
        azureConfig.speech.key,
        azureConfig.speech.region
      );
      speechConfig2.speechRecognitionLanguage = "en-US";
      speechConfig2.enableDictation();
      
      const recognizer2 = new speechSdk.SpeechRecognizer(speechConfig2, audioConfig2);
      
      const result2 = await new Promise((resolve, reject) => {
        recognizer2.recognizeOnceAsync(resolve, reject);
      });
      
      recognizer2.close();
      
      if (result2.reason === speechSdk.ResultReason.RecognizedSpeech) {
        logger.info('Speech recognition successful on second attempt:', { text: result2.text });
        return result2.text;
      } else {
        logger.warn('Speech recognition failed on both attempts:', {
          reason1: result1.reason,
          reason2: result2.reason,
          details1: result1.errorDetails,
          details2: result2.errorDetails
        });
        return '';
      }
      
    } catch (error) {
      logger.error('Error in speechToTextWithRetry:', error);
      throw error;
    }
  }
  async getAvailableVoices() {
    try {
      this.checkConfiguration();
      
      const synthesizer = new speechSdk.SpeechSynthesizer(this.speechConfig);
      
      return new Promise((resolve, reject) => {
        synthesizer.getVoicesAsync(
          (result) => {
            if (result.reason === speechSdk.ResultReason.VoicesListRetrieved) {
              const voices = result.voices.map(voice => ({
                name: voice.name || '',
                displayName: voice.localName || voice.name || '',
                locale: voice.locale || '',
                gender: voice.gender || 'Unknown'
              })).filter(voice => voice.locale); // Only include voices with valid locale
              
              logger.info('Retrieved voices:', { count: voices.length });
              synthesizer.close();
              resolve(voices);
            } else {
              synthesizer.close();
              reject(new Error('Failed to retrieve voices'));
            }
          },
          (error) => {
            synthesizer.close();
            reject(error);
          }
        );
      });
    } catch (error) {
      logger.error('Error getting available voices:', error);
      throw error;
    }
  }

  /**
   * Split text into smaller chunks for TTS processing
   * @param {string} text - Text to split
   * @param {number} maxChunkLength - Maximum characters per chunk
   * @returns {Array<string>} Array of text chunks
   */
  splitTextIntoChunks(text, maxChunkLength = 600) {
    // Clean the text first
    const cleanedText = this.cleanTextForSpeech(text);
    
    // For very short text, return as single chunk
    if (cleanedText.length <= maxChunkLength) {
      return [cleanedText];
    }
    
    // Split by sentences first
    const sentences = cleanedText.match(/[^\.!\?]+[\.!\?]+/g) || [cleanedText];
    const chunks = [];
    let currentChunk = "";

    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();
      
      // If adding this sentence would exceed the limit and we have content, start a new chunk
      if ((currentChunk + ' ' + trimmedSentence).length > maxChunkLength && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = trimmedSentence;
      } else {
        currentChunk += (currentChunk ? ' ' : '') + trimmedSentence;
      }
    }
    
    // Add the last chunk if it has content
    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim());
    }
    
    // If no proper chunks were created, force split by character limit
    if (chunks.length === 0 && cleanedText.length > 0) {
      for (let i = 0; i < cleanedText.length; i += maxChunkLength) {
        const chunk = cleanedText.substring(i, i + maxChunkLength);
        if (chunk.trim().length > 0) {
          chunks.push(chunk.trim());
        }
      }
    }
    
    return chunks.filter(chunk => chunk.length > 0);
  }

  /**
   * Synthesize a single text chunk to audio
   * @param {string} text - Text chunk to synthesize
   * @returns {Promise<Buffer>} Audio buffer
   */
  async synthesizeChunk(text) {
    return new Promise((resolve, reject) => {
      console.log('Starting synthesizeChunk:', {
        textLength: text.length,
        textPreview: text.substring(0, 100),
        hasConfig: !!this.speechConfig,
        timestamp: new Date().toISOString()
      });
      
      let synthesizer;
      try {
        synthesizer = new speechSdk.SpeechSynthesizer(this.speechConfig);
        console.log('Speech synthesizer created successfully');
      } catch (error) {
        console.error('Failed to create speech synthesizer:', error);
        reject(new Error(`Failed to create speech synthesizer: ${error.message}`));
        return;
      }
      
      // Set a timeout for individual chunk synthesis
      const timeout = setTimeout(() => {
        console.log('Speech synthesis timeout reached for chunk');
        synthesizer.close();
        reject(new Error(`Speech synthesis timeout for chunk: ${text.substring(0, 50)}...`));
      }, 15000); // 15 second timeout per chunk
      
      synthesizer.speakTextAsync(
        text,
        (result) => {
          clearTimeout(timeout);
          console.log('Speech synthesis result received:', {
            reason: result.reason,
            hasAudioData: !!result.audioData,
            audioSize: result.audioData ? result.audioData.byteLength : 0
          });
          
          if (result.reason === speechSdk.ResultReason.SynthesizingAudioCompleted) {
            const audioData = Buffer.from(result.audioData);
            console.log('Speech synthesis successful:', {
              bufferSize: audioData.length,
              timestamp: new Date().toISOString()
            });
            synthesizer.close();
            resolve(audioData);
          } else {
            console.error('Speech synthesis failed:', {
              reason: result.reason,
              errorDetails: result.errorDetails,
              textLength: text.length,
              textPreview: text.substring(0, 100)
            });
            logger.error('Speech synthesis failed for chunk:', {
              reason: result.reason,
              errorDetails: result.errorDetails,
              textLength: text.length,
              textPreview: text.substring(0, 100)
            });
            synthesizer.close();
            reject(new Error(`Speech synthesis failed: ${result.errorDetails}`));
          }
        },
        (error) => {
          clearTimeout(timeout);
          console.error('Speech synthesis error callback:', {
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
          });
          logger.error('Speech synthesis error for chunk:', error);
          synthesizer.close();
          reject(error);
        }
      );
    });
  }

  /**
   * Clean text for better speech synthesis
   * @param {string} text - Text to clean
   * @returns {string} Cleaned text
   */
  cleanTextForSpeech(text) {
    return text
      // Remove markdown formatting
      .replace(/\*\*(.*?)\*\*/g, '$1') // Bold
      .replace(/\*(.*?)\*/g, '$1') // Italic
      .replace(/`(.*?)`/g, '$1') // Inline code
      .replace(/#{1,6}\s*(.*?)(\n|$)/g, '$1. ') // Headers
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links
      .replace(/^\s*[-*+]\s+/gm, '') // List bullets
      .replace(/^\s*\d+\.\s+/gm, '') // Numbered lists
      // Remove emojis and special characters
      .replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '')
      .replace(/[\u{1F900}-\u{1F9FF}]|[\u{1FA70}-\u{1FAFF}]/gu, '') // Additional emoji ranges
      // Remove bullet points and special symbols
      .replace(/[•◦▪▫]/g, '')
      .replace(/---/g, '')
      .replace(/\n{2,}/g, '. ') // Multiple newlines
      .replace(/\n/g, ' ') // Single newlines
      .replace(/\s+/g, ' ') // Multiple spaces to single space
      .trim();
  }
}

export const azureSpeechService = new AzureSpeechService();
