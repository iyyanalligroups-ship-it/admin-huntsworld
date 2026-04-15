import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

import {
  useCreateAdminBannerMutation,
  useUpdateAdminBannerMutation,
} from "@/redux/api/AdminBannerApi";
import BannerImageUploader from "./BannerImageUploader";

const initialState = {
  title: "",
  type: "NORMAL",
  imageUrls: [],
  link: "",
};

const BannerFormModal = ({ open, onClose, editData }) => {
  const [title, setTitle] = useState(initialState.title);
  const [type, setType] = useState(initialState.type);
  const [imageUrls, setImageUrls] = useState(initialState.imageUrls);
  const [link, setLink] = useState(initialState.link);
  const [linkError, setLinkError] = useState("");

  const [createBanner, { isLoading: isCreating }] = useCreateAdminBannerMutation();
  const [updateBanner, { isLoading: isUpdating }] = useUpdateAdminBannerMutation();

  useEffect(() => {
    if (editData) {
      setTitle(editData.title || "");
      setType(editData.type || "NORMAL");
      // Support both possible naming conventions from API
      setImageUrls(editData.imageUrls || editData.image_urls || []);
      setLink(editData.link || "");
    }
  }, [editData]);

  useEffect(() => {
    if (!open) {
      setTitle(initialState.title);
      setType(initialState.type);
      setImageUrls(initialState.imageUrls);
      setLink(initialState.link);
      setLinkError("");
    }
  }, [open]);

  const isValidUrl = (str) => {
    if (!str || str.trim() === "") return true; // optional
    try {
      const url = new URL(str);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      // Allow relative/internal links
      return str.startsWith("/") || str.startsWith("#") || str.startsWith("?");
    }
  };

  const handleSubmit = async () => {
    const trimmedLink = link.trim();

    if (!title.trim()) return;
    if (imageUrls.length === 0) return;

    if (trimmedLink && !isValidUrl(trimmedLink)) {
      setLinkError("Please enter a valid URL (http:// or https://)");
      return;
    }

    setLinkError("");

    try {
      const payload = {
        title: title.trim(),
        type,
        imageUrls,
        link: trimmedLink || undefined,
      };

      if (editData) {
        await updateBanner({
          id: editData._id,
          ...payload,
        }).unwrap();
      } else {
        await createBanner(payload).unwrap();
      }

      onClose();
    } catch (error) {
      console.error("Banner submit error:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>{editData ? "Edit Banner" : "Create Banner"}</DialogTitle>
          <DialogDescription>
            {editData
              ? "Update your banner details and media here. Click save when you're done."
              : "Add a new promotional banner to your platform."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Banner Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Summer Sale 2024"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Display Type</Label>
              <Select value={type} onValueChange={setType} disabled={!!editData}>
                <SelectTrigger id="type" className="w-full">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DEFAULT">Default Banner</SelectItem>
                  <SelectItem value="NORMAL">Normal Banner</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="link">Target URL (Optional)</Label>
              <Input
                id="link"
                placeholder="https://example.com or /internal-page"
                value={link}
                onChange={(e) => {
                  setLink(e.target.value);
                  setLinkError("");
                }}
                type="url"
                className={linkError ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              {linkError && <p className="text-[13px] text-red-500 font-medium">{linkError}</p>}
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Banner Media *</Label>
              <div className="rounded-md border p-4 bg-muted/20">
                <BannerImageUploader
                  type={type}
                  imageUrls={imageUrls}
                  setImageUrls={setImageUrls}
                />
              </div>
            </div>

            {imageUrls.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Live Previews</Label>
                <div className="flex flex-wrap gap-3">
                  {imageUrls.map((url, i) => (
                    <div key={i} className="relative rounded-md overflow-hidden border bg-background shadow-sm p-1">
                      <img
                        src={url}
                        alt="preview"
                        className="w-full max-w-[140px] h-[80px] object-cover rounded-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="border-t pt-4 sm:space-x-3 gap-3 sm:gap-0 mt-2">
          <Button variant="outline" onClick={onClose} disabled={isCreating || isUpdating}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isCreating || isUpdating || !title.trim() || imageUrls.length === 0}
            className="min-w-[120px]"
          >
            {isCreating || isUpdating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : editData ? (
              "Save Changes"
            ) : (
              "Create Banner"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BannerFormModal;
