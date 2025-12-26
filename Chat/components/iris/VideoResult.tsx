
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useRef } from 'react';
// Added FilmIcon to the import list from './icons'
import { ArrowPathIcon, DownloadIcon, FilmIcon, PlayIcon, PlusIcon, SparklesIcon } from './icons';

interface VideoResultProps {
  videoUrl: string;
  onRetry: () => void;
  onNewVideo: () => void;
  onExtend: () => void;
  canExtend: boolean;
}

const VideoResult: React.FC<VideoResultProps> = ({
  videoUrl,
  onRetry,
  onNewVideo,
  onExtend,
  canExtend,
}) => {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Extract thumbnail from video
  useEffect(() => {
    if (!videoUrl) return;

    const video = document.createElement('video');
    video.src = videoUrl;
    video.preload = 'metadata';
    video.muted = true;
    
    // Seek to 0.2s for a meaningful frame
    video.currentTime = 0.2;

    const handleSeeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          setThumbnailUrl(canvas.toDataURL('image/jpeg', 0.8));
        }
      } catch (err) {
        console.warn('Could not generate thumbnail', err);
      }
      video.removeEventListener('seeked', handleSeeked);
    };

    video.addEventListener('seeked', handleSeeked);
    
    // Cleanup
    return () => {
      video.removeEventListener('seeked', handleSeeked);
      video.src = '';
      video.load();
    };
  }, [videoUrl]);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = videoUrl;
    link.download = `veo-video-${Date.now()}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const startPlayback = () => {
    setIsPlaying(true);
    // Auto-play the video when the user clicks the thumbnail
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.play();
      }
    }, 50);
  };

  return (
    <div className="w-full flex flex-col items-center gap-8 p-8 bg-gray-900/40 rounded-3xl border border-gray-800 shadow-2xl backdrop-blur-sm">
      <div className="flex flex-col items-center text-center gap-2">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-teal-400 to-indigo-400 bg-clip-text text-transparent">
          Creation Complete
        </h2>
        <p className="text-gray-400 text-sm">Your vision has been brought to life.</p>
      </div>

      <div className="w-full max-w-2xl aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl border border-gray-700/50 relative group cursor-pointer">
        {!isPlaying ? (
          <div 
            onClick={startPlayback}
            className="w-full h-full relative"
          >
            {thumbnailUrl ? (
              <img 
                src={thumbnailUrl} 
                alt="Video thumbnail" 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full bg-gray-800 animate-pulse flex items-center justify-center">
                <FilmIcon className="w-12 h-12 text-gray-700" />
              </div>
            )}
            
            {/* Cinematic Overlay */}
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <div className="w-20 h-20 bg-indigo-600/90 rounded-full flex items-center justify-center text-white shadow-xl transform transition-all duration-300 group-hover:scale-110 group-active:scale-95 group-hover:bg-indigo-500">
                <PlayIcon className="w-10 h-10 ml-1" />
              </div>
            </div>

            {/* Ready Badge */}
            <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-black/60 backdrop-blur-md border border-white/10 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/90">Ready to Play</span>
            </div>
          </div>
        ) : (
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            loop
            className="w-full h-full object-contain"
            autoPlay
          />
        )}
      </div>

      <div className="flex flex-wrap justify-center gap-4 w-full">
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-200 font-semibold rounded-xl border border-gray-700 transition-all hover:shadow-lg hover:-translate-y-0.5"
          title="Regenerate with same settings">
          <ArrowPathIcon className="w-5 h-5" />
          Retry
        </button>
        
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-6 py-3 bg-teal-600/20 hover:bg-teal-600 text-teal-400 hover:text-white font-semibold rounded-xl border border-teal-500/30 transition-all hover:shadow-lg hover:-translate-y-0.5"
          title="Save video to your device">
          <DownloadIcon className="w-5 h-5" />
          Download
        </button>

        {canExtend && (
          <button
            onClick={onExtend}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white font-semibold rounded-xl border border-indigo-500/30 transition-all hover:shadow-lg hover:-translate-y-0.5"
            title="Add 7 seconds to this video">
            <SparklesIcon className="w-5 h-5" />
            Extend
          </button>
        )}
        
        <button
          onClick={onNewVideo}
          className="flex items-center gap-2 px-6 py-3 bg-white text-black hover:bg-gray-200 font-semibold rounded-xl transition-all hover:shadow-lg hover:-translate-y-0.5"
          title="Start a new generation from scratch">
          <PlusIcon className="w-5 h-5" />
          New Video
        </button>
      </div>
    </div>
  );
};

export default VideoResult;
