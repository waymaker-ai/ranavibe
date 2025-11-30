/**
 * Voice Plugin for RANA
 * Adds voice capabilities including STT, TTS, and real-time voice conversations
 */

import { definePlugin } from './helpers';
import type { RanaPlugin, RanaConfig } from '../types';

// ============================================================================
// Types
// ============================================================================

/**
 * Supported voice providers
 */
export type VoiceProvider =
  | 'openai-whisper'  // OpenAI Whisper (STT)
  | 'openai-tts'      // OpenAI TTS
  | 'elevenlabs'      // ElevenLabs (TTS)
  | 'google-cloud'    // Google Cloud Speech (STT/TTS)
  | 'custom';         // Custom provider

/**
 * Audio format types
 */
export type AudioFormat =
  | 'wav'
  | 'mp3'
  | 'ogg'
  | 'webm'
  | 'flac'
  | 'opus';

/**
 * Voice quality levels
 */
export type VoiceQuality = 'low' | 'medium' | 'high' | 'ultra';

/**
 * Voice activity detection states
 */
export type VADState = 'silence' | 'speech' | 'processing';

/**
 * Voice plugin configuration
 */
export interface VoiceConfig {
  /** Speech-to-Text provider */
  sttProvider: VoiceProvider;

  /** Text-to-Speech provider */
  ttsProvider: VoiceProvider;

  /** Default voice ID for TTS */
  defaultVoice?: string;

  /** Language/locale (e.g., 'en-US', 'es-ES') */
  language?: string;

  /** Audio sample rate in Hz */
  sampleRate?: number;

  /** Audio format for input/output */
  audioFormat?: AudioFormat;

  /** Voice quality setting */
  quality?: VoiceQuality;

  /** Enable voice activity detection */
  enableVAD?: boolean;

  /** VAD sensitivity (0-1, higher = more sensitive) */
  vadSensitivity?: number;

  /** Provider-specific API keys */
  apiKeys?: {
    openai?: string;
    elevenlabs?: string;
    google?: string;
  };

  /** Custom provider implementation */
  customProvider?: CustomVoiceProvider;
}

/**
 * Audio buffer with metadata
 */
export interface AudioBuffer {
  /** Raw audio data */
  data: Uint8Array | ArrayBuffer | Buffer;

  /** Audio format */
  format: AudioFormat;

  /** Sample rate in Hz */
  sampleRate: number;

  /** Number of channels (1 = mono, 2 = stereo) */
  channels: number;

  /** Duration in seconds */
  duration?: number;

  /** MIME type */
  mimeType?: string;
}

/**
 * Transcription result from STT
 */
export interface TranscriptionResult {
  /** Transcribed text */
  text: string;

  /** Confidence score (0-1) */
  confidence?: number;

  /** Language detected */
  language?: string;

  /** Duration of audio in seconds */
  duration?: number;

  /** Word-level timestamps */
  words?: Array<{
    word: string;
    start: number;
    end: number;
    confidence?: number;
  }>;

  /** Provider that performed the transcription */
  provider: VoiceProvider;

  /** Raw provider response */
  raw?: any;
}

/**
 * Speech synthesis result from TTS
 */
export interface SynthesisResult {
  /** Generated audio */
  audio: AudioBuffer;

  /** Voice ID used */
  voiceId: string;

  /** Duration in seconds */
  duration: number;

  /** Provider that performed synthesis */
  provider: VoiceProvider;

  /** Raw provider response */
  raw?: any;
}

/**
 * Voice metadata
 */
export interface Voice {
  /** Unique voice identifier */
  id: string;

  /** Display name */
  name: string;

  /** Voice description */
  description?: string;

  /** Language/locale */
  language: string;

  /** Voice gender */
  gender?: 'male' | 'female' | 'neutral';

  /** Voice age category */
  age?: 'child' | 'young' | 'middle_aged' | 'old';

  /** Voice style/accent */
  style?: string;

  /** Preview audio URL */
  previewUrl?: string;

  /** Provider */
  provider: VoiceProvider;

  /** Provider-specific metadata */
  metadata?: Record<string, any>;
}

