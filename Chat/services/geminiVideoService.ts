/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Placeholder implementation to detach from @google/genai frontend dependency
// TODO: Move video generation logic to backend (/api/vision/generate-video)

import {GenerateVideoParams} from '../components/iris/types';

// Mock types to satisfy TypeScript
type Video = any; 

export const generateVideo = async (
  params: GenerateVideoParams,
  apiKey: string
): Promise<{objectUrl: string; blob: Blob; uri: string; video: Video}> => {
  console.log('Video generation temporarily disabled during architecture migration.');
  
  // Throwing error to inform UI
  throw new Error(
    'Video generation is currently undergoing maintenance. Please try again later.'
  );
};
