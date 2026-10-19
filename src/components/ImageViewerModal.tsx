import React, { useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download } from 'lucide-react';

interface ImageViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  initialIndex?: number;
}

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
  isOpen,
  onClose,
  images,
  initialIndex = 0
}) => {
  const [currentIndex, setCurrentIndex] = React.useState<number>(initialIndex);
  const [isZoomed, setIsZoomed] = React.useState<boolean>(false);

  useEffect(() => {
    setCurrentIndex(initialIndex);
    setIsZoomed(false);
  }, [initialIndex, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, images.length]);

  if (!isOpen || images.length === 0) return null;

  const handlePrev = () => {
    setIsZoomed(false);
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNext = () => {
    setIsZoomed(false);
    setCurrentIndex(prev => (prev < images.length - 1 ? prev + 1 : 0));
  };

  const currentImage = images[currentIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      
      {/* Top action bar */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10 bg-gradient-to-b from-black/60 to-transparent">
        <div className="text-xs font-medium text-slate-300 tabular-nums">
          {currentIndex + 1} de {images.length}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsZoomed(!isZoomed)}
            className="p-2 text-slate-300 hover:text-white rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            title={isZoomed ? "Ajustar tamanho" : "Ampliar"}
          >
            {isZoomed ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
          </button>

          <a
            href={currentImage}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="p-2 text-slate-300 hover:text-white rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            title="Abrir imagem original"
          >
            <Download className="w-4 h-4" />
          </a>

          <button
            onClick={onClose}
            className="p-2 text-slate-300 hover:text-white rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            title="Fechar (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main image container */}
      <div className="relative w-full h-full flex items-center justify-center p-4 select-none">
        <img
          src={currentImage}
          alt={`Visual ampliado ${currentIndex + 1}`}
          className={`transition-all duration-200 rounded-lg shadow-2xl object-contain max-h-[85vh] ${
            isZoomed ? 'scale-125 cursor-zoom-out' : 'cursor-zoom-in'
          }`}
          onClick={() => setIsZoomed(!isZoomed)}
          referrerPolicy="no-referrer"
        />

        {/* Previous Button */}
        {images.length > 1 && (
          <button
            onClick={e => {
              e.stopPropagation();
              handlePrev();
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 text-white rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all"
            title="Anterior"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Next Button */}
        {images.length > 1 && (
          <button
            onClick={e => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-white rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all"
            title="Próxima"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

    </div>
  );
};
