import React, { useState, useRef } from "react";
import { Plus } from "lucide-react"; // optional, or use any icon

const ProductCarousel = ({ images = [] }) => {
  const [active, setActive] = useState(images[0]);
  const [zoomVisible, setZoomVisible] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [lensPosition, setLensPosition] = useState({ x: 0, y: 0 });

  const imageRef = useRef(null);

  const lensSize = 80; // square lens size

  const handleMouseMove = (e) => {
    const rect = imageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Ensure lens stays within image bounds
    const lensX = Math.max(0, Math.min(x - lensSize / 2, rect.width - lensSize));
    const lensY = Math.max(0, Math.min(y - lensSize / 2, rect.height - lensSize));

    // Percent for zoom reference
    const zoomX = (x / rect.width) * 100;
    const zoomY = (y / rect.height) * 100;

    setLensPosition({ x: lensX, y: lensY });
    setZoomPosition({ x: zoomX, y: zoomY });
  };

  return (
    <div className="flex gap-4 relative">
      {/* Main Image */}
      <div
        className="relative w-40 h-40 border rounded overflow-hidden"
        onMouseEnter={() => setZoomVisible(true)}
        onMouseLeave={() => setZoomVisible(false)}
        onMouseMove={handleMouseMove}
      >
        <img
          src={active}
          alt="product"
          ref={imageRef}
          className="w-full h-full object-cover cursor-pointer"
        />

        {/* Lens Rectangle */}
        {zoomVisible && (
          <div
            className="absolute border-2 border-[#0c1f4d] bg-white/30 pointer-events-none"
            style={{
              width: `${lensSize}px`,
              height: `${lensSize}px`,
              left: `${lensPosition.x}px`,
              top: `${lensPosition.y}px`,
            }}
          >
            <div className="flex items-center justify-center h-full w-full">
              <Plus size={20} className="text-[#0c1f4d]" />
            </div>
          </div>
        )}
      </div>

      {/* Zoom Preview */}
      {/* Zoom Preview - Overlaid with high z-index */}
      {zoomVisible && (
        <div
          className="absolute w-60 h-60 border rounded overflow-hidden hidden md:block z-50 bg-white shadow-lg"
          style={{
            top: 0,
            left: '170px', // position to the right of main image
          }}
        >
          <img
            src={active}
            alt="zoom"
            className="w-auto h-auto min-w-full min-h-full absolute"
            style={{
              transform: `translate(-${zoomPosition.x}%, -${zoomPosition.y}%) scale(2.5)`,
              transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
              pointerEvents: "none",
            }}
          />
        </div>
      )}


      {/* Thumbnails */}
      <div className="flex flex-col gap-2 ml-4">
        {images.map((img, idx) => (
          <img
            key={idx}
            src={img}
            alt={`thumb-${idx}`}
            className={`w-12 h-12 rounded cursor-pointer border ${active === img ? "border-[#0c1f4d]" : "border-gray-300"
              }`}
            onClick={() => setActive(img)}
          />
        ))}
      </div>
    </div>
  );
};

export default ProductCarousel;
