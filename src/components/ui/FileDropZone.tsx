import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { BimOpenSchemaLoader, BimData } from '@/loader';

interface FileDropZoneProps {
  onFileLoaded: (data: BimData) => void;
  onLoadingChange?: (loading: boolean) => void;
  onError?: (error: Error) => void;
  className?: string;
  variant?: 'industrial' | 'cyberpunk' | 'organic' | 'editorial' | 'glassmorphism';
}

export function FileDropZone({ 
  onFileLoaded, 
  onLoadingChange, 
  onError,
  className = '',
  variant = 'industrial'
}: FileDropZoneProps) {
  const [isLoading, setIsLoading] = useState(false);

  const loadFile = useCallback(async (file: File) => {
    setIsLoading(true);
    onLoadingChange?.(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const blob = new Blob([arrayBuffer]);
      const url = URL.createObjectURL(blob);
      
      const loader = new BimOpenSchemaLoader();
      const data = await loader.load(url, { loadParameters: false });
      
      URL.revokeObjectURL(url);
      onFileLoaded(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      onError?.(error);
    } finally {
      setIsLoading(false);
      onLoadingChange?.(false);
    }
  }, [onFileLoaded, onLoadingChange, onError]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      loadFile(acceptedFiles[0]);
    }
  }, [loadFile]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/octet-stream': ['.bos', '.zip']
    },
    maxFiles: 1,
    disabled: isLoading
  });

  const variantStyles = {
    industrial: {
      base: 'border-neutral-400 bg-neutral-100 hover:border-orange-500 hover:bg-white',
      active: 'border-orange-500 bg-orange-50',
      reject: 'border-red-500 bg-red-50',
      text: 'text-neutral-600',
      accent: 'text-orange-600'
    },
    cyberpunk: {
      base: 'border-cyan-500/30 bg-black/40 hover:border-cyan-500 hover:bg-cyan-950/30',
      active: 'border-cyan-500 bg-cyan-500/20 shadow-lg shadow-cyan-500/20',
      reject: 'border-red-500 bg-red-500/20',
      text: 'text-cyan-500/70',
      accent: 'text-cyan-400'
    },
    organic: {
      base: 'border-stone-300 bg-white/60 hover:border-green-500 hover:bg-green-50/50',
      active: 'border-green-500 bg-green-100/50',
      reject: 'border-red-400 bg-red-50',
      text: 'text-stone-600',
      accent: 'text-green-700'
    },
    editorial: {
      base: 'border-black bg-white hover:border-yellow-400 hover:bg-yellow-50',
      active: 'border-yellow-400 bg-yellow-100',
      reject: 'border-red-600 bg-red-50',
      text: 'text-black',
      accent: 'text-black'
    },
    glassmorphism: {
      base: 'border-white/40 bg-white/20 hover:border-white/60 hover:bg-white/30',
      active: 'border-white/60 bg-white/40',
      reject: 'border-red-400/50 bg-red-100/30',
      text: 'text-slate-600',
      accent: 'text-slate-800'
    }
  };

  const styles = variantStyles[variant];
  const stateStyle = isDragReject ? styles.reject : isDragActive ? styles.active : styles.base;

  return (
    <div
      {...getRootProps()}
      className={`
        relative border-2 border-dashed rounded-xl p-8 cursor-pointer
        transition-all duration-300 ease-out
        ${stateStyle}
        ${isLoading ? 'pointer-events-none opacity-60' : ''}
        ${className}
      `}
    >
      <input {...getInputProps()} />
      
      <div className="flex flex-col items-center justify-center text-center space-y-3">
        {isLoading ? (
          <>
            <div className={`
              w-12 h-12 border-3 border-t-transparent rounded-full animate-spin
              ${variant === 'cyberpunk' ? 'border-cyan-500 shadow-lg shadow-cyan-500/30' : ''}
              ${variant === 'industrial' ? 'border-orange-500' : ''}
              ${variant === 'organic' ? 'border-green-500' : ''}
              ${variant === 'editorial' ? 'border-black' : ''}
              ${variant === 'glassmorphism' ? 'border-slate-400' : ''}
            `} />
            <p className={`text-sm font-medium ${styles.text}`}>
              Processing model data...
            </p>
          </>
        ) : (
          <>
            <div className={`
              w-12 h-12 rounded-full flex items-center justify-center mb-2
              ${variant === 'cyberpunk' ? 'bg-cyan-500/10 text-cyan-400' : ''}
              ${variant === 'industrial' ? 'bg-neutral-200 text-neutral-600' : ''}
              ${variant === 'organic' ? 'bg-green-100 text-green-600' : ''}
              ${variant === 'editorial' ? 'bg-black text-white' : ''}
              ${variant === 'glassmorphism' ? 'bg-white/40 text-slate-600' : ''}
            `}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            
            <p className={`text-sm font-medium ${styles.text}`}>
              {isDragActive ? 'Drop the file here' : 'Drag & drop a .bos file'}
            </p>
            
            <p className={`text-xs ${styles.text} opacity-60`}>
              or click to browse
            </p>
            
            <div className={`
              inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium
              ${variant === 'cyberpunk' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : ''}
              ${variant === 'industrial' ? 'bg-neutral-200 text-neutral-600' : ''}
              ${variant === 'organic' ? 'bg-green-100 text-green-700' : ''}
              ${variant === 'editorial' ? 'bg-black text-white' : ''}
              ${variant === 'glassmorphism' ? 'bg-white/30 text-slate-600 border border-white/40' : ''}
            `}>
              <span>.BOS</span>
              <span className="opacity-50">|</span>
              <span>.ZIP</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
