/**
 * Voice Plugin Examples
 * Demonstrates various usage patterns for the RANA Voice Plugin
 */

import { createRana } from '../client';
import {
  createVoicePlugin,
  VoicePlugin,
  createAudioBuffer,
  type VoiceConfig,
  type AudioBuffer,
  type VoiceSession,
} from './voice';

// ============================================================================
// Example 1: Basic Setup with OpenAI
// ============================================================================

async function example1_BasicSetup() {
  console.log('=== Example 1: Basic Setup with OpenAI ===\n');

  // Create RANA client
  const rana = createRana({
    providers: {
      openai: process.env.OPENAI_API_KEY!,
    },
  });

  // Configure voice plugin
  const voiceConfig: VoiceConfig = {
    sttProvider: 'openai-whisper',
    ttsProvider: 'openai-tts',
    defaultVoice: 'nova',
    language: 'en-US',
    sampleRate: 16000,
    quality: 'medium',
    apiKeys: {
      openai: process.env.OPENAI_API_KEY!,
    },
  };

  // Create and register the plugin
  const voicePlugin = createVoicePlugin(voiceConfig);
  await rana.use(voicePlugin);

  console.log('Voice plugin registered successfully!');
}

// ============================================================================
// Example 2: Speech-to-Text (Transcription)
// ============================================================================

async function example2_Transcription() {
  console.log('=== Example 2: Speech-to-Text ===\n');

  const voicePlugin = new VoicePlugin({
    sttProvider: 'openai-whisper',
    ttsProvider: 'openai-tts',
    apiKeys: {
      openai: process.env.OPENAI_API_KEY!,
    },
  });

  // Create audio buffer from file or URL
  const audioBuffer = createAudioBuffer(
    new Uint8Array(), // Your audio data here
    {
      format: 'wav',
      sampleRate: 16000,
      channels: 1,
    }
  );

  // Transcribe audio
  const result = await voicePlugin.transcribe(audioBuffer);

  console.log('Transcription:', result.text);
  console.log('Confidence:', result.confidence);
  console.log('Language:', result.language);
  console.log('Duration:', result.duration);

  // Transcribe with options
  const resultWithOptions = await voicePlugin.transcribe(audioBuffer, {
    language: 'en',
    prompt: 'This is a conversation about AI technology',
  });

  console.log('Transcription with prompt:', resultWithOptions.text);
}

// ============================================================================
// Example 3: Text-to-Speech (Synthesis)
// ============================================================================

async function example3_TextToSpeech() {
  console.log('=== Example 3: Text-to-Speech ===\n');

  const voicePlugin = new VoicePlugin({
    sttProvider: 'openai-whisper',
    ttsProvider: 'openai-tts',
    defaultVoice: 'nova',
    apiKeys: {
      openai: process.env.OPENAI_API_KEY!,
    },
  });

  // Basic synthesis
  const result = await voicePlugin.synthesize(
    'Hello! I am a RANA voice assistant. How can I help you today?'
  );

  console.log('Audio generated:', {
    format: result.audio.format,
    sampleRate: result.audio.sampleRate,
    duration: result.duration,
    voiceId: result.voiceId,
  });

  // Synthesis with different voice
  const resultWithVoice = await voicePlugin.synthesize(
    'This is a different voice speaking.',
    {
      voiceId: 'onyx', // Male voice
      speed: 1.2,
    }
  );

  console.log('Different voice:', resultWithVoice.voiceId);

  // Save audio to file (Node.js example)
  if (typeof window === 'undefined') {
    const fs = await import('fs');
    fs.writeFileSync('output.mp3', Buffer.from(result.audio.data));
    console.log('Audio saved to output.mp3');
  }
}

// ============================================================================
// Example 4: List Available Voices
// ============================================================================

async function example4_ListVoices() {
  console.log('=== Example 4: List Available Voices ===\n');

  const voicePlugin = new VoicePlugin({
    sttProvider: 'openai-whisper',
    ttsProvider: 'openai-tts',
    apiKeys: {
      openai: process.env.OPENAI_API_KEY!,
    },
  });

  // Get available voices from OpenAI
  const voices = await voicePlugin.getVoices('openai-tts');

  console.log('Available voices:');
  voices.forEach((voice) => {
    console.log(`- ${voice.name} (${voice.id})`);
    console.log(`  Language: ${voice.language}`);
    console.log(`  Gender: ${voice.gender}`);
  });

  // Set default voice
  voicePlugin.setVoice('shimmer');
  console.log('\nDefault voice set to: shimmer');
}

