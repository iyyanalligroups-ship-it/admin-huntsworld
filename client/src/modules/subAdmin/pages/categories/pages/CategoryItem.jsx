import { Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useContext } from "react";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import { useGetUserByIdQuery } from "@/redux/api/SubAdminAccessRequestApi";
import showToast from "@/toast/showToast";
import noImage from "@/assets/images/no-image.jpg";


const formatName = (value) => {
  if (!value) return "";

  return value
    .replace(/[-_]/g, " ") // replace hyphen & underscore
    .replace(/\b\w/g, (char) => char.toUpperCase()); // capitalize each word
};

export default function CategoryItem({ category, onEdit, onDelete, viewMode }) {
  const { user } = useContext(AuthContext);
  const userId = user?.user?._id;

  const {
    data: currentUser,
    isError: isUserError,
    error: userError,
  } = useGetUserByIdQuery(userId, { skip: !userId });

  // ✅ Check permissions for this page
  const currentPagePath = "categories/main";
  const pagePermissions = currentUser?.approved_permissions?.find(
    (p) => p.page === currentPagePath
  );

  const canEdit = pagePermissions?.actions?.includes("edit") || false;
  const canDelete = pagePermissions?.actions?.includes("delete") || false;

  if (isUserError) {
    console.error("Error fetching user permissions:", userError);
    showToast("Failed to load user permissions", "error");
  }

  return (
    <div
      className={`p-4 border rounded-xl shadow-sm ${viewMode === "grid" ? "" : "flex justify-between items-center"
        }`}
    >
      <div>
        <h4 className="font-semibold">{formatName(category.categoryName)}</h4>
        <img
          src={
            category.categoryImage ? encodeURI(category.categoryImage) : noImage
          }
          width="100"
          height="100"
          alt="category"
          className="mt-2 rounded-md border object-cover"
          onError={(e) => {
            e.target.src = noImage;
          }}
        />
      </div>

      {/* ✅ Only show if user has permissions */}
      <div className="flex gap-2 mt-2 sm:mt-0">
        {canEdit && (
          <Button
            size="icon"
            variant="ghost"
            className="cursor-pointer"
            onClick={() => onEdit(category)}
          >
            <Pencil size={16} />
          </Button>
        )}
        {canDelete && (
          <Button
            size="icon"
            variant="destructive"
            className="cursor-pointer"
            onClick={() => onDelete(category._id)}
          >
            <Trash2 size={16} />
          </Button>
        )}
      </div>
    </div>
  );
}