/**
 * Real-time voice session
 */
export interface VoiceSession {
  /** Unique session ID */
  id: string;

  /** Session state */
  state: 'idle' | 'active' | 'paused' | 'closed';

  /** Current VAD state */
  vadState?: VADState;

  /** Send audio for transcription */
  sendAudio(audio: AudioBuffer): Promise<void>;

  /** Receive transcription results */
  onTranscription(callback: (result: TranscriptionResult) => void): void;

  /** Receive synthesis results */
  onSynthesis(callback: (result: SynthesisResult) => void): void;

  /** Speak text (TTS) */
  speak(text: string, voiceId?: string): Promise<void>;

  /** Pause the session */
  pause(): void;

  /** Resume the session */
  resume(): void;

  /** Close the session */
  close(): void;

  /** Get session statistics */
  getStats(): VoiceSessionStats;
}

/**
 * Voice session statistics
 */
export interface VoiceSessionStats {
  /** Total duration in seconds */
  duration: number;

  /** Total audio processed (in seconds) */
  audioProcessed: number;

  /** Number of transcriptions */
  transcriptionCount: number;

  /** Number of syntheses */
  synthesisCount: number;

  /** Average latency in ms */
  averageLatency: number;

  /** VAD statistics */
  vadStats?: {
    speechDetected: number;
    silenceDetected: number;
    falsePositives: number;
  };
}

/**
 * Custom voice provider interface
 */
export interface CustomVoiceProvider {
  /** Provider name */
  name: string;

  /** Transcribe audio to text */
  transcribe(audio: AudioBuffer, options?: any): Promise<TranscriptionResult>;

  /** Synthesize text to audio */
  synthesize(text: string, voiceId: string, options?: any): Promise<SynthesisResult>;

  /** List available voices */
  getVoices?(): Promise<Voice[]>;

  /** Create a voice session */
  createSession?(config: VoiceConfig): Promise<VoiceSession>;
}

/**
 * Voice activity detection result
 */
export interface VADResult {
  /** Is speech detected */
  isSpeech: boolean;

  /** Confidence score (0-1) */
  confidence: number;

  /** Start time in seconds */
  startTime?: number;

  /** End time in seconds */
  endTime?: number;
}

// ============================================================================
// Voice Plugin Class
// ============================================================================

/**
 * Voice capabilities plugin for RANA
 */
export class VoicePlugin {
  private config: VoiceConfig;
  private ranaConfig?: RanaConfig;
  private activeSessions: Map<string, VoiceSession> = new Map();
  private voiceCache: Map<VoiceProvider, Voice[]> = new Map();

  constructor(config: VoiceConfig) {
    this.config = {
      language: 'en-US',
      sampleRate: 16000,
      audioFormat: 'wav',
      quality: 'medium',
      enableVAD: true,
      vadSensitivity: 0.5,
      ...config,
    };
  }

  /**
   * Initialize the plugin
   */
  async init(ranaConfig: RanaConfig): Promise<void> {
    this.ranaConfig = ranaConfig;

    // Validate provider configurations
    this.validateProviders();

    // Initialize providers
    await this.initializeProviders();
  }

  /**
   * Transcribe audio to text
   */
  async transcribe(
    audio: AudioBuffer | string,
    options?: {
      provider?: VoiceProvider;
      language?: string;
      prompt?: string;
    }
  ): Promise<TranscriptionResult> {
    const provider = options?.provider || this.config.sttProvider;

    // Convert string URL to AudioBuffer if needed
    let audioBuffer: AudioBuffer;
    if (typeof audio === 'string') {
      audioBuffer = await this.loadAudioFromUrl(audio);
    } else {
      audioBuffer = audio;
    }

    // Validate audio format
    this.validateAudioBuffer(audioBuffer);

    switch (provider) {
      case 'openai-whisper':
        return await this.transcribeWithOpenAI(audioBuffer, options);

      case 'google-cloud':
        return await this.transcribeWithGoogle(audioBuffer, options);

      case 'custom':
        if (!this.config.customProvider) {
          throw new Error('Custom provider not configured');
        }
        return await this.config.customProvider.transcribe(audioBuffer, options);

      default:
        throw new Error(`STT provider ${provider} not supported for transcription`);
    }
  }

