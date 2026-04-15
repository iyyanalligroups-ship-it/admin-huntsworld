import React from "react";
import { UploadCloud, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useUploadBannerImagesMutation,
  useDeleteBannerImagesMutation,
} from "@/redux/api/AdminBannerImageApi";
import showToast from "@/toast/showToast";

const REQUIRED_WIDTH = 1220;
const REQUIRED_HEIGHT = 274;

// 🔍 VALIDATE IMAGE DIMENSIONS
const validateImageDimensions = (file) => {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const isValid =
        img.width === REQUIRED_WIDTH && img.height === REQUIRED_HEIGHT;
      URL.revokeObjectURL(url);
      resolve(isValid);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(false);
    };

    img.src = url;
  });
};

const BannerImageUploader = ({ imageUrls, setImageUrls, type }) => {
  const [uploadImages, { isLoading }] = useUploadBannerImagesMutation();
  const [deleteImages] = useDeleteBannerImagesMutation();

  // 🔥 AUTO UPLOAD ON SELECT
  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    // 🛑 DEFAULT banner → only one image allowed
    if (type === "DEFAULT" && imageUrls.length >= 1) {
      showToast("Only one image allowed for DEFAULT banner", "warning");
      e.target.value = "";
      return;
    }

    if (type === "DEFAULT" && files.length > 1) {
      showToast("DEFAULT banner allows only one image", "warning");
      e.target.value = "";
      return;
    }

    // 🧪 DIMENSION VALIDATION
    for (const file of files) {
      const isValid = await validateImageDimensions(file);
      if (!isValid) {
        showToast(
          `Invalid image size. Required ${REQUIRED_WIDTH} × ${REQUIRED_HEIGHT}px`,
          "error"
        );
        e.target.value = "";
        return;
      }
    }

    try {
      const res = await uploadImages(files).unwrap();

      if (type === "DEFAULT") {
        setImageUrls(res.imageUrls);
      } else {
        setImageUrls((prev) => [...prev, ...res.imageUrls]);
      }
    } catch (err) {
      console.error(err);
      showToast("Image upload failed", "error");
    }

    e.target.value = "";
  };

  // ❌ DELETE IMAGE
  const handleDelete = async (url) => {
    try {
      await deleteImages([url]).unwrap();
      setImageUrls((prev) => prev.filter((img) => img !== url));
      showToast("Image deleted", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to delete image", "error");
    }
  };

  return (
    // ✅ FIXED HEIGHT + SINGLE SCROLL CONTAINER
    <div className="h-[100px] overflow-y-auto pr-2 space-y-4 border rounded-lg p-3 bg-white">

      {/* Upload Area */}
      <label
        className={`border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center transition ${
          isLoading
            ? "bg-gray-50 cursor-not-allowed opacity-70"
            : "cursor-pointer hover:border-[#0c1f4d]"
        }`}
      >
        {isLoading ? (
          <Loader2 className="w-6 h-6 mb-2 text-[#0c1f4d] animate-spin" />
        ) : (
          <UploadCloud className="w-6 h-6 mb-2 text-gray-600" />
        )}

        <span className="text-xs text-gray-700 font-medium text-center">
          {isLoading
            ? "Uploading..."
            : type === "DEFAULT"
            ? "Upload default banner image"
            : "Upload banner images"}
        </span>

        <input
          type="file"
          accept="image/*"
          multiple={type !== "DEFAULT"}
          hidden
          onChange={handleFileChange}
          disabled={isLoading}
        />
      </label>

      {/* Rules */}
      <p className="text-xs text-gray-500 text-center">
        {type === "DEFAULT"
          ? "Only one image allowed"
          : "Multiple images allowed"}{" "}
        | Required size: <b>1220 × 274 px</b>
      </p>

      {/* Preview Section (NO nested scroll) */}
      {imageUrls.length > 0 && (
        <div className="border rounded-md p-2 bg-gray-50/50">
          <div className="grid grid-cols-2 gap-3">
            {imageUrls.map((url) => (
              <div
                key={url}
                className="relative group rounded-md overflow-hidden border bg-white shadow-sm"
              >
                <img
                  src={url}
                  className="w-full h-20 object-cover"
                  alt="Banner preview"
                />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-start justify-end p-1">
                  <Button
                    size="icon"
                    variant="destructive"
                    className="h-6 w-6 shadow-lg"
                    onClick={() => handleDelete(url)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BannerImageUploader;
