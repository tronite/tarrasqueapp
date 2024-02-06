'use client';

import { config } from './config';

interface Props {
  src: string;
  width?: number;
  quality?: number;
}

/**
 * Supabase storage image loader for Next.js Image component
 * @param src - The image path
 * @param width - The image width
 * @param quality - The image quality (default: 75)
 * @returns The transformed image URL
 */
export function supabaseLoader({ src, width, quality }: Props) {
  return `${config.SUPABASE_URL}/storage/v1/render/image/public/tarrasqueapp/${src}?width=${width || 0}&quality=${
    quality || 75
  }`;
}
