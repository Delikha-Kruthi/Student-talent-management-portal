import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCcw, AlertCircle, Loader2 } from 'lucide-react';

interface VideoPlayerProps {
  src: string;
  title?: string;
  autoPlay?: boolean;
  className?: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, title, autoPlay = false, className = '' }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<any>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    setCurrentTime(0);
    setIsPlaying(false);

    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setIsLoading(false);
      setError(null);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handleWaiting = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);
    const handleEnded = () => setIsPlaying(false);

    const handleError = () => {
      setIsLoading(false);
      const code = video.error ? video.error.code : 0;
      if (code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) {
        setError('Video source format unsupported or file not found.');
      } else if (code === MediaError.MEDIA_ERR_DECODE) {
        setError('Video decode error: The browser media pipeline could not render frames.');
      } else if (code === MediaError.MEDIA_ERR_NETWORK) {
        setError('Network interruption while streaming video chunks.');
      } else if (video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) {
        setError('Video source unavailable or file path missing on server.');
      } else {
        setError('Unable to load video format or stream byte ranges.');
      }
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
    };
  }, [src]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch((e) => {
        console.warn('Playback prevented:', e);
      });
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const time = parseFloat(e.target.value);
    video.currentTime = time;
    setCurrentTime(time);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (video) {
      video.volume = val;
      video.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isMuted) {
      video.muted = false;
      setIsMuted(false);
      video.volume = volume || 0.5;
    } else {
      video.muted = true;
      setIsMuted(true);
    }
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;
    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(err => console.error(err));
    } else {
      document.exitFullscreen().catch(err => console.error(err));
    }
  };

  const handleRetry = () => {
    const video = videoRef.current;
    if (!video) return;
    setError(null);
    setIsLoading(true);
    video.load();
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 2500);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      className={`relative group bg-slate-950 rounded-xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col justify-center items-center ${className}`}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={src}
        autoPlay={autoPlay}
        playsInline
        preload="metadata"
        onClick={togglePlay}
        className="w-full h-full max-h-[500px] object-contain cursor-pointer"
      />

      {/* Loading Overlay */}
      {isLoading && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xs text-white z-10">
          <Loader2 className="w-10 h-10 text-[#00D4F5] animate-spin mb-2" />
          <span className="text-xs font-medium text-slate-300">Buffering Demonstration Stream...</span>
        </div>
      )}

      {/* Error Overlay */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 text-center p-6 z-20">
          <AlertCircle className="w-12 h-12 text-rose-400 mb-3" />
          <h4 className="text-white font-semibold text-base mb-1">Demonstration Video Playback Notice</h4>
          <p className="text-slate-400 text-xs max-w-sm mb-4">{error}</p>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRetry}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#00D4F5] hover:bg-[#00b9d6] text-[#0B192C] font-semibold text-xs rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Retry Stream
            </button>
            <a
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg transition-colors font-medium"
            >
              Direct Link
            </a>
          </div>
        </div>
      )}

      {/* Title badge when paused */}
      {title && !isPlaying && !error && (
        <div className="absolute top-3 left-3 bg-[#0B192C]/80 backdrop-blur-md px-3 py-1 rounded-md text-xs font-medium text-cyan-200 border border-cyan-500/30">
          {title}
        </div>
      )}

      {/* Custom Control Bar */}
      <div
        className={`absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-3 pt-6 transition-opacity duration-300 z-10 ${
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Progress / Seek bar */}
        <div className="relative flex items-center mb-2 group/bar">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#00D4F5] hover:h-2.5 transition-all"
          />
        </div>

        {/* Buttons Row */}
        <div className="flex items-center justify-between text-white text-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="p-1.5 hover:bg-white/10 rounded-lg text-[#00D4F5] hover:text-white transition-colors cursor-pointer"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
            </button>

            {/* Time Indicator */}
            <span className="font-mono text-slate-300">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            {/* Volume */}
            <div className="flex items-center gap-1.5 group/vol">
              <button onClick={toggleMute} className="p-1 text-slate-300 hover:text-white transition-colors">
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#00D4F5]"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-cyan-400/80 bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-800/40">
              206 Streaming
            </span>
            <button
              onClick={toggleFullscreen}
              className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Fullscreen"
            >
              <Maximize className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
