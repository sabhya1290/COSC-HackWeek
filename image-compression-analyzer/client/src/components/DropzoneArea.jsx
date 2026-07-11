import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, AlertCircle } from 'lucide-react';

export default function DropzoneArea({ onFilesDropped, multiple = true }) {
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      onFilesDropped(acceptedFiles);
    }
  }, [onFilesDropped]);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/png': ['.png'],
      'image/webp': ['.webp']
    },
    multiple
  });

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 glass-card
          ${isDragActive 
            ? 'border-cyan-400 bg-cyan-500/10 scale-[0.99] neon-glow-cyan' 
            : 'border-slate-800 dark:border-slate-800 hover:border-cyan-500 hover:neon-glow-cyan'
          }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="p-4 bg-cyan-950/40 text-cyan-400 rounded-lg border border-cyan-500/30">
            <Upload size={32} />
          </div>
          <div>
            <p className="text-lg font-bold tracking-wide text-slate-200 uppercase">
              {isDragActive ? 'DEPLOY IMAGES NOW...' : 'LOAD IMAGES TO SYSTEM'}
            </p>
            <p className="text-xs text-cyan-400 mt-1">
              or <span className="underline font-bold">BROWSE_LOCAL_DRIVES</span>
            </p>
          </div>
          <div className="flex gap-2 justify-center text-[10px] text-slate-500 font-bold">
            <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded">JPG</span>
            <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded">PNG</span>
            <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded">WEBP</span>
          </div>
        </div>
      </div>

      {fileRejections.length > 0 && (
        <div className="mt-4 p-3 bg-red-950/20 border border-red-800/30 rounded-lg flex items-start space-x-2 text-red-400 text-xs">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-bold">SYSTEM ERROR: REJECTED INPUT</p>
            <ul className="list-disc pl-4 mt-1 space-y-1">
              {fileRejections.map(({ file, errors }) => (
                <li key={file.name}>
                  {file.name} - {errors.map(e => e.message).join(', ')}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
