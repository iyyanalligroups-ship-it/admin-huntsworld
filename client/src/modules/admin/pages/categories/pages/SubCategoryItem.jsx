import { Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import noImage from "@/assets/images/no-image.jpg";

const formatName = (value) => {
  if (!value) return "";

  return value
    .replace(/[-_]/g, " ") // replace hyphen & underscore
    .replace(/\b\w/g, (char) => char.toUpperCase()); // capitalize each word
};

export default function SubCategoryItem({
  category,
  onEdit,
  onDelete,
  viewMode,
}) {
  return (
    <div
      className={`p-4 border rounded-xl shadow-sm ${
        viewMode === "grid" ? "" : "flex justify-between items-center"
      }`}
    >
      <div>
        <h4 className="font-semibold">
          {formatName(category.sub_category_name)}
        </h4>
        <img
          src={
            category.sub_category_image
              ? `${encodeURI(category.sub_category_image)}?t=${Date.now()}`
              : noImage
          }
          width="100"
          height="100"
          alt="sub-category-image"
          className="mt-2 rounded-md border object-cover"
          onError={(e) => {
            e.target.src = noImage;
          }}
        />
      </div>

      <div className="flex gap-2 mt-2 sm:mt-0">
        <Button
          size="icon"
          variant="ghost"
          className="cursor-pointer"
          onClick={() => onEdit(category)}
        >
          <Pencil size={16} />
        </Button>
        <Button
          size="icon"
          variant="destructive"
          onClick={() => onDelete(category._id)}
          className="cursor-pointer"
        >
          <Trash2 size={16} />
        </Button>
      </div>
    </div>
  );
}
