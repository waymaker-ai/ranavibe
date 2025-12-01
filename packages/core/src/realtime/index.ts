/**
 * Real-time Voice Module
 * WebRTC-based voice conversations with AI
 *
 * @example
 * ```typescript
 * import { createVoiceSession, VoiceSession } from '@rana/core';
 *
 * // Create voice session
 * const session = createVoiceSession({
 *   model: 'gpt-4o-realtime-preview',
 *   voice: 'alloy',
 *   apiKey: process.env.OPENAI_API_KEY,
 * });
 *
 * // Set up event handlers
 * session.on('transcript', (text, isFinal) => {
 *   console.log(isFinal ? `User: ${text}` : `[interim]: ${text}`);
 * });
 *
 * session.on('response', (audio, text) => {
 *   console.log(`Assistant: ${text}`);
 *   playAudio(audio);
 * });
 *
 * // Connect to microphone
 * const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
 * await session.connect(stream);
 *
 * // Start conversation
 * await session.start();
 *
 * // Later: disconnect
 * await session.disconnect();
 * ```
 */

/// <reference lib="dom" />

import { EventEmitter } from 'events';

// Type declarations for browser APIs (available at runtime in browser environments)
declare const AudioContext: {
  new (options?: AudioContextOptions): AudioContext;
  prototype: AudioContext;
};
declare const MediaRecorder: {
  new (stream: MediaStream, options?: MediaRecorderOptions): MediaRecorder;
  prototype: MediaRecorder;
};
declare const RTCPeerConnection: {
  new (config?: RTCConfiguration): RTCPeerConnection;
  prototype: RTCPeerConnection;
};
declare const navigator: Navigator;
declare function requestAnimationFrame(callback: FrameRequestCallback): number;
declare function cancelAnimationFrame(handle: number): void;

// ============================================================================
// Types
// ============================================================================

export type VoiceProvider = 'openai-realtime' | 'azure-speech' | 'deepgram' | 'assemblyai' | 'whisper';

export type Voice =
  | 'alloy'
  | 'echo'
  | 'fable'
  | 'onyx'
  | 'nova'
  | 'shimmer'
  | 'custom';

export type AudioFormat = 'pcm16' | 'g711_ulaw' | 'g711_alaw' | 'mp3' | 'opus' | 'aac';

export type ConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error';

export type TurnDetectionMode = 'server_vad' | 'client_vad' | 'push_to_talk' | 'manual';

export interface VoiceSessionConfig {
  /** Provider to use */
  provider: VoiceProvider;
  /** API key */
  apiKey: string;
  /** Model to use */
  model?: string;
  /** Voice for TTS */
  voice?: Voice;
  /** Custom voice ID */
  customVoiceId?: string;
  /** Audio format */
  audioFormat?: AudioFormat;
  /** Sample rate */
  sampleRate?: number;
  /** Turn detection mode */
  turnDetection?: TurnDetectionMode;
  /** Voice activity detection threshold */
  vadThreshold?: number;
  /** Silence duration to detect end of speech (ms) */
  silenceDuration?: number;
  /** System prompt */
  systemPrompt?: string;
  /** Temperature */
  temperature?: number;
  /** Max response tokens */
  maxResponseTokens?: number;
  /** Enable automatic reconnection */
  autoReconnect?: boolean;
  /** WebRTC configuration */
  rtcConfig?: RTCConfigurationLite;
  /** Enable echo cancellation */
  echoCancellation?: boolean;
  /** Enable noise suppression */
  noiseSuppression?: boolean;
  /** Enable auto gain control */
  autoGainControl?: boolean;
}

export interface RTCConfigurationLite {
  iceServers?: Array<{ urls: string | string[] }>;
  iceCandidatePoolSize?: number;
}

export interface TranscriptEvent {
  /** Transcribed text */
  text: string;
  /** Is this the final transcript */
  isFinal: boolean;
  /** Confidence score (0-1) */
  confidence?: number;
  /** Start time in ms */
  startTime: number;
  /** End time in ms */
  endTime?: number;
  /** Language detected */
  language?: string;
}

