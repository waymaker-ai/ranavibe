# RANA Voice Plugin

The Voice Plugin adds comprehensive voice capabilities to RANA, including Speech-to-Text (STT), Text-to-Speech (TTS), and real-time voice conversation support.

## Features

- **Speech-to-Text**: Convert audio to text using multiple providers
- **Text-to-Speech**: Generate natural-sounding speech from text
- **Real-time Sessions**: Support for interactive voice conversations
- **Voice Activity Detection**: Detect when speech is present in audio
- **Multiple Providers**: OpenAI, ElevenLabs, Google Cloud, and custom providers
- **Audio Format Support**: WAV, MP3, OGG, WebM, FLAC, Opus
- **Flexible Configuration**: Fine-tune quality, language, sample rate, and more

## Installation

The Voice Plugin is included in `@rana/core`:

```bash
npm install @rana/core
```

## Quick Start

```typescript
import { createRana, createVoicePlugin } from '@rana/core';

// Create RANA client
const rana = createRana({
  providers: {
    openai: process.env.OPENAI_API_KEY,
  },
});

// Configure and register voice plugin
const voicePlugin = createVoicePlugin({
  sttProvider: 'openai-whisper',
  ttsProvider: 'openai-tts',
  defaultVoice: 'nova',
  language: 'en-US',
  apiKeys: {
    openai: process.env.OPENAI_API_KEY,
  },
});

await rana.use(voicePlugin);
```

## Configuration

### VoiceConfig

```typescript
interface VoiceConfig {
  // Required
  sttProvider: 'openai-whisper' | 'google-cloud' | 'custom';
  ttsProvider: 'openai-tts' | 'elevenlabs' | 'google-cloud' | 'custom';

  // Optional
  defaultVoice?: string;           // Default voice ID for TTS
  language?: string;                // Language/locale (e.g., 'en-US')
  sampleRate?: number;              // Audio sample rate in Hz (default: 16000)
  audioFormat?: AudioFormat;        // Audio format (default: 'wav')
  quality?: 'low' | 'medium' | 'high' | 'ultra';
  enableVAD?: boolean;              // Enable voice activity detection
  vadSensitivity?: number;          // VAD sensitivity 0-1 (default: 0.5)

  // API Keys
  apiKeys?: {
    openai?: string;
    elevenlabs?: string;
    google?: string;
  };

  // Custom provider
  customProvider?: CustomVoiceProvider;
}
```

## Speech-to-Text (Transcription)

### Basic Transcription

```typescript
import { VoicePlugin, createAudioBuffer } from '@rana/core';

const voicePlugin = new VoicePlugin({
  sttProvider: 'openai-whisper',
  apiKeys: { openai: process.env.OPENAI_API_KEY },
});

// Create audio buffer
const audioBuffer = createAudioBuffer(audioData, {
  format: 'wav',
  sampleRate: 16000,
  channels: 1,
});

// Transcribe
const result = await voicePlugin.transcribe(audioBuffer);

console.log(result.text);        // Transcribed text
console.log(result.confidence);  // Confidence score
console.log(result.language);    // Detected language
console.log(result.duration);    // Audio duration
```

### Transcription with Options

```typescript
const result = await voicePlugin.transcribe(audioBuffer, {
  language: 'en',
  prompt: 'This is a conversation about AI technology',
});
```

### Transcribe from URL

```typescript
const result = await voicePlugin.transcribe('https://example.com/audio.mp3');
```

## Text-to-Speech (Synthesis)

### Basic Synthesis

```typescript
const result = await voicePlugin.synthesize(
  'Hello! I am a RANA voice assistant.'
);

console.log(result.audio);      // AudioBuffer with generated speech
console.log(result.voiceId);    // Voice ID used
console.log(result.duration);   // Audio duration
```

### Synthesis with Options

```typescript
const result = await voicePlugin.synthesize(
  'This is a different voice speaking.',
  {
    voiceId: 'onyx',    // Use specific voice
    speed: 1.2,         // Adjust speed
    provider: 'openai-tts',
  }
);
```

### Save Audio to File (Node.js)

```typescript
import { writeFileSync } from 'fs';

const result = await voicePlugin.synthesize('Hello, world!');
writeFileSync('output.mp3', Buffer.from(result.audio.data));
```

