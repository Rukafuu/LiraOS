import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, ExternalLink } from 'lucide-react';

interface ImageLightboxProps {
    src: string;
    alt?: string;
    isOpen: boolean;
    onClose: () => void;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({ src, alt, isOpen, onClose }) => {
    if (!isOpen) return null;

    const handleDownload = async () => {
        try {
            const response = await fetch(src);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            // Try to deduce extension, default to png
            const ext = src.split('.').pop()?.split('?')[0] || 'png';
            link.download = `lira-image-${Date.now()}.${ext.length > 4 ? 'png' : ext}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (e) {
            console.error("Download failed:", e);
            window.open(src, '_blank');
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
                    onClick={onClose}
                >
                    {/* Controls */}
                    <div className="absolute top-4 right-4 flex gap-2">
                        <button
                            onClick={(e) => { e.stopPropagation(); handleDownload(); }}
                            className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                            title="Download"
                        >
                            <Download size={20} />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-3 rounded-full bg-white/10 hover:bg-red-500/20 hover:text-red-400 text-white transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Image */}
                    <motion.img
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        src={src}
                        alt={alt || "Lightbox"}
                        className="max-w-full max-h-screen object-contain rounded-lg shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />

                    <div className="absolute bottom-6 text-white/50 text-xs">
                        Click anywhere outside to close
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
