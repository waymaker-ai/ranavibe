/**
 * Multi-Modal Features
 *
 * Comprehensive multi-modal AI capabilities:
 * - Image understanding and analysis
 * - Image generation and editing
 * - Audio transcription
 * - Text-to-speech synthesis
 * - Video understanding and analysis
 */

// ============================================================================
// Image Understanding
// ============================================================================

export {
  ImageUnderstanding,
  createImageUnderstanding,
  getGlobalImageUnderstanding,
  analyzeImage,
  askAboutImage,
  extractTextFromImage,
} from './image-understanding';

export type {
  BoundingBox as ImageBoundingBox,
  DetectedObject,
  SceneDescription,
  ExtractedText,
  ImageClassification,
  ImageAnalysisResult,
  VisualQAResult,
  ImageUnderstandingConfig,
  ImageInput,
} from './image-understanding';

// ============================================================================
// Image Generation
// ============================================================================

export {
  ImageGenerator,
  createImageGenerator,
  getGlobalImageGenerator,
  generateImage,
  generateSingleImage,
  editImage,
  upscaleImage,
} from './image-generation';

export type {
  ImageSize,
  ImageQuality,
  ImageStyle,
  OutputFormat,
  GeneratedImage,
  GenerationOptions,
  EditOptions,
  VariationOptions,
  UpscaleOptions,
  StyleTransferOptions,
  ImageGenerationConfig,
} from './image-generation';

// ============================================================================
// Audio Transcription
// ============================================================================

export {
  AudioTranscriber,
  RealtimeTranscriptionSession,
  createAudioTranscriber,
  getGlobalAudioTranscriber,
  transcribeAudio,
  transcribeToText,
  transcribeToSRT,
  transcribeToVTT,
} from './audio-transcription';

export type {
  AudioFormat,
  TranscriptionModel,
  Word,
  Segment,
  Speaker,
  TranscriptionResult,
  TranscriptionOptions,
  RealtimeTranscriptionOptions,
  TranscriptionEvent,
  TranscriptionEventHandler,
  AudioTranscriptionConfig,
  AudioInput,
} from './audio-transcription';

// ============================================================================
// Text-to-Speech
// ============================================================================

export {
  TextToSpeech,
  createTextToSpeech,
  getGlobalTextToSpeech,
  speak,
  speakToFile,
  getVoices,
  speakStream,
} from './text-to-speech';

export type {
  VoiceGender,
  AudioQuality as TTSAudioQuality,
  OutputAudioFormat,
  Voice,
  SpeechOptions,
  SpeechResult,
  SSMLOptions,
  VoiceCloningOptions,
  ClonedVoice,
  TextToSpeechConfig,
} from './text-to-speech';

// ============================================================================
// Video Understanding
// ============================================================================

export {
  VideoUnderstanding,
  createVideoUnderstanding,
  getGlobalVideoUnderstanding,
  analyzeVideo,
  askAboutVideo,
  searchVideo,
  summarizeVideo,
  transcribeVideo,
} from './video-understanding';

export type {
  Frame,
  BoundingBox as VideoBoundingBox,
  TrackedObject,
  Scene,
  Action,
  VideoMetadata,
  VideoAnalysisResult,
  VideoQAResult,
  VideoSearchResult,
  VideoUnderstandingConfig,
  VideoInput,
} from './video-understanding';

// ============================================================================
// Unified Multi-Modal Interface
// ============================================================================

import { ImageUnderstanding, ImageInput, ImageAnalysisResult, ImageUnderstandingConfig } from './image-understanding';
import { ImageGenerator, GeneratedImage, GenerationOptions, ImageGenerationConfig } from './image-generation';
import { AudioTranscriber, AudioInput, TranscriptionResult, AudioTranscriptionConfig } from './audio-transcription';
import { TextToSpeech, SpeechResult, SpeechOptions, TextToSpeechConfig } from './text-to-speech';
import { VideoUnderstanding, VideoInput, VideoAnalysisResult, VideoUnderstandingConfig } from './video-understanding';

export interface MultiModalConfig {
  imageUnderstanding?: ImageUnderstandingConfig;
  imageGeneration?: ImageGenerationConfig;
  audioTranscription?: AudioTranscriptionConfig;
  textToSpeech?: TextToSpeechConfig;
  videoUnderstanding?: VideoUnderstandingConfig;
}

/**
 * Unified multi-modal interface
 */
export class MultiModal {
  public readonly image: ImageUnderstanding;
  public readonly imageGen: ImageGenerator;
  public readonly audio: AudioTranscriber;
  public readonly speech: TextToSpeech;
  public readonly video: VideoUnderstanding;

