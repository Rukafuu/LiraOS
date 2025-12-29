import { useState, useEffect, useRef } from 'react';

interface UseSimulatedProgressOptions {
  status: 'idle' | 'generating' | 'ready' | 'error';
  duration?: number; // Duration to reach 90% in ms
  finalDuration?: number; // Duration from 90% to 100% in ms
}

export function useSimulatedProgress({
  status,
  duration = 8000,
  finalDuration = 500
}: UseSimulatedProgressOptions) {
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (status === 'generating') {
      // Reset and start progress
      setProgress(0);
      startTimeRef.current = Date.now();

      // Easing function for smooth progress (ease-out)
      const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

      intervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        const t = Math.min(elapsed / duration, 1);
        const easedProgress = easeOut(t);
        
        // Progress from 0 to 90%
        const newProgress = Math.min(easedProgress * 90, 90);
        setProgress(newProgress);

        if (newProgress >= 90) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
        }
      }, 50);
    } else if (status === 'ready') {
      // Jump to 100% smoothly
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      const startProgress = progress;
      const startTime = Date.now();

      intervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const t = Math.min(elapsed / finalDuration, 1);
        const newProgress = startProgress + (100 - startProgress) * t;
        
        setProgress(newProgress);

        if (newProgress >= 100) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          setProgress(100);
        }
      }, 16);
    } else if (status === 'error' || status === 'idle') {
      // Reset
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      setProgress(0);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [status, duration, finalDuration]);

  return progress;
}