  /**
   * Synthesize text to speech
   */
  async synthesize(
    text: string,
    options?: {
      voiceId?: string;
      provider?: VoiceProvider;
      speed?: number;
      pitch?: number;
    }
  ): Promise<SynthesisResult> {
    const provider = options?.provider || this.config.ttsProvider;
    const voiceId = options?.voiceId || this.config.defaultVoice || 'default';

    switch (provider) {
      case 'openai-tts':
        return await this.synthesizeWithOpenAI(text, voiceId, options);

      case 'elevenlabs':
        return await this.synthesizeWithElevenLabs(text, voiceId, options);

      case 'google-cloud':
        return await this.synthesizeWithGoogle(text, voiceId, options);

      case 'custom':
        if (!this.config.customProvider) {
          throw new Error('Custom provider not configured');
        }
        return await this.config.customProvider.synthesize(text, voiceId, options);

      default:
        throw new Error(`TTS provider ${provider} not supported for synthesis`);
    }
  }

  /**
   * Create a real-time voice session
   */
  async createVoiceSession(
    options?: {
      sttProvider?: VoiceProvider;
      ttsProvider?: VoiceProvider;
      voiceId?: string;
    }
  ): Promise<VoiceSession> {
    const sessionId = this.generateSessionId();

    const session: VoiceSession = {
      id: sessionId,
      state: 'idle',
      vadState: 'silence',

      sendAudio: async (audio: AudioBuffer) => {
        if (session.state !== 'active') {
          throw new Error('Session is not active');
        }
        // Process audio through STT
        const result = await this.transcribe(audio, {
          provider: options?.sttProvider || this.config.sttProvider,
        });
        // Trigger callbacks
        transcriptionCallbacks.forEach(cb => cb(result));
      },

      onTranscription: (callback) => {
        transcriptionCallbacks.push(callback);
      },

      onSynthesis: (callback) => {
        synthesisCallbacks.push(callback);
      },

      speak: async (text: string, voiceId?: string) => {
        if (session.state !== 'active') {
          throw new Error('Session is not active');
        }
        const result = await this.synthesize(text, {
          voiceId: voiceId || options?.voiceId,
          provider: options?.ttsProvider || this.config.ttsProvider,
        });
        synthesisCallbacks.forEach(cb => cb(result));
      },

      pause: () => {
        session.state = 'paused';
      },

      resume: () => {
        session.state = 'active';
      },

      close: () => {
        session.state = 'closed';
        this.activeSessions.delete(sessionId);
      },

      getStats: () => {
        return sessionStats;
      },
    };

    // Callback arrays
    const transcriptionCallbacks: Array<(result: TranscriptionResult) => void> = [];
    const synthesisCallbacks: Array<(result: SynthesisResult) => void> = [];

    // Session stats
    const sessionStats: VoiceSessionStats = {
      duration: 0,
      audioProcessed: 0,
      transcriptionCount: 0,
      synthesisCount: 0,
      averageLatency: 0,
    };

    // Start session
    session.state = 'active';
    this.activeSessions.set(sessionId, session);

    return session;
  }

  /**
   * Set the default voice
   */
  setVoice(voiceId: string): void {
    this.config.defaultVoice = voiceId;
  }

  /**
   * Get available voices from provider
   */
  async getVoices(provider?: VoiceProvider): Promise<Voice[]> {
    const targetProvider = provider || this.config.ttsProvider;

    // Check cache first
    if (this.voiceCache.has(targetProvider)) {
      return this.voiceCache.get(targetProvider)!;
    }

    let voices: Voice[];

    switch (targetProvider) {
      case 'openai-tts':
        voices = await this.getOpenAIVoices();
        break;

      case 'elevenlabs':
        voices = await this.getElevenLabsVoices();
        break;

      case 'google-cloud':
        voices = await this.getGoogleVoices();
        break;

      case 'custom':
        if (!this.config.customProvider?.getVoices) {
          throw new Error('Custom provider does not support voice listing');
        }
        voices = await this.config.customProvider.getVoices();
        break;

      default:
        throw new Error(`Provider ${targetProvider} not supported for voice listing`);
    }

    // Cache the results
    this.voiceCache.set(targetProvider, voices);

    return voices;
  }