  constructor(config: MultiModalConfig = {}) {
    this.image = new ImageUnderstanding(config.imageUnderstanding);
    this.imageGen = new ImageGenerator(config.imageGeneration);
    this.audio = new AudioTranscriber(config.audioTranscription);
    this.speech = new TextToSpeech(config.textToSpeech);
    this.video = new VideoUnderstanding(config.videoUnderstanding);
  }

  // --------------------------------------------------------------------------
  // Quick Access Methods
  // --------------------------------------------------------------------------

  /**
   * Analyze any media type
   */
  async analyze(
    input: ImageInput | AudioInput | VideoInput,
    type: 'image' | 'audio' | 'video'
  ): Promise<ImageAnalysisResult | TranscriptionResult | VideoAnalysisResult> {
    switch (type) {
      case 'image':
        return this.image.analyze(input as ImageInput);
      case 'audio':
        return this.audio.transcribe(input as AudioInput);
      case 'video':
        return this.video.analyze(input as VideoInput);
      default:
        throw new Error(`Unknown media type: ${type}`);
    }
  }

  /**
   * Ask a question about any media
   */
  async ask(
    input: ImageInput | VideoInput,
    question: string,
    type: 'image' | 'video'
  ): Promise<{ answer: string; confidence: number }> {
    if (type === 'image') {
      const result = await this.image.ask(input as ImageInput, question);
      return { answer: result.answer, confidence: result.confidence };
    } else {
      const result = await this.video.ask(input as VideoInput, question);
      return { answer: result.answer, confidence: result.confidence };
    }
  }

  /**
   * Generate image from text
   */
  async generateImage(
    prompt: string,
    options?: GenerationOptions
  ): Promise<GeneratedImage> {
    const results = await this.imageGen.generate(prompt, { ...options, n: 1 });
    return results[0];
  }

  /**
   * Convert text to speech
   */
  async textToSpeech(
    text: string,
    options?: SpeechOptions
  ): Promise<SpeechResult> {
    return this.speech.synthesize(text, options);
  }

  /**
   * Transcribe audio to text
   */
  async speechToText(audio: AudioInput): Promise<string> {
    const result = await this.audio.transcribe(audio);
    return result.text;
  }

  /**
   * Extract text from image (OCR)
   */
  async imageToText(image: ImageInput): Promise<string> {
    const texts = await this.image.extractText(image);
    return texts.map((t) => t.text).join('\n');
  }

  /**
   * Summarize video content
   */
  async summarizeVideo(video: VideoInput): Promise<string> {
    return this.video.summarize(video);
  }

  // --------------------------------------------------------------------------
  // Cross-Modal Operations
  // --------------------------------------------------------------------------

  /**
   * Describe an image in speech
   */
  async describeImageAsSpeech(
    image: ImageInput,
    options?: {
      voice?: string;
      detailed?: boolean;
    }
  ): Promise<SpeechResult> {
    const analysis = await this.image.analyze(image);
    const description = options?.detailed
      ? this.generateDetailedDescription(analysis)
      : analysis.scene.summary;

    return this.speech.synthesize(description, { voice: options?.voice });
  }

  /**
   * Generate image from speech
   */
  async generateImageFromSpeech(
    audio: AudioInput,
    options?: GenerationOptions
  ): Promise<GeneratedImage> {
    const text = await this.speechToText(audio);
    return this.generateImage(text, options);
  }

  /**
   * Create video transcript with audio
   */
  async createVideoTranscriptAudio(
    video: VideoInput,
    options?: {
      voice?: string;
      includeTimestamps?: boolean;
    }
  ): Promise<SpeechResult> {
    const transcript = await this.video.transcribe(video);

    const text = options?.includeTimestamps
      ? transcript // Would format with timestamps
      : transcript;

    return this.speech.synthesize(text, { voice: options?.voice });
  }

  // --------------------------------------------------------------------------
  // Helper Methods
  // --------------------------------------------------------------------------

  private generateDetailedDescription(analysis: ImageAnalysisResult): string {
    const parts: string[] = [];

    // Scene description
    if (analysis.scene.summary) {
      parts.push(analysis.scene.summary);
    }

    // Objects
    if (analysis.objects.length > 0) {
      const objectLabels = analysis.objects.map((o) => o.label);
      parts.push(`The image contains: ${objectLabels.join(', ')}.`);
    }

    // Text
    if (analysis.text.length > 0) {
      parts.push(`Visible text includes: "${analysis.text.map((t) => t.text).join('", "')}".`);
    }

    return parts.join(' ');
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createMultiModal(config?: MultiModalConfig): MultiModal {
  return new MultiModal(config);
}

// ============================================================================
// Convenience Export
// ============================================================================

let globalMultiModal: MultiModal | null = null;

export function getGlobalMultiModal(): MultiModal {
  if (!globalMultiModal) {
    globalMultiModal = createMultiModal();
  }
  return globalMultiModal;
}