// ============================================================================
// Example 5: Real-time Voice Session
// ============================================================================

async function example5_VoiceSession() {
  console.log('=== Example 5: Real-time Voice Session ===\n');

  const voicePlugin = new VoicePlugin({
    sttProvider: 'openai-whisper',
    ttsProvider: 'openai-tts',
    defaultVoice: 'nova',
    enableVAD: true,
    vadSensitivity: 0.7,
    apiKeys: {
      openai: process.env.OPENAI_API_KEY!,
    },
  });

  // Create a voice session
  const session = await voicePlugin.createVoiceSession({
    voiceId: 'nova',
  });

  console.log('Session created:', session.id);

  // Listen for transcriptions
  session.onTranscription((result) => {
    console.log('User said:', result.text);

    // Process with LLM and respond
    // (You would integrate with RANA chat here)
  });

  // Listen for speech synthesis
  session.onSynthesis((result) => {
    console.log('Assistant speaking:', result.duration, 'seconds');
    // Play the audio
  });

  // Simulate sending audio
  const audioBuffer = createAudioBuffer(new Uint8Array(), {
    format: 'wav',
    sampleRate: 16000,
    channels: 1,
  });

  await session.sendAudio(audioBuffer);

  // Speak a response
  await session.speak('I understand your question. Let me help you with that.');

  // Get session statistics
  const stats = session.getStats();
  console.log('Session stats:', {
    duration: stats.duration,
    transcriptions: stats.transcriptionCount,
    syntheses: stats.synthesisCount,
    avgLatency: stats.averageLatency,
  });

  // Close session when done
  session.close();
  console.log('Session closed');
}

// ============================================================================
// Example 6: ElevenLabs Integration
// ============================================================================

async function example6_ElevenLabs() {
  console.log('=== Example 6: ElevenLabs TTS ===\n');

  const voicePlugin = new VoicePlugin({
    sttProvider: 'openai-whisper',
    ttsProvider: 'elevenlabs',
    apiKeys: {
      openai: process.env.OPENAI_API_KEY!,
      elevenlabs: process.env.ELEVENLABS_API_KEY!,
    },
  });

  // List ElevenLabs voices
  const voices = await voicePlugin.getVoices('elevenlabs');

  console.log('ElevenLabs voices:');
  voices.forEach((voice) => {
    console.log(`- ${voice.name} (${voice.id})`);
    console.log(`  Description: ${voice.description}`);
  });

  // Use a specific voice
  const voiceId = voices[0].id;
  const result = await voicePlugin.synthesize(
    'This is generated using ElevenLabs high-quality voice synthesis.',
    {
      voiceId,
      provider: 'elevenlabs',
    }
  );

  console.log('Generated with ElevenLabs:', {
    voiceId: result.voiceId,
    format: result.audio.format,
    sampleRate: result.audio.sampleRate,
  });
}

// ============================================================================
// Example 7: Voice Activity Detection
// ============================================================================

async function example7_VoiceActivityDetection() {
  console.log('=== Example 7: Voice Activity Detection ===\n');

  const voicePlugin = new VoicePlugin({
    sttProvider: 'openai-whisper',
    ttsProvider: 'openai-tts',
    enableVAD: true,
    vadSensitivity: 0.6,
    apiKeys: {
      openai: process.env.OPENAI_API_KEY!,
    },
  });

  // Create audio buffer
  const audioBuffer = createAudioBuffer(new Uint8Array(1024), {
    format: 'wav',
    sampleRate: 16000,
    channels: 1,
  });

  // Detect voice activity
  const vadResult = await voicePlugin.detectVoiceActivity(audioBuffer);

  console.log('Voice detected:', vadResult.isSpeech);
  console.log('Confidence:', vadResult.confidence);

  if (vadResult.isSpeech) {
    console.log('Speech detected - processing...');
    const transcription = await voicePlugin.transcribe(audioBuffer);
    console.log('Transcription:', transcription.text);
  } else {
    console.log('Silence detected - waiting...');
  }
}