## Voice Management

### List Available Voices

```typescript
const voices = await voicePlugin.getVoices('openai-tts');

voices.forEach(voice => {
  console.log(`${voice.name} (${voice.id})`);
  console.log(`  Language: ${voice.language}`);
  console.log(`  Gender: ${voice.gender}`);
});
```

### Set Default Voice

```typescript
voicePlugin.setVoice('shimmer');
```

### OpenAI Voices

- `alloy` - Neutral voice
- `echo` - Male voice
- `fable` - Neutral voice
- `onyx` - Male voice
- `nova` - Female voice
- `shimmer` - Female voice

## Real-time Voice Sessions

### Create and Use a Session

```typescript
const session = await voicePlugin.createVoiceSession({
  voiceId: 'nova',
  sttProvider: 'openai-whisper',
  ttsProvider: 'openai-tts',
});

// Listen for transcriptions
session.onTranscription((result) => {
  console.log('User said:', result.text);
  // Process with LLM and respond
});

// Listen for speech synthesis
session.onSynthesis((result) => {
  console.log('Assistant speaking:', result.duration, 'seconds');
  // Play the audio
});

// Send audio for transcription
await session.sendAudio(audioBuffer);

// Speak a response
await session.speak('I understand your question.');

// Get statistics
const stats = session.getStats();
console.log('Session duration:', stats.duration);
console.log('Transcriptions:', stats.transcriptionCount);
console.log('Average latency:', stats.averageLatency);

// Close session
session.close();
```

### Session Control

```typescript
session.pause();   // Pause processing
session.resume();  // Resume processing
session.close();   // Close and cleanup
```

## Voice Activity Detection

```typescript
const vadResult = await voicePlugin.detectVoiceActivity(audioBuffer);

if (vadResult.isSpeech) {
  console.log('Speech detected with confidence:', vadResult.confidence);
  // Process the audio
} else {
  console.log('Silence detected');
  // Ignore or wait
}
```

## Providers

### OpenAI (Whisper + TTS)

```typescript
const voicePlugin = new VoicePlugin({
  sttProvider: 'openai-whisper',
  ttsProvider: 'openai-tts',
  apiKeys: {
    openai: process.env.OPENAI_API_KEY,
  },
});
```

**Features:**
- STT: Whisper model (highly accurate, multi-language)
- TTS: 6 natural voices with speed control
- Sample Rate: 16000 Hz (STT), 24000 Hz (TTS)

### ElevenLabs

```typescript
const voicePlugin = new VoicePlugin({
  sttProvider: 'openai-whisper',  // ElevenLabs is TTS-only
  ttsProvider: 'elevenlabs',
  apiKeys: {
    openai: process.env.OPENAI_API_KEY,
    elevenlabs: process.env.ELEVENLABS_API_KEY,
  },
});

// List and use custom voices
const voices = await voicePlugin.getVoices('elevenlabs');
const result = await voicePlugin.synthesize('Hello!', {
  voiceId: voices[0].id,
});
```

**Features:**
- High-quality voice synthesis
- Custom voice cloning
- Multiple languages and accents
- Sample Rate: 44100 Hz

### Google Cloud Speech

```typescript
const voicePlugin = new VoicePlugin({
  sttProvider: 'google-cloud',
  ttsProvider: 'google-cloud',
  apiKeys: {
    google: process.env.GOOGLE_API_KEY,
  },
});
```

**Features:**
- Both STT and TTS support
- Wide language support
- Sample Rate: 16000 Hz

### Custom Provider

```typescript
const customProvider = {
  name: 'my-provider',

  async transcribe(audio, options) {
    // Your STT implementation
    return {
      text: 'transcribed text',
      confidence: 0.95,
      provider: 'custom',
    };
  },

  async synthesize(text, voiceId, options) {
    // Your TTS implementation
    return {
      audio: createAudioBuffer(...),
      voiceId,
      duration: 0,
      provider: 'custom',
    };
  },

  async getVoices() {
    return [{ id: 'voice1', name: 'Voice 1', ... }];
  },
};

const voicePlugin = new VoicePlugin({
  sttProvider: 'custom',
  ttsProvider: 'custom',
  customProvider,
});
```

## Complete Voice Assistant Example

