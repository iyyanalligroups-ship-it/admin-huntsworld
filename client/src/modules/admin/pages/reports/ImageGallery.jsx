// src/components/ImageGallery.jsx  (or wherever you save it)
import { useState } from "react";
import { X, ChevronLeft, ChevronRight, Download } from "lucide-react";
import {
  DialogClose,   // ← This is the key!
  DialogHeader,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const ImageGallery = ({ attachments }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goPrev = () => setCurrentIndex((i) => (i > 0 ? i - 1 : attachments.length - 1));
  const goNext = () => setCurrentIndex((i) => (i < attachments.length - 1 ? i + 1 : 0));

  const currentUrl = attachments[currentIndex];

  return (
    <div className="relative flex flex-col h-[90vh] max-h-screen bg-black text-white">
      {/* Top Bar: Close + Download */}
      <div className="absolute top-0 left-0 right-0 z-50 flex justify-between items-center p-4 bg-gradient-to-b from-black/70 to-transparent">
        <DialogClose asChild>
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
            <X className="w-6 h-6" />
          </Button>
        </DialogClose>

        <a
          href={currentUrl}
          download
          className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg backdrop-blur-sm transition"
        >
          <Download className="w-5 h-5" />
          <span className="hidden sm:inline">Download</span>
        </a>
      </div>

      {/* Main Image */}
      <div className="flex-1 flex items-center justify-center p-8">
        <img
          src={currentUrl}
          alt={`Attachment ${currentIndex + 1}`}
          className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
        />
      </div>

      {/* Navigation Arrows */}
      {attachments.length > 1 && (
        <>
          <button
            onClick={goPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-4 rounded-full transition z-40"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          <button
            onClick={goNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-4 rounded-full transition z-40"
            aria-label="Next image"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        </>
      )}

      {/* Thumbnails */}
      {attachments.length > 1 && (
        <div className="p-4 bg-black/80 border-t border-white/10">
          <div className="flex gap-3 justify-center overflow-x-auto pb-2">
            {attachments.map((url, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-4 transition-all ${
                  idx === currentIndex ? "border-white shadow-lg" : "border-white/30 opacity-70"
                } hover:opacity-100 hover:border-white/70`}
              >
                <img
                  src={url}
                  alt={`Thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Counter */}
      {attachments.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/70 px-4 py-2 rounded-full text-sm font-medium backdrop-blur">
          {currentIndex + 1} / {attachments.length}
        </div>
      )}
    </div>
  );
};

export default ImageGallery;