  /**
   * Detect voice activity in audio
   */
  async detectVoiceActivity(audio: AudioBuffer): Promise<VADResult> {
    // Simple energy-based VAD implementation
    // In production, you'd use a more sophisticated algorithm
    const data = new Float32Array(audio.data as ArrayBuffer);

    // Calculate RMS energy
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data[i] * data[i];
    }
    const rms = Math.sqrt(sum / data.length);

    // Apply sensitivity threshold
    const threshold = 0.01 * (this.config.vadSensitivity || 0.5);
    const isSpeech = rms > threshold;

    return {
      isSpeech,
      confidence: Math.min(rms / threshold, 1.0),
    };
  }

  /**
   * Convert audio format
   */
  async convertAudioFormat(
    audio: AudioBuffer,
    targetFormat: AudioFormat
  ): Promise<AudioBuffer> {
    if (audio.format === targetFormat) {
      return audio;
    }

    // In a real implementation, you'd use a library like ffmpeg or web audio API
    // For now, return a placeholder
    throw new Error('Audio format conversion not implemented. Use a library like ffmpeg.');
  }

  /**
   * Clean up resources
   */
  async destroy(): Promise<void> {
    // Close all active sessions
    const sessions = Array.from(this.activeSessions.values());
    for (const session of sessions) {
      session.close();
    }
    this.activeSessions.clear();
    this.voiceCache.clear();
  }

  // ============================================================================
  // Private Methods - Provider Implementations
  // ============================================================================

  private validateProviders(): void {
    // Validate STT provider
    if (!this.config.sttProvider) {
      throw new Error('STT provider is required');
    }

    // Validate TTS provider
    if (!this.config.ttsProvider) {
      throw new Error('TTS provider is required');
    }

    // Validate API keys
    if (this.config.sttProvider === 'openai-whisper' || this.config.ttsProvider === 'openai-tts') {
      if (!this.config.apiKeys?.openai && !this.ranaConfig?.providers?.openai) {
        throw new Error('OpenAI API key is required');
      }
    }

    if (this.config.ttsProvider === 'elevenlabs') {
      if (!this.config.apiKeys?.elevenlabs) {
        throw new Error('ElevenLabs API key is required');
      }
    }

    if (this.config.sttProvider === 'google-cloud' || this.config.ttsProvider === 'google-cloud') {
      if (!this.config.apiKeys?.google && !this.ranaConfig?.providers?.google) {
        throw new Error('Google Cloud API key is required');
      }
    }
  }

  private async initializeProviders(): Promise<void> {
    // Initialize provider connections if needed
    // This is where you'd set up websockets, authenticate, etc.
  }

  private async transcribeWithOpenAI(
    audio: AudioBuffer,
    options?: any
  ): Promise<TranscriptionResult> {
    const apiKey = this.config.apiKeys?.openai || this.ranaConfig?.providers?.openai;

    // Convert audio to proper format for OpenAI (mp3, wav, webm, etc.)
    const formData = new FormData();
    let audioData: Uint8Array;
    if (audio.data instanceof Uint8Array) {
      audioData = audio.data;
    } else if (audio.data instanceof ArrayBuffer) {
      audioData = new Uint8Array(audio.data);
    } else {
      // Node.js Buffer
      audioData = new Uint8Array(audio.data as any);
    }
    const blob = new Blob([audioData], { type: audio.mimeType || 'audio/wav' });
    formData.append('file', blob, `audio.${audio.format}`);
    formData.append('model', 'whisper-1');

    if (options?.language) {
      formData.append('language', options.language);
    }
    if (options?.prompt) {
      formData.append('prompt', options.prompt);
    }

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`OpenAI Whisper API error: ${response.statusText}`);
    }

    const data = await response.json() as { text: string; language?: string; duration?: number };

    return {
      text: data.text,
      language: data.language,
      duration: data.duration,
      provider: 'openai-whisper',
      raw: data,
    };
  }

  private async transcribeWithGoogle(
    audio: AudioBuffer,
    options?: any
  ): Promise<TranscriptionResult> {
    const apiKey = this.config.apiKeys?.google || this.ranaConfig?.providers?.google;

    // Google Cloud Speech-to-Text implementation
    // This is a placeholder - implement with @google-cloud/speech
    throw new Error('Google Cloud Speech transcription not fully implemented');
  }

  private async synthesizeWithOpenAI(
    text: string,
    voiceId: string,
    options?: any
  ): Promise<SynthesisResult> {
    const apiKey = this.config.apiKeys?.openai || this.ranaConfig?.providers?.openai;

    // OpenAI voices: alloy, echo, fable, onyx, nova, shimmer
    const validVoices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
    const voice = validVoices.includes(voiceId) ? voiceId : 'alloy';

    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text,
        voice: voice,
        speed: options?.speed || 1.0,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI TTS API error: ${response.statusText}`);
    }

    const audioData = await response.arrayBuffer();

    return {
      audio: {
        data: new Uint8Array(audioData),
        format: 'mp3',
        sampleRate: 24000,
        channels: 1,
        mimeType: 'audio/mpeg',
      },
      voiceId: voice,
      duration: 0, // Would need to calculate from audio
      provider: 'openai-tts',
    };
  }

  private async synthesizeWithElevenLabs(
    text: string,
    voiceId: string,
    options?: any
  ): Promise<SynthesisResult> {
    const apiKey = this.config.apiKeys?.elevenlabs;

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'xi-api-key': apiKey!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.statusText}`);
    }

    const audioData = await response.arrayBuffer();

    return {
      audio: {
        data: new Uint8Array(audioData),
        format: 'mp3',
        sampleRate: 44100,
        channels: 1,
        mimeType: 'audio/mpeg',
      },
      voiceId,
      duration: 0, // Would need to calculate from audio
      provider: 'elevenlabs',
    };
  }

  private async synthesizeWithGoogle(
    text: string,
    voiceId: string,
    options?: any
  ): Promise<SynthesisResult> {
    // Google Cloud Text-to-Speech implementation
    // This is a placeholder - implement with @google-cloud/text-to-speech
    throw new Error('Google Cloud TTS not fully implemented');
  }

  private async getOpenAIVoices(): Promise<Voice[]> {
    // OpenAI has predefined voices
    return [
      {
        id: 'alloy',
        name: 'Alloy',
        language: 'en-US',
        gender: 'neutral',
        provider: 'openai-tts',
      },
      {
        id: 'echo',
        name: 'Echo',
        language: 'en-US',
        gender: 'male',
        provider: 'openai-tts',
      },
      {
        id: 'fable',
        name: 'Fable',
        language: 'en-US',
        gender: 'neutral',
        provider: 'openai-tts',
      },
      {
        id: 'onyx',
        name: 'Onyx',
        language: 'en-US',
        gender: 'male',
        provider: 'openai-tts',
      },
      {
        id: 'nova',
        name: 'Nova',
        language: 'en-US',
        gender: 'female',
        provider: 'openai-tts',
      },
      {
        id: 'shimmer',
        name: 'Shimmer',
        language: 'en-US',
        gender: 'female',
        provider: 'openai-tts',
      },
    ];
  }

  private async getElevenLabsVoices(): Promise<Voice[]> {
    const apiKey = this.config.apiKeys?.elevenlabs;

    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key': apiKey!,
      },
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.statusText}`);
    }

    const data = await response.json() as { voices: any[] };

    return data.voices.map((voice: any) => ({
      id: voice.voice_id,
      name: voice.name,
      description: voice.description,
      language: voice.labels?.language || 'en',
      gender: voice.labels?.gender,
      previewUrl: voice.preview_url,
      provider: 'elevenlabs' as VoiceProvider,
      metadata: voice,
    }));
  }

  private async getGoogleVoices(): Promise<Voice[]> {
    // Google Cloud Text-to-Speech voices
    // This is a placeholder - implement with @google-cloud/text-to-speech
    throw new Error('Google Cloud voice listing not fully implemented');
  }

  private async loadAudioFromUrl(url: string): Promise<AudioBuffer> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load audio from ${url}`);
    }

    const arrayBuffer = await response.arrayBuffer();

    // Detect format from URL or content-type
    const contentType = response.headers.get('content-type') || '';
    let format: AudioFormat = 'wav';

    if (contentType.includes('mp3') || url.endsWith('.mp3')) {
      format = 'mp3';
    } else if (contentType.includes('ogg') || url.endsWith('.ogg')) {
      format = 'ogg';
    } else if (contentType.includes('webm') || url.endsWith('.webm')) {
      format = 'webm';
    }

    return {
      data: new Uint8Array(arrayBuffer),
      format,
      sampleRate: this.config.sampleRate || 16000,
      channels: 1,
      mimeType: contentType,
    };
  }

  private validateAudioBuffer(audio: AudioBuffer): void {
    if (!audio.data || audio.data.byteLength === 0) {
      throw new Error('Audio buffer is empty');
    }

    if (!audio.format) {
      throw new Error('Audio format is required');
    }

    if (!audio.sampleRate || audio.sampleRate <= 0) {
      throw new Error('Invalid sample rate');
    }
  }

  private generateSessionId(): string {
    return `voice-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// ============================================================================
// Plugin Factory
// ============================================================================

/**
 * Create a voice plugin instance
 */
export function createVoicePlugin(config: VoiceConfig): RanaPlugin {
  const voicePlugin = new VoicePlugin(config);

  return definePlugin({
    name: 'voice',
    version: '1.0.0',

    async onInit(ranaConfig: RanaConfig) {
      await voicePlugin.init(ranaConfig);
    },

    async onDestroy() {
      await voicePlugin.destroy();
    },
  });
}

/**
 * Export the voice plugin instance for direct usage
 */
export function useVoicePlugin(plugin: VoicePlugin) {
  return plugin;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create an audio buffer from raw data
 */
export function createAudioBuffer(
  data: Uint8Array | ArrayBuffer | Buffer,
  options: {
    format: AudioFormat;
    sampleRate: number;
    channels?: number;
    mimeType?: string;
  }
): AudioBuffer {
  return {
    data,
    format: options.format,
    sampleRate: options.sampleRate,
    channels: options.channels || 1,
    mimeType: options.mimeType,
  };
}

/**
 * Helper to validate voice provider API key
 */
export function validateVoiceProvider(
  provider: VoiceProvider,
  apiKeys?: VoiceConfig['apiKeys']
): boolean {
  switch (provider) {
    case 'openai-whisper':
    case 'openai-tts':
      return !!apiKeys?.openai;

    case 'elevenlabs':
      return !!apiKeys?.elevenlabs;

    case 'google-cloud':
      return !!apiKeys?.google;

    case 'custom':
      return true; // Custom providers handle their own validation

    default:
      return false;
  }
}

/**
 * Get recommended sample rate for provider
 */
export function getRecommendedSampleRate(provider: VoiceProvider): number {
  switch (provider) {
    case 'openai-whisper':
      return 16000;

    case 'openai-tts':
      return 24000;

    case 'elevenlabs':
      return 44100;

    case 'google-cloud':
      return 16000;

    default:
      return 16000;
  }
}

/**
 * Estimate audio duration from buffer size
 */
export function estimateAudioDuration(
  audio: AudioBuffer,
  bitsPerSample: number = 16
): number {
  const bytesPerSample = bitsPerSample / 8;
  const totalSamples = audio.data.byteLength / (bytesPerSample * audio.channels);
  return totalSamples / audio.sampleRate;
}

// ============================================================================
// Default Export
// ============================================================================

export default {
  createVoicePlugin,
  VoicePlugin,
  createAudioBuffer,
  validateVoiceProvider,
  getRecommendedSampleRate,
  estimateAudioDuration,
};
