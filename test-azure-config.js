// Test script to check Azure configuration in production environment
console.log('=== Environment Variables Test ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('AZURE_SPEECH_KEY:', process.env.AZURE_SPEECH_KEY ? 'PRESENT' : 'MISSING');
console.log('AZURE_SPEECH_REGION:', process.env.AZURE_SPEECH_REGION);
console.log('Script executed successfully');
