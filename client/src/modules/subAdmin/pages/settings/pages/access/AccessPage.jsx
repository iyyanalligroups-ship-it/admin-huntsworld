import { useEffect, useState, useContext } from "react";

  import { LayoutTemplate, Layers, Package, MousePointerClick } from "lucide-react";

import {
    useGetCategoryAccessQuery,
    useUpdateCategoryAccessMutation,
} from "@/redux/api/AccessApi"; // Adjust path based on your structure
import showToast from "@/toast/showToast";
import { AuthContext } from "@/modules/landing/context/AuthContext";

const AccessPage = () => {
    const { user } = useContext(AuthContext);
    const { data, isLoading, isFetching } = useGetCategoryAccessQuery(user?.user?._id, {
        skip: !user?.user?._id,
    });

    const [updateAccess, { isLoading: isUpdating }] = useUpdateCategoryAccessMutation();
    const [isCategoryEnabled, setIsCategoryEnabled] = useState(false);

    useEffect(() => {
        if (data?.data?.is_category !== undefined) {
            setIsCategoryEnabled(data.data.is_category);
        }
    }, [data]);

    const handleToggle = async (checked) => {
        setIsCategoryEnabled(checked);
        try {
            await updateAccess({ user_id: user.user._id, is_category: checked }).unwrap();
            showToast(`Show Product wise ${checked ? "enabled" : "disabled"} successfully`, "success");
        } catch (error) {
            showToast(error?.data?.message || "Failed to update access", "error");
        }
    };


    if (isLoading || isFetching) return <div>Loading...</div>;

    return (
        <div className="p-6 bg-white rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Admin Settings</h2>

{/* SOP / Homepage Layout Configuration */}
<div className="bg-slate-50 border border-slate-200 rounded-lg p-5 mb-6 shadow-sm">
    <div className="flex items-start gap-3">
        <LayoutTemplate className="text-slate-700 mt-1 shrink-0" size={24} />
        <div className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">
                Homepage Display Configuration
            </h2>
            <p className="text-sm text-slate-800">
                Control the browsing experience for your users. You can switch between a **Category-First** approach or a **Product-Feed** approach.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                {/* Option 1: Product Wise */}
                <div className="bg-white/60 p-3 rounded border border-slate-200">
                    <div className="flex items-center gap-2 mb-1">
                        <Package className="w-4 h-4 text-indigo-600" />
                        <span className="font-semibold text-gray-900 text-sm">Toggle ON: Product Wise</span>
                    </div>
                    <p className="text-xs text-gray-600">
                        The homepage will display a **mixed feed of individual products**. Best for discovery and encouraging impulse buys.
                    </p>
                </div>

                {/* Option 2: Category Wise */}
                <div className="bg-white/60 p-3 rounded border border-slate-200">
                    <div className="flex items-center gap-2 mb-1">
                        <Layers className="w-4 h-4 text-emerald-600" />
                        <span className="font-semibold text-gray-900 text-sm">Toggle OFF: Category Wise</span>
                    </div>
                    <p className="text-xs text-gray-600">
                        The homepage will display **Category Folders** (e.g., Electronics, Fashion). Users click a category to see products inside. Best for organized browsing.
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                <MousePointerClick size={14} />
                <span>Changes apply immediately after toggling.</span>
            </div>
        </div>
    </div>
</div>
            <label htmlFor="category-toggle" className="flex items-center space-x-4 cursor-pointer">
                <span className="text-md font-medium">
                    Show Product wise on Home page
                </span>
                <div className="relative">
                    <input
                        type="checkbox"
                        id="category-toggle"
                        className="sr-only"
                        checked={isCategoryEnabled}
                        onChange={(e) => handleToggle(e.target.checked)}
                        disabled={isUpdating}
                    />
                    <div
                        className={`block w-12 h-7 rounded-full transition-colors duration-300 ${isCategoryEnabled ? "bg-[#0c1f4d]" : "bg-gray-300"
                            }`}
                    ></div>
                    <div
                        className={`absolute left-1 top-1 w-5 h-5 bg-white rounded-full transition-transform duration-300 ${isCategoryEnabled ? "translate-x-5" : ""
                            }`}
                    ></div>
                </div>
            </label>

        </div>
    );
};

export default AccessPage;
