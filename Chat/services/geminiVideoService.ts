/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Placeholder implementation to detach from @google/genai frontend dependency
// TODO: Move video generation logic to backend (/api/vision/generate-video)

import {GenerateVideoParams} from '../components/iris/types';
import { API_BASE_URL } from '../src/config';
import { getAuthHeaders } from './userService';



// Mock types needed by consumers
type Video = any; 

export const generateVideo = async (
  params: GenerateVideoParams,
  apiKey: string // Ignored, backend uses env var
): Promise<{objectUrl: string; blob: Blob; uri: string; video: Video}> => {
  console.log('Sending video generation request to backend...');
  
  try {
    const res = await fetch(`${API_BASE_URL}/api/vision/generate-video`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
        },
        body: JSON.stringify({ params })
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Video generation failed');
    }

    const data = await res.json();
    
    // Data contains videoBase64 and uri
    const byteCharacters = atob(data.videoBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], {type: 'video/mp4'});
    const objectUrl = URL.createObjectURL(blob);

    return {
        objectUrl,
        blob,
        uri: data.uri,
        video: { uri: data.uri }
    };

  } catch (e: any) {
    console.error('Backend video gen failed:', e);
    throw e;
  }
};
