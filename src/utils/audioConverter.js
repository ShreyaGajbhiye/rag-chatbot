import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import stream from 'stream';
import { logger } from './logger.js';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Check if FFmpeg is available
console.log('FFmpeg initialization:', {
  ffmpegStaticPath: ffmpegPath,
  environment: process.env.NODE_ENV,
  platform: process.platform
});

// Set the ffmpeg binary path
try {
  if (ffmpegPath) {
    ffmpeg.setFfmpegPath(ffmpegPath);
    console.log('FFmpeg path set successfully:', ffmpegPath);
  } else {
    console.warn('FFmpeg static path not found, using system FFmpeg');
  }
} catch (error) {
  console.error('Failed to set FFmpeg path:', error);
}

/**
 * Convert any audio format to WAV format suitable for Azure Speech Services
 * @param {Buffer} audioBuffer - Audio buffer in any format
 * @param {string} inputFormat - Input format hint (optional)
 * @returns {Promise<Buffer>} WAV audio buffer (16kHz, 16-bit, mono PCM)
 */
export const convertToWav = (audioBuffer, inputFormat = 'webm') => {
  return new Promise((resolve, reject) => {
    console.log('Starting audio to WAV conversion:', { 
      inputSize: audioBuffer.length,
      inputFormat,
      timestamp: new Date().toISOString(),
      platform: process.platform,
      nodeEnv: process.env.NODE_ENV
    });
    
    logger.info('Starting audio to WAV conversion:', { 
      inputSize: audioBuffer.length,
      inputFormat 
    });
    
    const input = new stream.PassThrough();
    input.end(audioBuffer);

    const output = [];
    const outputStream = new stream.PassThrough();
    let resolved = false;
    
    outputStream.on('data', chunk => output.push(chunk));
    outputStream.on('end', () => {
      if (!resolved) {
        resolved = true;
        const wavBuffer = Buffer.concat(output);
        console.log('Audio to WAV conversion completed successfully:', { 
          inputSize: audioBuffer.length,
          outputSize: wavBuffer.length,
          timestamp: new Date().toISOString()
        });
        logger.info('Audio to WAV conversion completed:', { 
          inputSize: audioBuffer.length,
          outputSize: wavBuffer.length 
        });
        resolve(wavBuffer);
      }
    });

    const ffmpegCommand = ffmpeg(input)
      .audioChannels(1)           // Mono
      .audioFrequency(16000)      // 16kHz sample rate
      .audioCodec('pcm_s16le')    // 16-bit PCM
      .format('wav')              // WAV container
      .on('start', (commandLine) => {
        console.log('FFmpeg conversion started:', { 
          command: commandLine,
          timestamp: new Date().toISOString()
        });
        logger.info('FFmpeg conversion started:', { command: commandLine });
      })
      .on('error', (err) => {
        if (!resolved) {
          resolved = true;
          console.error('FFmpeg conversion error:', {
            error: err.message,
            stack: err.stack,
            timestamp: new Date().toISOString()
          });
          logger.error('FFmpeg conversion error:', err);
          reject(new Error(`Audio conversion failed: ${err.message}`));
        } else {
          // Log the error but don't reject if we already resolved
          console.warn('FFmpeg error after successful conversion (ignoring):', err.message);
        }
      })
      .on('end', () => {
        logger.info('FFmpeg conversion process completed');
      });

    // Add timeout to prevent hanging
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        reject(new Error('Audio conversion timeout'));
      }
    }, 30000); // 30 second timeout

    // Clear timeout when done
    outputStream.on('end', () => clearTimeout(timeout));
    outputStream.on('error', () => clearTimeout(timeout));

    ffmpegCommand.pipe(outputStream, { end: false });
    
    // Manually end the output stream when ffmpeg ends
    ffmpegCommand.on('end', () => {
      outputStream.end();
    });
  });
};

