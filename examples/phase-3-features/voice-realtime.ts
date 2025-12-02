/**
 * Real-Time Voice Example
 * Demonstrates voice conversations with AI using WebRTC
 */

import { VoiceSession, AudioRecorder, AudioPlayer, Transcriber, TextToSpeech } from '@rana/core';

async function main() {
  // Example 1: Basic voice session
  console.log('=== Basic Voice Session ===');

  const session = new VoiceSession({
    model: 'gpt-4o-realtime-preview',
    voice: 'alloy',
    modalities: ['text', 'audio'],
    instructions: 'You are a helpful assistant. Keep responses concise.',
  });

  // Connect to the real-time API
  await session.connect();
  console.log('Session connected:', session.sessionId);

  // Handle events
  session.on('speech_started', () => {
    console.log('User started speaking...');
  });

  session.on('speech_ended', () => {
    console.log('User finished speaking');
  });

  session.on('transcript', (event) => {
    console.log('User said:', event.text);
  });

  session.on('response', (event) => {
    console.log('Assistant:', event.text);
  });

  session.on('audio', (event) => {
    // Play audio response
    AudioPlayer.play(event.audio);
  });

  session.on('error', (error) => {
    console.error('Session error:', error);
  });

  // Start listening (with VAD)
  await session.startListening({
    vadEnabled: true,
    vadThreshold: 0.5,
    silenceTimeout: 1000,
  });

  console.log('Listening for voice input...');
  console.log('Press Ctrl+C to stop');

  // Keep session alive
  await new Promise((resolve) => {
    process.on('SIGINT', () => {
      console.log('\nEnding session...');
      session.disconnect();
      resolve(undefined);
    });
  });

  // Example 2: Push-to-talk mode
  console.log('\n=== Push-to-Talk Mode ===');

  const pttSession = new VoiceSession({
    model: 'gpt-4o-realtime-preview',
    voice: 'nova',
    inputMode: 'push-to-talk',
  });

  await pttSession.connect();

  // Simulate push-to-talk
  console.log('Recording...');
  await pttSession.startRecording();
  // ... user speaks ...
  await new Promise(r => setTimeout(r, 2000)); // Simulate 2 seconds of recording
  await pttSession.stopRecording();
  console.log('Recording stopped');

  // Wait for response
  const response = await pttSession.waitForResponse();
  console.log('Response:', response.text);

  await pttSession.disconnect();

  // Example 3: Audio transcription
  console.log('\n=== Audio Transcription ===');

  const transcriber = new Transcriber({
    model: 'whisper-1',
    language: 'en',
  });

  // Transcribe audio file
  const fileTranscript = await transcriber.transcribe({
    source: './audio/meeting.mp3',
    options: {
      timestamps: true,
      speakerDiarization: true,
    },
  });

  console.log('Transcription:');
  for (const segment of fileTranscript.segments) {
    console.log(`[${segment.start}-${segment.end}] ${segment.speaker}: ${segment.text}`);
  }

  // Real-time transcription
  console.log('\n=== Real-Time Transcription ===');

  const recorder = new AudioRecorder({
    sampleRate: 16000,
    channels: 1,
  });

  const realtimeTranscriber = new Transcriber({
    model: 'whisper-1',
    streaming: true,
  });

  realtimeTranscriber.on('partial', (text) => {
    process.stdout.write(`\rPartial: ${text}`);
  });

  realtimeTranscriber.on('final', (text) => {
    console.log(`\nFinal: ${text}`);
  });

  // Start recording and transcribing
  const audioStream = await recorder.start();
  await realtimeTranscriber.transcribeStream(audioStream);

  // Example 4: Text-to-Speech
  console.log('\n=== Text-to-Speech ===');

  const tts = new TextToSpeech({
    model: 'tts-1',
    voice: 'shimmer',
  });

  // Generate speech
  const audio = await tts.synthesize({
    text: 'Hello! Welcome to RANA, the production AI development framework.',
    format: 'mp3',
  });

  console.log('Generated audio:');
  console.log(`  Duration: ${audio.duration}s`);
  console.log(`  Size: ${audio.size} bytes`);
  console.log(`  Format: ${audio.format}`);

  // Save to file
  await audio.save('./output/greeting.mp3');
  console.log('Saved to ./output/greeting.mp3');

  // Play audio
  await AudioPlayer.play(audio);

  // Streaming TTS
  console.log('\n=== Streaming TTS ===');

  const ttsStream = await tts.synthesizeStream({
    text: 'This is a longer text that will be streamed as it is generated, providing lower latency for playback.',
  });

  // Play as it streams
  for await (const chunk of ttsStream) {
    await AudioPlayer.playChunk(chunk);
  }

  // Example 5: Voice cloning (if supported)
  console.log('\n=== Voice Styles ===');

  const voices = await tts.listVoices();
  console.log('Available voices:');
  for (const voice of voices) {
    console.log(`  - ${voice.name}: ${voice.description} (${voice.gender})`);
  }

  // Generate with different voices
  for (const voiceName of ['alloy', 'echo', 'nova']) {
    const sample = await tts.synthesize({
      text: `This is the ${voiceName} voice.`,
      voice: voiceName,
    });
    console.log(`Generated ${voiceName}: ${sample.duration}s`);
  }

  // Example 6: Conversation with context
  console.log('\n=== Contextual Conversation ===');

  const contextSession = new VoiceSession({
    model: 'gpt-4o-realtime-preview',
    voice: 'alloy',
    context: {
      systemPrompt: 'You are a technical support agent for a software company.',
      conversationHistory: [
        { role: 'user', content: 'I need help with my account' },
        { role: 'assistant', content: 'I\'d be happy to help with your account. What seems to be the issue?' },
      ],
    },
  });

  await contextSession.connect();

  // Continue conversation
  await contextSession.sendText('I forgot my password');
  const contextResponse = await contextSession.waitForResponse();
  console.log('Response:', contextResponse.text);

  await contextSession.disconnect();

  // Example 7: Multi-language support
  console.log('\n=== Multi-Language ===');

  const multiLangTranscriber = new Transcriber({
    model: 'whisper-1',
    detectLanguage: true,
  });

  const transcript = await multiLangTranscriber.transcribe({
    source: './audio/multilingual.mp3',
  });

  console.log('Detected language:', transcript.language);
  console.log('Confidence:', transcript.languageConfidence);
  console.log('Transcript:', transcript.text);

  // Translate to English
  const translated = await multiLangTranscriber.transcribe({
    source: './audio/french.mp3',
    options: {
      translateTo: 'en',
    },
  });

  console.log('Translated:', translated.text);

  // Example 8: Audio analysis
  console.log('\n=== Audio Analysis ===');

  const analyzer = await session.analyzeAudio({
    source: './audio/sample.mp3',
  });

  console.log('Audio analysis:');
  console.log(`  Duration: ${analyzer.duration}s`);
  console.log(`  Sample rate: ${analyzer.sampleRate}Hz`);
  console.log(`  Channels: ${analyzer.channels}`);
  console.log(`  Average volume: ${analyzer.averageVolume}dB`);
  console.log(`  Speech percentage: ${analyzer.speechPercentage}%`);
  console.log(`  Background noise: ${analyzer.noiseLevel}`);

  // Example 9: Voice activity detection settings
  console.log('\n=== VAD Configuration ===');

  const vadSession = new VoiceSession({
    model: 'gpt-4o-realtime-preview',
    voice: 'alloy',
    vad: {
      enabled: true,
      type: 'server', // or 'client'
      threshold: 0.5,
      prefixPadding: 300, // ms before speech
      silenceThreshold: 500, // ms to detect end of speech
    },
    turnDetection: {
      enabled: true,
      createResponse: true,
      interruptible: true,
    },
  });

  await vadSession.connect();
  console.log('VAD session configured');

  // Example 10: Error handling and reconnection
  console.log('\n=== Robust Connection ===');

  const robustSession = new VoiceSession({
    model: 'gpt-4o-realtime-preview',
    reconnect: {
      enabled: true,
      maxAttempts: 5,
      delay: 1000,
      backoff: 'exponential',
    },
    timeout: {
      connection: 10000,
      response: 30000,
    },
  });

  robustSession.on('reconnecting', (attempt) => {
    console.log(`Reconnecting... attempt ${attempt}`);
  });

  robustSession.on('reconnected', () => {
    console.log('Reconnected successfully');
  });

  await robustSession.connect();
  console.log('Robust session established');

  // Cleanup
  await vadSession.disconnect();
  await robustSession.disconnect();
  console.log('\nAll sessions closed');
}

main().catch(console.error);
