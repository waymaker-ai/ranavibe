'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Image, Mic, Volume2, Video, Layers, Eye } from 'lucide-react';

const features = [
  {
    icon: Eye,
    title: 'Image Understanding',
    description: 'Analyze images with object detection, scene understanding, OCR, and visual Q&A',
    code: `import { analyzeImage, askAboutImage, extractTextFromImage } from '@rana/core';

// Comprehensive image analysis
const analysis = await analyzeImage(imageUrl, {
  features: ['objects', 'scene', 'text', 'classification']
});

console.log(analysis.objects);    // Detected objects with bounding boxes
console.log(analysis.scene);      // Scene description, lighting, mood
console.log(analysis.text);       // Extracted text (OCR)
console.log(analysis.classifications); // Image categories

// Visual Q&A
const answer = await askAboutImage(imageUrl, "What color is the car?");
console.log(answer.answer);       // "The car is red"
console.log(answer.confidence);   // 0.95`,
  },
  {
    icon: Image,
    title: 'Image Generation',
    description: 'Generate, edit, and transform images with AI',
    code: `import { generateImage, editImage, upscaleImage } from '@rana/core';

// Generate from text
const images = await generateImage("A sunset over mountains", {
  size: '1024x1024',
  quality: 'hd',
  style: 'photorealistic'
});

// Edit existing image
const edited = await editImage(imageBuffer, {
  prompt: "Add a rainbow in the sky",
  mask: maskBuffer
});

// Upscale image
const upscaled = await upscaleImage(imageBuffer, { scale: 4 });`,
  },
  {
    icon: Mic,
    title: 'Audio Transcription',
    description: 'Convert speech to text with speaker diarization and timestamps',
    code: `import {
  transcribeAudio,
  transcribeToSRT,
  transcribeToVTT
} from '@rana/core';

// Basic transcription
const result = await transcribeAudio(audioFile, {
  language: 'en',
  enableDiarization: true,  // Identify speakers
  enableTimestamps: true
});

console.log(result.text);         // Full transcription
console.log(result.segments);     // Timestamped segments
console.log(result.speakers);     // Speaker information

// Export formats
const srt = await transcribeToSRT(audioFile);  // SubRip format
const vtt = await transcribeToVTT(audioFile);  // WebVTT format`,
  },
  {
    icon: Volume2,
    title: 'Text-to-Speech',
    description: 'Convert text to natural-sounding speech with multiple voices',
    code: `import { speak, getVoices, speakStream } from '@rana/core';

// List available voices
const voices = await getVoices();
// [{ id: 'alloy', name: 'Alloy', gender: 'neutral' }, ...]

// Generate speech
const audio = await speak("Hello, welcome to RANA!", {
  voice: 'nova',
  speed: 1.0,
  format: 'mp3'
});

// Stream for real-time playback
const stream = await speakStream(longText, { voice: 'echo' });

// SSML support for fine control
const ssml = tts.textToSSML("Hello", {
  rate: 'slow',
  pitch: 'high'
});`,
  },
  {
    icon: Video,
    title: 'Video Understanding',
    description: 'Analyze videos with scene detection, object tracking, and temporal Q&A',
    code: `import {
  analyzeVideo,
  askAboutVideo,
  summarizeVideo,
  searchVideo
} from '@rana/core';

// Full video analysis
const analysis = await analyzeVideo(videoFile, {
  features: ['scenes', 'objects', 'actions', 'transcript']
});

console.log(analysis.scenes);     // Scene boundaries and descriptions
console.log(analysis.objects);    // Tracked objects with trajectories
console.log(analysis.actions);    // Detected activities
console.log(analysis.keyMoments); // Important timestamps

// Ask questions about video
const answer = await askAboutVideo(videoFile, "When does the speaker mention AI?");
console.log(answer.relevantTimestamps);

// Search within video
const results = await searchVideo(videoFile, "person walking");`,
  },
  {
    icon: Layers,
    title: 'Unified Multi-Modal',
    description: 'Work with all modalities through a single interface',
    code: `import { createMultiModal } from '@rana/core';

const mm = createMultiModal({
  imageUnderstanding: { provider: 'openai' },
  imageGeneration: { provider: 'openai' },
  audioTranscription: { provider: 'openai' },
  textToSpeech: { provider: 'openai' },
  videoUnderstanding: { provider: 'google' }
});

// Analyze any media
const imageAnalysis = await mm.analyze(imageUrl, 'image');
const audioResult = await mm.analyze(audioFile, 'audio');

// Cross-modal operations
const speech = await mm.describeImageAsSpeech(imageUrl);
const image = await mm.generateImageFromSpeech(audioFile);`,
  },
];

export default function MultiModalPage() {
  return (
    <div className="py-16 md:py-24">
      <div className="container-wide">
        <Link
          href="/docs"
          className="inline-flex items-center text-sm text-foreground-secondary hover:text-foreground mb-8"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Documentation
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-gradient-subtle">
              <Layers className="h-8 w-8" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold">Multi-Modal Features</h1>
          </div>
          <p className="text-lg text-foreground-secondary">
            Work with images, audio, and video using a unified API. Analyze, generate,
            and transform content across all modalities.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="space-y-12">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 rounded-lg bg-gradient-subtle">
                  <feature.icon className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2">{feature.title}</h2>
                  <p className="text-foreground-secondary">{feature.description}</p>
                </div>
              </div>
              <div className="code-block font-mono text-sm overflow-x-auto">
                <pre>{feature.code}</pre>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Supported Providers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-16 card"
        >
          <h2 className="text-2xl font-bold mb-6">Supported Providers</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Image Understanding</h3>
              <ul className="text-sm text-foreground-secondary space-y-1">
                <li>OpenAI (GPT-4 Vision)</li>
                <li>Anthropic (Claude)</li>
                <li>Google (Gemini)</li>
                <li>Hugging Face</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Image Generation</h3>
              <ul className="text-sm text-foreground-secondary space-y-1">
                <li>OpenAI (DALL-E 3)</li>
                <li>Stability AI</li>
                <li>Midjourney</li>
                <li>Hugging Face</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Audio/Speech</h3>
              <ul className="text-sm text-foreground-secondary space-y-1">
                <li>OpenAI (Whisper, TTS)</li>
                <li>Deepgram</li>
                <li>AssemblyAI</li>
                <li>ElevenLabs</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
