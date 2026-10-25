import React, { useState, useRef } from 'react';
import { Upload, Video, CheckCircle2, AlertTriangle, X, RefreshCw } from 'lucide-react';
import { api } from '../services/api.js';
import { VideoPlayer } from './VideoPlayer.js';

interface DirectVideoUploadProps {
  initialVideoUrl?: string;
  initialFileName?: string;
  initialFileSize?: number;
  onVideoUploaded: (data: { videoUrl: string; videoFileName: string; videoSize: number }) => void;
  onVideoRemoved: () => void;
  disabled?: boolean;
}

export const DirectVideoUpload: React.FC<DirectVideoUploadProps> = ({
  initialVideoUrl,
  initialFileName,
  initialFileSize,
  onVideoUploaded,
  onVideoRemoved,
  disabled = false
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | undefined>(initialVideoUrl);
  const [fileName, setFileName] = useState<string | undefined>(initialFileName);
  const [fileSize, setFileSize] = useState<number | undefined>(initialFileSize);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const MAX_SIZE_MB = 100;
  const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

  const handleFileSelect = async (file: File) => {
    setErrorMessage(null);

    // Format validation
    const validTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska'];
    const validExtensions = /\.(mp4|webm|mov|mkv)$/i;

    if (!validTypes.includes(file.type) && !file.name.match(validExtensions)) {
      setErrorMessage('Invalid video format. Supported file formats: MP4 (H.264), WebM, or MOV.');
      return;
    }

    // Size validation
    if (file.size > MAX_SIZE_BYTES) {
      setErrorMessage(`File exceeds maximum limit of ${MAX_SIZE_MB}MB (Selected: ${(file.size / (1024 * 1024)).toFixed(1)}MB).`);
      return;
    }

    // Begin upload
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const response = await api.uploadVideoFile(file, (pct) => {
        setUploadProgress(pct);
      });

      setVideoUrl(response.videoUrl);
      setFileName(response.videoFileName);
      setFileSize(response.videoSize);
      setIsUploading(false);

      onVideoUploaded({
        videoUrl: response.videoUrl,
        videoFileName: response.videoFileName,
        videoSize: response.videoSize
      });
    } catch (err: any) {
      setIsUploading(false);
      setErrorMessage(err.message || 'Video upload failed. Please try again.');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleRemove = () => {
    setVideoUrl(undefined);
    setFileName(undefined);
    setFileSize(undefined);
    setErrorMessage(null);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onVideoRemoved();
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime,video/*"
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {/* Upload Box when no video or during upload */}
      {!videoUrl && (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
              handleFileSelect(e.dataTransfer.files[0]);
            }
          }}
          className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
            isDragging
              ? 'border-[#00D4F5] bg-[#00D4F5]/5'
              : 'border-slate-700 bg-slate-900/60 hover:border-slate-600'
          }`}
        >
          {isUploading ? (
            <div className="space-y-3 py-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#00D4F5]/10 border border-[#00D4F5]/30 flex items-center justify-center text-[#00D4F5]">
                <RefreshCw className="w-6 h-6 animate-spin" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-200">Uploading Project Demonstration Video...</p>
                <p className="text-xs text-slate-400 mt-1">{uploadProgress}% complete</p>
              </div>
              <div className="w-full max-w-xs mx-auto bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
                <div
                  className="bg-gradient-to-r from-[#00D4F5] to-blue-500 h-2 transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-slate-800 flex items-center justify-center text-cyan-400">
                <Video className="w-6 h-6" />
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={disabled}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#00D4F5] hover:bg-[#00b9d6] text-[#0B192C] font-semibold text-sm rounded-lg shadow-md transition-all cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  Choose Video File
                </button>
                <p className="text-xs text-slate-400 mt-2">
                  Drag and drop local MP4 or WebM video file from your device
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Supported formats: MP4 (H.264), WebM • Max file size: {MAX_SIZE_MB}MB
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error message */}
      {errorMessage && (
        <div className="flex items-start gap-2 p-3 bg-rose-950/40 border border-rose-800/60 rounded-lg text-rose-300 text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Uploaded Video Preview with controls */}
      {videoUrl && (
        <div className="space-y-2">
          <div className="flex items-center justify-between bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-lg">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="truncate">
                <p className="text-xs font-medium text-slate-200 truncate">{fileName || 'Project_Demonstration_Video.mp4'}</p>
                {fileSize && <p className="text-[11px] text-slate-400">{formatFileSize(fileSize)}</p>}
              </div>
            </div>
            {!disabled && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1 text-xs font-medium text-cyan-400 hover:text-cyan-300 hover:bg-slate-800 rounded transition-colors"
                >
                  Replace Video
                </button>
                <button
                  type="button"
                  onClick={handleRemove}
                  className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                  title="Remove video"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Interactive Player Preview */}
          <div className="mt-2">
            <VideoPlayer src={videoUrl} title={fileName || 'Demonstration Video Preview'} />
          </div>
        </div>
      )}
    </div>
  );
};