// ============================================================================
// Example 8: Complete Voice Assistant
// ============================================================================

async function example8_CompleteVoiceAssistant() {
  console.log('=== Example 8: Complete Voice Assistant ===\n');

  // Initialize RANA with voice plugin
  const rana = createRana({
    providers: {
      openai: process.env.OPENAI_API_KEY!,
      anthropic: process.env.ANTHROPIC_API_KEY!,
    },
    defaults: {
      provider: 'anthropic',
      model: 'claude-3-5-sonnet-20241022',
    },
  });

  const voicePlugin = new VoicePlugin({
    sttProvider: 'openai-whisper',
    ttsProvider: 'openai-tts',
    defaultVoice: 'nova',
    language: 'en-US',
    enableVAD: true,
    apiKeys: {
      openai: process.env.OPENAI_API_KEY!,
    },
  });

  // Create voice session
  const session = await voicePlugin.createVoiceSession();

  console.log('Voice assistant ready!');

  // Handle user speech
  session.onTranscription(async (transcription) => {
    console.log('User:', transcription.text);

    // Process with LLM
    const response = await rana.chat({
      messages: [
        { role: 'user', content: transcription.text },
      ],
    });

    console.log('Assistant:', response.content);

    // Speak the response
    await session.speak(response.content);
  });

  // Handle assistant speech
  session.onSynthesis((synthesis) => {
    console.log('Speaking response...');
    // Play audio in your application
  });

  console.log('Voice assistant is listening...');
}

// ============================================================================
// Example 9: Custom Voice Provider
// ============================================================================

async function example9_CustomProvider() {
  console.log('=== Example 9: Custom Voice Provider ===\n');

  // Define custom provider
  const customProvider = {
    name: 'my-custom-provider',

    async transcribe(audio: AudioBuffer): Promise<any> {
      console.log('Custom transcription for audio:', audio.format);
      // Your custom STT implementation
      return {
        text: 'Custom transcription result',
        confidence: 0.95,
        provider: 'custom' as const,
      };
    },

    async synthesize(text: string, voiceId: string): Promise<any> {
      console.log('Custom synthesis for text:', text);
      // Your custom TTS implementation
      return {
        audio: createAudioBuffer(new Uint8Array(), {
          format: 'wav' as const,
          sampleRate: 16000,
        }),
        voiceId,
        duration: 0,
        provider: 'custom' as const,
      };
    },

    async getVoices(): Promise<any[]> {
      return [
        {
          id: 'custom-voice-1',
          name: 'Custom Voice',
          language: 'en-US',
          provider: 'custom' as const,
        },
      ];
    },
  };

  const voicePlugin = new VoicePlugin({
    sttProvider: 'custom',
    ttsProvider: 'custom',
    customProvider,
  });

  // Use custom provider
  const audioBuffer = createAudioBuffer(new Uint8Array(), {
    format: 'wav',
    sampleRate: 16000,
  });

  const transcription = await voicePlugin.transcribe(audioBuffer);
  console.log('Custom transcription:', transcription.text);

  const synthesis = await voicePlugin.synthesize('Hello from custom provider');
  console.log('Custom synthesis completed');

  const voices = await voicePlugin.getVoices();
  console.log('Custom voices:', voices);
}

// ============================================================================
// Run Examples
// ============================================================================

async function runExamples() {
  try {
    // Uncomment the examples you want to run
    // await example1_BasicSetup();
    // await example2_Transcription();
    // await example3_TextToSpeech();
    // await example4_ListVoices();
    // await example5_VoiceSession();
    // await example6_ElevenLabs();
    // await example7_VoiceActivityDetection();
    // await example8_CompleteVoiceAssistant();
    // await example9_CustomProvider();

    console.log('\n=== All examples completed ===');
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Run if executed directly
if (require.main === module) {
  runExamples();
}

export {
  example1_BasicSetup,
  example2_Transcription,
  example3_TextToSpeech,
  example4_ListVoices,
  example5_VoiceSession,
  example6_ElevenLabs,
  example7_VoiceActivityDetection,
  example8_CompleteVoiceAssistant,
  example9_CustomProvider,
};
