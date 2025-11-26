/**
 * LUKA - Multimodal AI Patterns
 * Examples for working with images, audio, video using Gemini 2.0 Flash & Gemini 3
 */

import { luka, Message, MultimodalContent } from './unified-client';

/**
 * Image Analysis with Gemini 2.0 Flash
 * Perfect for: Product descriptions, accessibility alt text, image moderation
 */
export async function analyzeImage(imageBase64: string, prompt: string) {
  const messages: Message[] = [
    {
      role: 'user',
      content: [
        { type: 'text', text: prompt },
        { type: 'image', image: imageBase64, mimeType: 'image/jpeg' },
      ],
    },
  ];

  return await luka.chat({
    model: 'gemini-2.0-flash-exp',
    messages,
    temperature: 0.4,
  });
}

/**
 * Generate Image Descriptions for E-commerce
 */
export async function generateProductDescription(productImageBase64: string) {
  return await analyzeImage(
    productImageBase64,
    'Create a compelling product description based on this image. Include features, benefits, and suggested use cases.'
  );
}

/**
 * Image Accessibility - Generate Alt Text
 */
export async function generateAltText(imageBase64: string) {
  return await analyzeImage(
    imageBase64,
    'Generate concise, descriptive alt text for this image for accessibility purposes (max 125 characters).'
  );
}

/**
 * Multi-Image Comparison
 * Use case: Compare before/after, product variations, etc.
 */
export async function compareImages(image1Base64: string, image2Base64: string) {
  const messages: Message[] = [
    {
      role: 'user',
      content: [
        { type: 'text', text: 'Compare these two images and describe the differences:' },
        { type: 'image', image: image1Base64, mimeType: 'image/jpeg' },
        { type: 'image', image: image2Base64, mimeType: 'image/jpeg' },
      ],
    },
  ];

  return await luka.chat({
    model: 'gemini-2.0-flash-exp',
    messages,
  });
}

/**
 * Video Analysis with Gemini 2.0 Flash
 * Note: Gemini can process video directly
 */
export async function analyzeVideo(videoBase64: string, question: string) {
  const messages: Message[] = [
    {
      role: 'user',
      content: [
        { type: 'text', text: question },
        { type: 'video', video: videoBase64, mimeType: 'video/mp4' },
      ],
    },
  ];

  return await luka.chat({
    model: 'gemini-2.0-flash-exp',
    messages,
    maxTokens: 2048,
  });
}

/**
 * Audio Transcription + Analysis
 */
export async function transcribeAndAnalyze(audioBase64: string) {
  const messages: Message[] = [
    {
      role: 'user',
      content: [
        { type: 'text', text: 'Transcribe this audio and provide a summary of key points.' },
        { type: 'audio', audio: audioBase64, mimeType: 'audio/mp3' },
      ],
    },
  ];

  return await luka.chat({
    model: 'gemini-2.0-flash-exp',
    messages,
  });
}

/**
 * Document + Image Analysis (Mixed Multimodal)
 * Use case: Invoice processing, form extraction, etc.
 */
export async function extractFormData(documentImageBase64: string) {
  const messages: Message[] = [
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: 'Extract all form fields and values from this document. Return as JSON.'
        },
        { type: 'image', image: documentImageBase64, mimeType: 'image/jpeg' },
      ],
    },
  ];

  return await luka.chat({
    model: 'gemini-2.0-flash-exp',
    messages,
    temperature: 0.1, // Low temperature for accuracy
  });
}

/**
 * Real-time Streaming Chat with Images
 * Use case: Interactive image Q&A
 */
export async function* chatWithImageStream(imageBase64: string, question: string) {
  const messages: Message[] = [
    {
      role: 'user',
      content: [
        { type: 'text', text: question },
        { type: 'image', image: imageBase64, mimeType: 'image/jpeg' },
      ],
    },
  ];

  yield* luka.chatStream({
    model: 'gemini-2.0-flash-exp',
    messages,
  });
}

/**
 * Spatial Understanding Example (Gemini 2.0 Flash feature)
 * Use case: Object detection, layout analysis, OCR with positioning
 */
export async function detectObjectsWithPositions(imageBase64: string) {
  const messages: Message[] = [
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: 'Detect all objects in this image and provide their approximate positions as bounding boxes (x, y, width, height). Return as JSON array.'
        },
        { type: 'image', image: imageBase64, mimeType: 'image/jpeg' },
      ],
    },
  ];

  return await luka.chat({
    model: 'gemini-2.0-flash-exp',
    messages,
    temperature: 0.2,
  });
}

/**
 * Generate Image from Text (Gemini 2.0 Flash can output images!)
 * Note: This is a placeholder - actual image generation in Gemini 2.0 Flash
 * returns multimodal output
 */
export async function generateImageDescription(prompt: string) {
  const messages: Message[] = [
    {
      role: 'user',
      content: `Generate a detailed image based on: ${prompt}`,
    },
  ];

  return await luka.chat({
    model: 'gemini-2.0-flash-exp',
    messages,
  });
}

/**
 * Utility: Convert file to base64
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Utility: Fetch image URL and convert to base64
 */
export async function imageUrlToBase64(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Example Usage in Next.js API Route
 */
export const exampleUsage = `
// app/api/analyze-image/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { analyzeImage } from '@/lib/llm/multimodal-patterns';

export async function POST(req: NextRequest) {
  const { image, prompt } = await req.json();

  const result = await analyzeImage(image, prompt);

  return NextResponse.json({
    description: result.content,
    cost: result.cost,
    tokens: result.usage.totalTokens,
  });
}

// Frontend usage:
const handleImageUpload = async (file: File) => {
  const base64 = await fileToBase64(file);

  const response = await fetch('/api/analyze-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image: base64,
      prompt: 'What is in this image?'
    })
  });

  const data = await response.json();
  console.log(data.description);
};
`;