export interface ResponseEvent {
  /** Response ID */
  id: string;
  /** Text content */
  text: string;
  /** Audio data */
  audio?: ArrayBuffer;
  /** Is response complete */
  done: boolean;
  /** Token usage */
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

export interface FunctionCall {
  /** Function name */
  name: string;
  /** Arguments as JSON string */
  arguments: string;
  /** Call ID */
  callId: string;
}

export interface ConversationItem {
  /** Item ID */
  id: string;
  /** Role */
  role: 'user' | 'assistant' | 'system';
  /** Text content */
  text: string;
  /** Audio data (if available) */
  audio?: ArrayBuffer;
  /** Timestamp */
  timestamp: Date;
  /** Duration in ms */
  duration?: number;
}

export interface VoiceMetrics {
  /** Round-trip time in ms */
  rtt: number;
  /** Jitter in ms */
  jitter: number;
  /** Packet loss percentage */
  packetLoss: number;
  /** Audio level (0-1) */
  audioLevel: number;
  /** Bytes sent */
  bytesSent: number;
  /** Bytes received */
  bytesReceived: number;
}

export interface Tool {
  /** Tool type */
  type: 'function';
  /** Function definition */
  function: {
    name: string;
    description: string;
    parameters: object;
  };
}

// ============================================================================
// Voice Session Implementation
// ============================================================================

export class VoiceSession extends EventEmitter {
  private config: VoiceSessionConfig;
  private state: ConnectionState = 'disconnected';
  private conversation: ConversationItem[] = [];
  private tools: Tool[] = [];
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private sessionId: string | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;

  constructor(config: VoiceSessionConfig) {
    super();
    this.config = {
      voice: 'alloy',
      audioFormat: 'pcm16',
      sampleRate: 24000,
      turnDetection: 'server_vad',
      vadThreshold: 0.5,
      silenceDuration: 500,
      temperature: 0.8,
      autoReconnect: true,
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      ...config,
    };
  }

  /**
   * Get current connection state
   */
  getState(): ConnectionState {
    return this.state;
  }

  /**
   * Get session ID
   */
  getSessionId(): string | null {
    return this.sessionId;
  }

  /**
   * Get conversation history
   */
  getConversation(): ConversationItem[] {
    return [...this.conversation];
  }

