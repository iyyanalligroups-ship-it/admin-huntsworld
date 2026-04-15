// src/components/ImageUploadField.jsx
import { useState } from "react";
import { Upload, X } from "lucide-react";

const ImageUploadField = ({ label, onImageChange, currentPreview }) => {
  const [preview, setPreview] = useState(currentPreview || null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result;
        setPreview(result);
        onImageChange(file, result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setPreview(null);
    onImageChange(null, null);
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium block">{label}</label>

      {!preview ? (
        <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
          <Upload className="w-10 h-10 text-gray-400" />
          <span className="mt-2 text-sm text-gray-600">Click to upload image</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>
      ) : (
        <div className="relative">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-56 object-cover rounded-lg shadow"
          />
          <button
            type="button"
            onClick={removeImage}
            className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageUploadField;
