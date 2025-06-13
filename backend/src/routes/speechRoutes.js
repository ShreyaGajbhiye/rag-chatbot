import express from 'express';
import multer from 'multer';
import { speechController } from '../controllers/speechController.js';

const router = express.Router();

// Configure multer for handling audio uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

/**
 * POST /api/speech/text-to-speech
 * Convert text to speech audio
 */
router.post('/text-to-speech', speechController.textToSpeech);

/**
 * POST /api/speech/speech-to-text
 * Convert speech audio to text
 */
router.post('/speech-to-text', upload.single('audio'), speechController.speechToText);

/**
 * GET /api/speech/voices
 * Get available text-to-speech voices
 */
router.get('/voices', speechController.getVoices);

/**
 * GET /api/speech/test
 * Simple test endpoint to verify speech routes are working
 */
router.get('/test', (req, res) => {
  console.log('Speech test endpoint hit!');
  res.json({ message: 'Speech routes are working!', timestamp: new Date().toISOString() });
});

/**
 * POST /api/speech/test-post
 * Simple POST test endpoint to verify POST requests work
 */
router.post('/test-post', (req, res) => {
  console.log('Speech POST test endpoint hit!', req.body);
  res.json({ 
    message: 'Speech POST routes are working!', 
    receivedBody: req.body,
    timestamp: new Date().toISOString() 
  });
});

export default router;
