'use client';

import { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, ImagePlus, X, AlertCircle } from 'lucide-react';
import { cn, validateImageFile, fileToBase64 } from '@/lib/utils';

interface PhotoUploadProps {
  onUpload: (imageData: string) => void;
  className?: string;
}

export function PhotoUpload({ onUpload, className }: PhotoUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);

      const validation = validateImageFile(file);
      if (!validation.valid) {
        setError(validation.error || 'Invalid file');
        return;
      }

      try {
        const base64 = await fileToBase64(file);
        setPreview(base64);
      } catch {
        setError('Failed to process image');
      }
    },
    []
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData.items;
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            handleFile(file);
          }
          break;
        }
      }
    },
    [handleFile]
  );

  const handleConfirm = () => {
    if (preview) {
      onUpload(preview);
    }
  };

  const handleClear = () => {
    setPreview(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (preview) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="relative rounded-xl overflow-hidden">
  {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Preview"
            className="w-full max-h-[60vh] object-contain bg-slate-800"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={handleClear}
            className="absolute top-2 right-2 rounded-full bg-black/50 border-white/20 text-white hover:bg-black/70"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex gap-2 justify-center">
          <Button variant="outline" onClick={handleClear} className="border-slate-600">
            Choose Different
          </Button>
          <Button onClick={handleConfirm} className="bg-purple-600 hover:bg-purple-700">
            Analyze Photo
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative rounded-xl border-2 border-dashed transition-colors',
        isDragging
          ? 'border-purple-500 bg-purple-500/10'
          : 'border-slate-600 hover:border-slate-500',
        className
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onPaste={handlePaste}
      tabIndex={0}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />

      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-700/50 flex items-center justify-center mb-4">
          {isDragging ? (
            <ImagePlus className="w-8 h-8 text-purple-400" />
          ) : (
            <Upload className="w-8 h-8 text-slate-400" />
          )}
        </div>

        <h3 className="text-lg font-medium text-white mb-2">
          {isDragging ? 'Drop your image here' : 'Upload a photo'}
        </h3>

        <p className="text-slate-400 text-sm mb-4">
          Drag and drop, paste, or click to select
        </p>

        <p className="text-slate-500 text-xs">Supports JPEG, PNG, WebP (max 5MB)</p>

        {error && (
          <div className="mt-4 flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