/**
 * Detect audio format from buffer header
 * @param {Buffer} buffer - Audio buffer
 * @returns {string} Detected format
 */
export const detectAudioFormat = (buffer) => {
  const header = buffer.slice(0, 12).toString('hex');
  
  // WebM format detection
  if (header.startsWith('1a45dfa3')) {
    return 'webm';
  }
  
  // WAV format detection
  if (header.startsWith('52494646') && header.includes('57415645')) {
    return 'wav';
  }
  
  // MP3 format detection
  if (header.startsWith('494433') || header.startsWith('fffb') || header.startsWith('fff3')) {
    return 'mp3';
  }
  
  // OGG format detection
  if (header.startsWith('4f676753')) {
    return 'ogg';
  }
  
  return 'unknown';
};

/**
 * Properly concatenate multiple WAV audio buffers into a single WAV file
 * @param {Buffer[]} wavBuffers - Array of WAV audio buffers
 * @returns {Promise<Buffer>} Single concatenated WAV buffer
 */
export const concatenateWavBuffers = async (wavBuffers) => {
  if (!wavBuffers || wavBuffers.length === 0) {
    throw new Error('No audio buffers provided');
  }

  if (wavBuffers.length === 1) {
    return wavBuffers[0];
  }

  logger.info('Concatenating WAV buffers:', { 
    numberOfBuffers: wavBuffers.length,
    bufferSizes: wavBuffers.map(buf => buf.length)
  });

  // Create temporary directory for files
  const tempDir = path.join(process.cwd(), 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const sessionId = uuidv4();
  const tempFiles = [];
  const outputFile = path.join(tempDir, `concatenated_${sessionId}.wav`);

  try {
    // Write each buffer to a temporary file
    for (let i = 0; i < wavBuffers.length; i++) {
      const tempFile = path.join(tempDir, `chunk_${sessionId}_${i}.wav`);
      fs.writeFileSync(tempFile, wavBuffers[i]);
      tempFiles.push(tempFile);
      logger.info(`Wrote temp file ${i + 1}/${wavBuffers.length}:`, { 
        file: tempFile, 
        size: wavBuffers[i].length 
      });
    }

    // Use FFmpeg to concatenate the files
    return new Promise((resolve, reject) => {
      const command = ffmpeg();
      
      // Add all input files
      tempFiles.forEach(file => {
        command.input(file);
      });

      command
        .on('start', (commandLine) => {
          logger.info('FFmpeg concatenation started:', { command: commandLine });
        })
        .on('error', (err) => {
          logger.error('FFmpeg concatenation error:', err);
          cleanup();
          reject(new Error(`Audio concatenation failed: ${err.message}`));
        })
        .on('end', () => {
          logger.info('FFmpeg concatenation completed');
          
          // Read the output file
          try {
            const concatenatedBuffer = fs.readFileSync(outputFile);
            logger.info('WAV concatenation successful:', { 
              inputFiles: tempFiles.length,
              outputSize: concatenatedBuffer.length 
            });
            cleanup();
            resolve(concatenatedBuffer);
          } catch (readError) {
            logger.error('Error reading concatenated file:', readError);
            cleanup();
            reject(readError);
          }
        })
        .audioCodec('pcm_s16le')
        .audioChannels(1)
        .audioFrequency(16000)
        .format('wav')
        .save(outputFile);
    });

  } catch (error) {
    logger.error('Error in concatenateWavBuffers:', error);
    cleanup();
    throw error;
  }

  function cleanup() {
    // Clean up temporary files
    tempFiles.forEach(file => {
      try {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file);
        }
      } catch (err) {
        logger.warn(`Failed to delete temp file ${file}:`, err);
      }
    });
    
    try {
      if (fs.existsSync(outputFile)) {
        fs.unlinkSync(outputFile);
      }
    } catch (err) {
      logger.warn(`Failed to delete output file ${outputFile}:`, err);
    }
  }
};
