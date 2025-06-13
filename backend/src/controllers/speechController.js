import { azureSpeechService } from '../services/azureSpeechService.js';
import { logger } from '../utils/logger.js';
import { convertToWav, detectAudioFormat } from '../utils/audioConverter.js';
import multer from 'multer';

// Configure multer for handling audio uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

export class SpeechController {
  /**
   * Convert text to speech audio
   */
  async textToSpeech(req, res) {
    try {
      console.log('TTS endpoint called:', {
        timestamp: new Date().toISOString(),
        hasBody: !!req.body,
        bodyKeys: Object.keys(req.body || {}),
        sessionId: req.sessionID
      });
      
      const { text } = req.body;
      
      if (!text || typeof text !== 'string') {
        console.log('TTS validation failed - missing or invalid text');
        return res.status(400).json({
          error: 'Text is required and must be a string'
        });
      }

      if (text.length > 5000) {
        console.log('TTS validation failed - text too long:', text.length);
        return res.status(400).json({
          error: 'Text is too long. Maximum 5000 characters allowed.'
        });
      }

      logger.info('TTS request:', { 
        textLength: text.length,
        sessionId: req.sessionID 
      });
      
      console.log('Starting TTS processing with Azure Speech Service...');

      // Set a timeout for the TTS request (60 seconds for large text)
      const timeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Text-to-speech request timed out')), 60000);
      });

      // Convert text to speech with timeout
      const audioBuffer = await Promise.race([
        azureSpeechService.textToSpeech(text),
        timeout
      ]);
      
      console.log('TTS processing completed:', {
        audioBufferSize: audioBuffer.length,
        timestamp: new Date().toISOString()
      });
      
      // Set response headers for audio
      res.set({
        'Content-Type': 'audio/wav',
        'Content-Length': audioBuffer.length,
        'Cache-Control': 'no-cache'
      });

      console.log('Sending TTS response:', {
        contentType: 'audio/wav',
        contentLength: audioBuffer.length,
        timestamp: new Date().toISOString()
      });
      
      res.send(audioBuffer);
      
    } catch (error) {
      console.error('TTS endpoint error:', {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      
      logger.error('Error in textToSpeech:', error);
      
      // Send appropriate error response
      if (error.message.includes('timeout')) {
        res.status(408).json({
          error: 'Request timeout - text processing took too long'
        });
      } else if (error.message.includes('configuration')) {
        res.status(503).json({
          error: 'Speech service is not available - configuration issue'
        });
      } else {
        res.status(500).json({
          error: 'Failed to convert text to speech',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
      }
    }
  }

  /**
   * Convert speech audio to text
   */
  async speechToText(req, res) {
    try {
      console.log('STT endpoint called:', {
        timestamp: new Date().toISOString(),
        hasFile: !!req.file,
        fileBuffer: !!req.file?.buffer,
        sessionId: req.sessionID
      });
      
      if (!req.file || !req.file.buffer) {
        console.log('STT validation failed - missing audio file');
        return res.status(400).json({
          error: 'Audio file is required'
        });
      }

      const audioBuffer = req.file.buffer;
      
      console.log('STT processing started:', {
        bufferSize: Math.round(audioBuffer.length / 1024) + 'KB',
        format: req.file.mimetype,
        originalname: req.file.originalname
      });
      
      logger.info('STT request:', { 
        bufferSize: Math.round(audioBuffer.length / 1024) + 'KB',
        format: req.file.mimetype,
        sessionId: req.sessionID 
      });

      // Detect audio format
      const detectedFormat = detectAudioFormat(audioBuffer);

      let processedAudioBuffer = audioBuffer;

      // Convert to WAV if not already in WAV format
      if (detectedFormat !== 'wav') {
        logger.info('Converting audio to WAV...');
        try {
          processedAudioBuffer = await convertToWav(audioBuffer, detectedFormat);
          logger.info('Audio conversion successful');
        } catch (conversionError) {
          logger.error('Audio conversion failed:', conversionError);
          return res.status(500).json({
            error: 'Failed to convert audio format',
            message: conversionError.message
          });
        }
      }

      // Convert speech to text using Azure Speech Services
      const recognizedText = await azureSpeechService.speechToText(processedAudioBuffer);
      
      res.json({
        text: recognizedText,
        success: true,
        audioFormat: detectedFormat,
        converted: detectedFormat !== 'wav'
      });
      
    } catch (error) {
      logger.error('Error in speechToText:', error);
      res.status(500).json({
        error: 'Failed to convert speech to text',
        message: error.message
      });
    }
  }

  /**
   * Get available voices for text-to-speech
   */
  async getVoices(req, res) {
    try {
      logger.info('Getting available voices');
      
      const voices = await azureSpeechService.getAvailableVoices();
      
      // Filter to show only English voices for simplicity
      const englishVoices = voices.filter(voice => 
        voice.locale && typeof voice.locale === 'string' && voice.locale.startsWith('en-')
      );
      
      res.json({
        voices: englishVoices,
        success: true
      });
      
    } catch (error) {
      logger.error('Error getting voices:', error);
      res.status(500).json({
        error: 'Failed to get available voices',
        message: error.message
      });
    }
  }
}

export const speechController = new SpeechController();