```typescript
import { createRana, VoicePlugin } from '@rana/core';

// Initialize RANA
const rana = createRana({
  providers: {
    openai: process.env.OPENAI_API_KEY,
    anthropic: process.env.ANTHROPIC_API_KEY,
  },
  defaults: {
    provider: 'anthropic',
    model: 'claude-3-5-sonnet-20241022',
  },
});

// Initialize voice plugin
const voicePlugin = new VoicePlugin({
  sttProvider: 'openai-whisper',
  ttsProvider: 'openai-tts',
  defaultVoice: 'nova',
  language: 'en-US',
  enableVAD: true,
  apiKeys: {
    openai: process.env.OPENAI_API_KEY,
  },
});

// Create voice session
const session = await voicePlugin.createVoiceSession();

// Handle conversation
const conversationHistory = [];

session.onTranscription(async (transcription) => {
  console.log('User:', transcription.text);

  // Add to history
  conversationHistory.push({
    role: 'user',
    content: transcription.text,
  });

  // Get AI response
  const response = await rana.chat({
    messages: conversationHistory,
  });

  console.log('Assistant:', response.content);

  // Add to history
  conversationHistory.push({
    role: 'assistant',
    content: response.content,
  });

  // Speak the response
  await session.speak(response.content);
});

session.onSynthesis((synthesis) => {
  // Play audio in your application
  playAudio(synthesis.audio);
});

console.log('Voice assistant ready!');
```

## Audio Utilities

### Create Audio Buffer

```typescript
import { createAudioBuffer } from '@rana/core';

const buffer = createAudioBuffer(audioData, {
  format: 'wav',
  sampleRate: 16000,
  channels: 1,
  mimeType: 'audio/wav',
});
```

### Validate Provider

```typescript
import { validateVoiceProvider } from '@rana/core';

const isValid = validateVoiceProvider('openai-whisper', {
  openai: process.env.OPENAI_API_KEY,
});
```

### Get Recommended Sample Rate

```typescript
import { getRecommendedSampleRate } from '@rana/core';

const sampleRate = getRecommendedSampleRate('openai-whisper');
// Returns: 16000
```

### Estimate Audio Duration

```typescript
import { estimateAudioDuration } from '@rana/core';

const duration = estimateAudioDuration(audioBuffer, 16); // 16 bits per sample
console.log('Duration:', duration, 'seconds');
```

## Best Practices

1. **Choose the Right Provider**:
   - OpenAI: Good balance of quality and speed
   - ElevenLabs: Best quality for TTS
   - Google Cloud: Best for multi-language support

2. **Optimize Sample Rate**:
   - 16000 Hz for most STT use cases
   - 24000-44100 Hz for high-quality TTS

3. **Use Voice Activity Detection**:
   - Reduces unnecessary processing
   - Improves user experience
   - Saves API costs

4. **Handle Errors Gracefully**:
   ```typescript
   try {
     const result = await voicePlugin.transcribe(audio);
   } catch (error) {
     console.error('Transcription failed:', error);
     // Fallback or retry logic
   }
   ```

5. **Clean Up Resources**:
   ```typescript
   // Close sessions when done
   session.close();

   // Cleanup on shutdown
   await voicePlugin.destroy();
   ```

## TypeScript Support

The Voice Plugin is fully typed with comprehensive TypeScript definitions:

```typescript
import type {
  VoiceConfig,
  AudioBuffer,
  TranscriptionResult,
  SynthesisResult,
  Voice,
  VoiceSession,
  VoiceSessionStats,
  CustomVoiceProvider,
  VADResult,
} from '@rana/core';
```

## Troubleshooting

### Common Issues

1. **"API key is required" Error**
   - Ensure you've provided the correct API key for your provider
   - Check that the key is valid and has sufficient credits

2. **Audio Format Not Supported**
   - Convert your audio to a supported format (WAV, MP3, OGG)
   - Check the provider's documentation for format requirements

3. **Low Transcription Accuracy**
   - Use higher quality audio (reduce background noise)
   - Provide context with the `prompt` parameter
   - Try a different provider

4. **High Latency**
   - Use a lower quality setting for faster processing
   - Choose a provider with better geographic proximity
   - Implement caching for repeated requests

## License

Part of the RANA project. See LICENSE for details.
