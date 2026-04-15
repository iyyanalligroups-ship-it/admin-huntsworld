import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, CheckCircle, XCircle, ImageIcon } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useToggleBannerStatusMutation } from "@/redux/api/AdminBannerApi";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";

const BannerList = ({ banners, onEdit, onDelete }) => {
  const [toggleStatus, { isLoading }] = useToggleBannerStatusMutation();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {banners.map((banner) => (
        <Card
          key={banner._id}
          className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg border-slate-200 bg-white flex flex-col justify-between"
        >
          {/* Top Decorative Line based on Status */}
          <div
            className={`absolute top-0 left-0 w-full h-1 ${
              banner.is_active ? "bg-green-500" : "bg-red-400"
            }`}
          />

          <div className="p-5 space-y-5">
            {/* Header Section */}
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-lg text-slate-800 leading-tight">
                  {banner.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    {banner.type === "DEFAULT" && "📌 Default Banner"}
                </p>
              </div>

              <span
                className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide border ${
                  banner.type === "DEFAULT"
                    ? "bg-blue-50 text-blue-600 border-blue-200"
                    : "bg-slate-50 text-slate-600 border-slate-200"
                }`}
              >
                {banner.type}
              </span>
            </div>

            {/* Gallery / Images Section */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              {banner.image_urls?.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {banner.image_urls.map((img, i) => (
                    <div
                      key={i}
                      className="relative overflow-hidden rounded-lg shadow-sm border border-slate-200 bg-white transition-transform hover:scale-105"
                    >
                      <Zoom>
                        <img
                          src={img}
                          alt={`Banner preview ${i + 1}`}
                          className="h-16 w-auto object-cover"
                          style={{ maxWidth: "100%" }}
                        />
                      </Zoom>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-4 text-slate-400">
                  <ImageIcon className="w-8 h-8 mb-1 opacity-50" />
                  <span className="text-xs">No images</span>
                </div>
              )}
            </div>
          </div>

          {/* Footer / Controls Section */}
          <div className="bg-slate-50/50 p-4 border-t border-slate-100 mt-auto">
            {/* Status Toggle */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {banner.is_active ? (
                  <div className="flex items-center gap-1.5 text-green-700 bg-green-50 px-2 py-1 rounded-md border border-green-100">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span className="text-xs font-semibold">Active</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-slate-500 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                    <XCircle className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">Inactive</span>
                  </div>
                )}
              </div>

              <Switch
                checked={banner.is_active}
                disabled={isLoading}
                onCheckedChange={(checked) =>
                  toggleStatus({ id: banner._id, is_active: checked })
                }
                className="data-[state=checked]:bg-green-600"
              />
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                size="sm"
                variant="outline"
                className="w-full border-slate-200 hover:bg-white hover:text-blue-600 hover:border-blue-200 transition-colors"
                onClick={() => onEdit(banner)}
              >
                <Pencil className="w-3.5 h-3.5 mr-2" /> Edit
              </Button>

              <Button
                size="sm"
                variant="outline"
                className="w-full border-slate-200 text-red-600 hover:bg-red-50 hover:border-red-200 hover:text-red-700 transition-colors"
                onClick={() => onDelete(banner._id)}
              >
                <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default BannerList;
