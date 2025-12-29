import { useState, useEffect, useRef } from 'react';

type ProgressStatus = 'idle' | 'generating' | 'ready' | 'error';

export const useSimulatedProgress = (status: ProgressStatus) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (status === 'generating') {
      // Start from 0 if not already started
      setProgress((prev) => (prev === 100 ? 0 : prev));

      interval = setInterval(() => {
        setProgress((prev) => {
            // Fast at first, then slower as it reaches 90%
            if (prev >= 90) return prev;
            const increment = prev < 50 ? 5 : prev < 80 ? 2 : 1;
            return Math.min(prev + increment, 90);
        });
      }, 500);

    } else if (status === 'ready') {
      // Jump to 100%
      setProgress(100);
    } else if (status === 'error') {
      // Keep as is or handle differently
    }

    return () => clearInterval(interval);
  }, [status]);

  return progress;
};