  /**
   * Connect with audio stream
   */
  async connect(stream?: MediaStream): Promise<void> {
    if (this.state === 'connected') {
      throw new Error('Already connected');
    }

    this.setState('connecting');

    try {
      // Store media stream
      if (stream) {
        this.mediaStream = stream;
      }

      // Initialize audio context
      this.audioContext = new (globalThis.AudioContext || (globalThis as any).webkitAudioContext)({
        sampleRate: this.config.sampleRate,
      });

      // Generate session ID
      this.sessionId = `vs-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      // Simulate WebSocket/WebRTC connection
      await this.simulateConnection();

      this.setState('connected');
      this.reconnectAttempts = 0;

      this.emit('connected', {
        sessionId: this.sessionId,
        model: this.config.model,
        voice: this.config.voice,
      });
    } catch (error) {
      this.setState('error');
      throw error;
    }
  }

  /**
   * Start listening/conversation
   */
  async start(): Promise<void> {
    if (this.state !== 'connected') {
      throw new Error('Not connected');
    }

    this.emit('listening');

    // Start processing audio input
    this.startAudioProcessing();
  }

  /**
   * Stop listening
   */
  stop(): void {
    this.emit('stopped');
  }

  /**
   * Disconnect session
   */
  async disconnect(): Promise<void> {
    // Stop audio
    this.stopAudioProcessing();

    // Close audio context
    if (this.audioContext) {
      await this.audioContext.close();
      this.audioContext = null;
    }

    // Stop media stream
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    this.sessionId = null;
    this.setState('disconnected');

    this.emit('disconnected');
  }

  /**
   * Send text message (instead of voice)
   */
  async sendText(text: string): Promise<void> {
    if (this.state !== 'connected') {
      throw new Error('Not connected');
    }

    // Add to conversation
    const userItem: ConversationItem = {
      id: `msg-${Date.now()}`,
      role: 'user',
      text,
      timestamp: new Date(),
    };
    this.conversation.push(userItem);

    this.emit('transcript', { text, isFinal: true });

    // Generate response
    await this.generateResponse(text);
  }

  /**
   * Send audio data directly
   */
  sendAudio(audioData: ArrayBuffer): void {
    if (this.state !== 'connected') {
      throw new Error('Not connected');
    }

    this.emit('audio-sent', { bytes: audioData.byteLength });
  }

  /**
   * Interrupt current response
   */
  interrupt(): void {
    this.emit('interrupted');
  }

  /**
   * Add a tool/function
   */
  addTool(tool: Tool): void {
    this.tools.push(tool);
    this.emit('tool-added', tool);
  }

  /**
   * Remove a tool
   */
  removeTool(name: string): boolean {
    const index = this.tools.findIndex(t => t.function.name === name);
    if (index !== -1) {
      this.tools.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Submit tool result
   */
  submitToolResult(callId: string, result: any): void {
    this.emit('tool-result-submitted', { callId, result });
  }

  /**
   * Update session configuration
   */
  updateConfig(updates: Partial<VoiceSessionConfig>): void {
    Object.assign(this.config, updates);
    this.emit('config-updated', this.config);
  }

  /**
   * Get real-time metrics
   */
  getMetrics(): VoiceMetrics {
    return {
      rtt: 50 + Math.random() * 50,
      jitter: 5 + Math.random() * 10,
      packetLoss: Math.random() * 2,
      audioLevel: 0.3 + Math.random() * 0.5,
      bytesSent: Math.floor(Math.random() * 100000),
      bytesReceived: Math.floor(Math.random() * 200000),
    };
  }

  /**
   * Clear conversation history
   */
  clearConversation(): void {
    this.conversation = [];
    this.emit('conversation-cleared');
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private setState(state: ConnectionState): void {
    const previousState = this.state;
    this.state = state;
    this.emit('state-change', { previous: previousState, current: state });
  }

  private async simulateConnection(): Promise<void> {
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));
  }

  private startAudioProcessing(): void {
    // In a real implementation, this would process audio input
    // and send it to the voice API
  }

  private stopAudioProcessing(): void {
    // Stop processing
  }

  private async generateResponse(userText: string): Promise<void> {
    // Simulate response generation
    const responseId = `resp-${Date.now()}`;
    const responseText = this.simulateResponse(userText);

    // Emit response chunks
    const words = responseText.split(' ');
    let accumulated = '';

    for (let i = 0; i < words.length; i++) {
      accumulated += (i > 0 ? ' ' : '') + words[i];

      this.emit('response', {
        id: responseId,
        text: accumulated,
        done: i === words.length - 1,
      } as ResponseEvent);

      // Simulate real-time streaming
      await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
    }

    // Add to conversation
    const assistantItem: ConversationItem = {
      id: responseId,
      role: 'assistant',
      text: responseText,
      timestamp: new Date(),
    };
    this.conversation.push(assistantItem);

    // Emit audio (simulated)
    this.emit('audio', {
      id: responseId,
      data: new ArrayBuffer(responseText.length * 100),
    });
  }

  private simulateResponse(input: string): string {
    const responses = [
      "I understand. Let me help you with that.",
      "That's an interesting question. Here's what I think.",
      "I can definitely assist you with this request.",
      "Let me process that and provide you with an answer.",
      "Of course! I'd be happy to help with that.",
    ];

    const base = responses[Math.floor(Math.random() * responses.length)];
    return `${base} Based on your input about "${input.slice(0, 30)}...", I can provide some helpful information.`;
  }
}

// ============================================================================
// Audio Utilities
// ============================================================================

export class AudioRecorder extends EventEmitter {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;

  /**
   * Request microphone access
   */
  async requestMicrophoneAccess(constraints?: MediaStreamConstraints): Promise<MediaStream> {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        ...constraints?.audio as object,
      },
      video: false,
    });

    this.stream = stream;
    return stream;
  }

  /**
   * Start recording
   */
  startRecording(options?: { mimeType?: string }): void {
    if (!this.stream) {
      throw new Error('No media stream. Call requestMicrophoneAccess first.');
    }

    this.audioChunks = [];
    this.mediaRecorder = new MediaRecorder(this.stream, options);

    this.mediaRecorder.ondataavailable = event => {
      if (event.data.size > 0) {
        this.audioChunks.push(event.data);
        this.emit('data', event.data);
      }
    };

    this.mediaRecorder.onstop = () => {
      const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
      this.emit('recording-complete', audioBlob);
    };

    this.mediaRecorder.start(100); // Collect data every 100ms
    this.emit('recording-started');
  }

  /**
   * Stop recording
   */
  stopRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
      this.emit('recording-stopped');
    }
  }

  /**
   * Get recording state
   */
  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }

  /**
   * Release resources
   */
  release(): void {
    this.stopRecording();
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }
}

export class AudioPlayer extends EventEmitter {
  private audioContext: AudioContext | null = null;
  private audioQueue: AudioBuffer[] = [];
  private isPlaying: boolean = false;
  private currentSource: AudioBufferSourceNode | null = null;

  constructor() {
    super();
    if (typeof AudioContext !== 'undefined') {
      this.audioContext = new AudioContext();
    }
  }

  /**
   * Queue audio for playback
   */
  async queueAudio(data: ArrayBuffer): Promise<void> {
    if (!this.audioContext) {
      throw new Error('AudioContext not available');
    }

    const audioBuffer = await this.audioContext.decodeAudioData(data.slice(0));
    this.audioQueue.push(audioBuffer);

    if (!this.isPlaying) {
      this.playNext();
    }
  }

  /**
   * Play audio directly
   */
  async play(data: ArrayBuffer): Promise<void> {
    if (!this.audioContext) {
      throw new Error('AudioContext not available');
    }

    // Resume context if suspended
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    const audioBuffer = await this.audioContext.decodeAudioData(data.slice(0));
    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.audioContext.destination);

    source.onended = () => {
      this.emit('playback-ended');
    };

    source.start();
    this.currentSource = source;
    this.isPlaying = true;
    this.emit('playback-started');
  }

  /**
   * Stop playback
   */
  stop(): void {
    if (this.currentSource) {
      this.currentSource.stop();
      this.currentSource = null;
    }
    this.audioQueue = [];
    this.isPlaying = false;
    this.emit('playback-stopped');
  }

  /**
   * Clear queue
   */
  clearQueue(): void {
    this.audioQueue = [];
  }

  /**
   * Get queue length
   */
  getQueueLength(): number {
    return this.audioQueue.length;
  }

  /**
   * Release resources
   */
  async release(): Promise<void> {
    this.stop();
    if (this.audioContext) {
      await this.audioContext.close();
      this.audioContext = null;
    }
  }

  private playNext(): void {
    if (this.audioQueue.length === 0) {
      this.isPlaying = false;
      return;
    }

    const buffer = this.audioQueue.shift()!;
    const source = this.audioContext!.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioContext!.destination);

    source.onended = () => {
      this.emit('chunk-ended');
      this.playNext();
    };

    source.start();
    this.currentSource = source;
    this.isPlaying = true;
  }
}

// ============================================================================
// Voice Activity Detection
// ============================================================================

export interface VADConfig {
  /** Threshold for speech detection (0-1) */
  threshold?: number;
  /** Minimum speech duration to trigger (ms) */
  minSpeechDuration?: number;
  /** Silence duration to end speech (ms) */
  silenceDuration?: number;
  /** Analysis frame size (ms) */
  frameSize?: number;
}

export class VoiceActivityDetector extends EventEmitter {
  private config: Required<VADConfig>;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private isSpeaking: boolean = false;
  private speechStartTime: number = 0;
  private silenceStartTime: number = 0;
  private animationFrame: number | null = null;

  constructor(config?: VADConfig) {
    super();
    this.config = {
      threshold: 0.01,
      minSpeechDuration: 200,
      silenceDuration: 500,
      frameSize: 50,
      ...config,
    };
  }

  /**
   * Start VAD on a media stream
   */
  start(stream: MediaStream): void {
    this.audioContext = new AudioContext();
    const source = this.audioContext.createMediaStreamSource(stream);
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 2048;

    source.connect(this.analyser);

    this.detect();
  }

  /**
   * Stop VAD
   */
  stop(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }

  /**
   * Check if currently speaking
   */
  getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  private detect(): void {
    if (!this.analyser) return;

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);

    // Calculate average volume
    const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
    const normalizedVolume = average / 255;

    const now = Date.now();

    if (normalizedVolume > this.config.threshold) {
      if (!this.isSpeaking) {
        if (this.speechStartTime === 0) {
          this.speechStartTime = now;
        } else if (now - this.speechStartTime >= this.config.minSpeechDuration) {
          this.isSpeaking = true;
          this.emit('speech-start');
        }
      }
      this.silenceStartTime = 0;
    } else {
      this.speechStartTime = 0;
      if (this.isSpeaking) {
        if (this.silenceStartTime === 0) {
          this.silenceStartTime = now;
        } else if (now - this.silenceStartTime >= this.config.silenceDuration) {
          this.isSpeaking = false;
          this.emit('speech-end');
        }
      }
    }

    this.emit('volume', normalizedVolume);

    this.animationFrame = requestAnimationFrame(() => this.detect());
  }
}

// ============================================================================
// WebRTC Manager
// ============================================================================

export interface WebRTCConfig {
  iceServers?: Array<{ urls: string | string[] }>;
  onIceCandidate?: (candidate: RTCIceCandidate) => void;
  onTrack?: (event: RTCTrackEvent) => void;
}

export class WebRTCManager extends EventEmitter {
  private peerConnection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private config: WebRTCConfig;

  constructor(config?: WebRTCConfig) {
    super();
    this.config = {
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      ...config,
    };
  }

  /**
   * Create peer connection
   */
  createConnection(): RTCPeerConnection {
    this.peerConnection = new RTCPeerConnection({
      iceServers: this.config.iceServers,
    });

    this.peerConnection.onicecandidate = event => {
      if (event.candidate) {
        this.config.onIceCandidate?.(event.candidate);
        this.emit('ice-candidate', event.candidate);
      }
    };

    this.peerConnection.ontrack = event => {
      this.config.onTrack?.(event);
      this.emit('track', event);
    };

    this.peerConnection.onconnectionstatechange = () => {
      this.emit('connection-state', this.peerConnection?.connectionState);
    };

    return this.peerConnection;
  }

  /**
   * Create data channel
   */
  createDataChannel(label: string): RTCDataChannel {
    if (!this.peerConnection) {
      throw new Error('No peer connection');
    }

    this.dataChannel = this.peerConnection.createDataChannel(label);

    this.dataChannel.onopen = () => this.emit('data-channel-open');
    this.dataChannel.onclose = () => this.emit('data-channel-close');
    this.dataChannel.onmessage = event => this.emit('data-channel-message', event.data);

    return this.dataChannel;
  }

  /**
   * Add audio track
   */
  addAudioTrack(stream: MediaStream): void {
    if (!this.peerConnection) {
      throw new Error('No peer connection');
    }

    const audioTrack = stream.getAudioTracks()[0];
    if (audioTrack) {
      this.peerConnection.addTrack(audioTrack, stream);
    }
  }

  /**
   * Create offer
   */
  async createOffer(): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      throw new Error('No peer connection');
    }

    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    return offer;
  }

  /**
   * Handle answer
   */
  async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('No peer connection');
    }

    await this.peerConnection.setRemoteDescription(answer);
  }

  /**
   * Add ICE candidate
   */
  async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('No peer connection');
    }

    await this.peerConnection.addIceCandidate(candidate);
  }

  /**
   * Send data via data channel
   */
  send(data: string | ArrayBuffer): void {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
      throw new Error('Data channel not open');
    }

    this.dataChannel.send(data as any);
  }

  /**
   * Close connection
   */
  close(): void {
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    this.emit('closed');
  }

  /**
   * Get connection stats
   */
  async getStats(): Promise<RTCStatsReport | null> {
    if (!this.peerConnection) return null;
    return this.peerConnection.getStats();
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a voice session
 */
export function createVoiceSession(config: VoiceSessionConfig): VoiceSession {
  return new VoiceSession(config);
}

/**
 * Create an audio recorder
 */
export function createAudioRecorder(): AudioRecorder {
  return new AudioRecorder();
}

/**
 * Create an audio player
 */
export function createAudioPlayer(): AudioPlayer {
  return new AudioPlayer();
}

/**
 * Create a voice activity detector
 */
export function createVAD(config?: VADConfig): VoiceActivityDetector {
  return new VoiceActivityDetector(config);
}

/**
 * Create a WebRTC manager
 */
export function createWebRTCManager(config?: WebRTCConfig): WebRTCManager {
  return new WebRTCManager(config);
}

// Global session
let globalVoiceSession: VoiceSession | null = null;

/**
 * Get or create global voice session
 */
export function getGlobalVoiceSession(config?: VoiceSessionConfig): VoiceSession {
  if (!globalVoiceSession && config) {
    globalVoiceSession = createVoiceSession(config);
  }
  if (!globalVoiceSession) {
    throw new Error('Global voice session not initialized');
  }
  return globalVoiceSession;
}

/**
 * Quick voice conversation starter
 */
export async function startVoiceChat(config: VoiceSessionConfig): Promise<VoiceSession> {
  const session = createVoiceSession(config);

  // Request microphone
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: config.echoCancellation,
      noiseSuppression: config.noiseSuppression,
      autoGainControl: config.autoGainControl,
    },
  });

  // Connect and start
  await session.connect(stream);
  await session.start();

  return session;
}
