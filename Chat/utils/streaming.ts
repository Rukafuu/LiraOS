
/**
 * Utility functions for simulated text streaming and natural chunking.
 * Used to create a smoother reading experience for AI responses.
 */

interface StreamOptions {
  minDelay?: number;
  maxDelay?: number;
  chunkSize?: number;
}

/**
 * Splits text into natural chunks based on punctuation and length.
 * Use this to avoid breaking words or streaming character-by-character if performance is an issue.
 */
export const chunkTextNatural = (text: string, maxChunk = 120): string[] => {
  if (!text) return [];
  
  const chunks: string[] = [];
  let currentChunk = '';
  
  // Split by sentence terminators first to preserve natural pauses
  const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
  
  for (const sentence of sentences) {
    // If the sentence itself is too long, break it by commas or spaces
    if (currentChunk.length + sentence.length > maxChunk) {
        if (currentChunk) {
           chunks.push(currentChunk);
           currentChunk = '';
        }
        
        if (sentence.length > maxChunk) {
            // Hard split by comma or spaces
            const subParts = sentence.match(new RegExp(`.{1,${maxChunk}}(\\s|$)`, 'g')) || [sentence];
            chunks.push(...subParts);
        } else {
            currentChunk = sentence;
        }
    } else {
        currentChunk += sentence;
    }
  }
  
  if (currentChunk) chunks.push(currentChunk);
  
  return chunks;
};

/**
 * Simulates a stream of text by invoking a callback with delta updates.
 * Useful for smoothing out a full text response or large chunks.
 */
export const streamSimulated = async (
  fullText: string, 
  onDelta: (delta: string) => void, 
  opts: StreamOptions = {}
): Promise<void> => {
  const { minDelay = 10, maxDelay = 30, chunkSize = 3 } = opts;
  let currentIndex = 0;
  
  while (currentIndex < fullText.length) {
    // Determine randomized chunk size (jitter)
    const currentChunkSize = Math.floor(Math.random() * (chunkSize * 2)) + 1;
    const chunk = fullText.slice(currentIndex, currentIndex + currentChunkSize);
    
    if (chunk) {
        onDelta(chunk);
        currentIndex += chunk.length;
    }
    
    // Randomized delay for "typing" feel
    const delay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
    await new Promise(r => setTimeout(r, delay));
  }
};
