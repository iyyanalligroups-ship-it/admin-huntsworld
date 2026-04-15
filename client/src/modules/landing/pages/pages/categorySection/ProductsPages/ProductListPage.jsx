import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Sidebar from "../ProductsPages/Sidebar";
import FilterHeader from "../ProductsPages/FilterHeader";
import ProductCard from "../ProductsPages/ProductCard";
import { LayoutGrid, AlignLeft, Ban } from "lucide-react";
import { useGetDeepSubProductsByNameQuery } from "@/redux/api/CategoryApi";
import { Card, CardContent } from "@/components/ui/card";

const ProductListPage = () => {
    const { deepSubCategory, type } = useParams();
    const [selectedCategory, setSelectedCategory] = useState("");
    const [searchLocation, setSearchLocation] = useState("");
    const [debouncedSearchLocation, setDebouncedSearchLocation] = useState("");
    const [nearMe, setNearMe] = useState(false);
    const [selectedCity, setSelectedCity] = useState("");
    const [viewType, setViewType] = useState("list");
    const [page, setPage] = useState(1);
    const [userLocation, setUserLocation] = useState({ lat: null, lng: null });

    // Debounce searchLocation input
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchLocation(searchLocation);
        }, 500);
        return () => clearTimeout(handler);
    }, [searchLocation]);

    // Fetch user geolocation
    useEffect(() => {
        if (nearMe && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    });
                },
                (error) => {
                    console.error("Geolocation error:", error);
                }
            );
        }
    }, [nearMe]);

    // Fetch products
    const {
        data: responseData,
        isLoading,
        isError,
    } = useGetDeepSubProductsByNameQuery({
        modelName: type === "super" ? "super-sub-category" : "deep-sub-category",
        sub_category_name: deepSubCategory,
        page,
        city: selectedCity,
        lat: nearMe ? userLocation?.lat : undefined,
        lng: nearMe ? userLocation?.lng : undefined,
        searchLocation: debouncedSearchLocation,
    });

    const deepSubCategories = responseData?.deepSubCategoryList || responseData?.deepSubCategoryDetail || [];
    const sampleProducts = responseData?.data || [];
    const totalPages = responseData?.totalPages || 1;


    const cities =
        sampleProducts.length > 0
            ? [
                ...new Map(
                    sampleProducts
                        .map((product) => product.primaryAddress?.city)
                        .filter(Boolean)
                        .map((city) => [city, { label: city, value: city }])
                ).values(),
            ]
            : [
                { label: "Navi Mumbai", value: "Navi Mumbai" },
                { label: "Pune", value: "Pune" },
                { label: "Delhi", value: "Delhi" },
                { label: "Ahmedabad", value: "Ahmedabad" },
                { label: "Chennai", value: "Chennai" },
            ];

    useEffect(() => {
        if (!selectedCategory && deepSubCategories.length > 0) {
            setSelectedCategory(deepSubCategories[0].label || deepSubCategories[0].deep_sub_category_name);
        }
    }, [deepSubCategories, selectedCategory]);

    const handlePrevPage = () => {
        if (page > 1) setPage((prev) => prev - 1);
    };

    const handleNextPage = () => {
        if (page < totalPages) setPage((prev) => prev + 1);
    };

    return (
        <div className="container mx-auto max-w-7xl p-4">


            <h1 className="text-2xl font-bold mb-4">
                {(() => {
                    const words = selectedCategory.replace(/-/g, " ").toUpperCase().split(" ");
                    const firstTwo = words.slice(0, 1).join(" ");
                    const rest = words.slice(1).join(" ");
                    return (
                        <>
                            <span className="text-[#0c1f4d]">{firstTwo}</span> {rest}
                        </>
                    );
                })()} ({responseData?.totalCount || 0} Products Available)
            </h1>

            <FilterHeader
                searchLocation={searchLocation}
                onSearchLocationChange={setSearchLocation}
                nearMe={nearMe}
                onNearMeToggle={() => setNearMe(!nearMe)}
                selectedCity={selectedCity}
                onCityChange={setSelectedCity}
                cities={cities}
            />

            <div className="flex gap-4">
                <Sidebar
                    categories={deepSubCategories}
                    selected={selectedCategory}
                    onSelect={(catLabel) => {
                        setSelectedCategory(catLabel);
                        setPage(1);
                    }}
                />

                <div className="flex-1">
                    <div className="flex justify-end mb-4">
                        <button
                            onClick={() => setViewType("list")}
                            className={`px-3 py-1 border flex gap-3 cursor-pointer items-center rounded-l ${viewType === "list" ? "bg-gray-200" : ""
                                }`}
                        >
                            <LayoutGrid className="w-3 h-3" />
                            <span>List</span>
                        </button>
                        <button
                            onClick={() => setViewType("grid")}
                            className={`px-3 py-1 border cursor-pointer flex gap-3 items-center rounded-r ${viewType === "grid" ? "bg-gray-200" : ""
                                }`}
                        >
                            <AlignLeft className="w-3 h-3" />
                            <span>Grid</span>
                        </button>
                    </div>

                    {type === "super" && deepSubCategories?.length > 0 && (
                        <div className="mb-6">
                            <h2 className="text-xl font-semibold mb-4">Explore by Product</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                                {deepSubCategories.slice(0, 5).map((item, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => {
                                            setSelectedCategory(item.deep_sub_category_name);
                                            setPage(1);
                                        }}
                                        className={`cursor-pointer flex gap-2 items-center border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 ${selectedCategory === item.deep_sub_category_name ? "ring-2 ring-[#e03733]" : ""
                                            }`}
                                    >
                                        <img
                                            src={item.deep_sub_category_image}
                                            alt={item.deep_sub_category_name}
                                            className="h-20 w-20 object-cover border-2 p-1"
                                        />
                                        <div className="p-2 text-sm font-medium">{item.deep_sub_category_name}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {isLoading ? (
                        <p>Loading...</p>
                    ) : isError ? (
                        <p className="text-red-500">Failed to load products.</p>
                    ) : (
                        <div className={viewType === "grid" ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "space-y-6"}>
                            {sampleProducts.length === 0 ? (
                                <div className="flex items-center justify-center py-20">
                                    <Card className="max-w-md w-full text-center shadow-md border">
                                        <CardContent className="flex flex-col items-center justify-center space-y-4 py-10">
                                            <Ban className="w-12 h-12 text-red-500" />
                                            <h2 className="text-xl font-semibold text-gray-800">Product Not Found</h2>
                                            <p className="text-gray-500 text-sm">
                                                Sorry, we couldn’t find any product matching your search.
                                            </p>
                                        </CardContent>
                                    </Card>
                                </div>
                            ) : (
                                sampleProducts.map((product, idx) => (
                                    <ProductCard key={idx} product={product} viewType={viewType} />
                                ))
                            )}
                        </div>
                    )}

                    <div className="mt-6 flex justify-center items-center gap-4">
                        <button
                            onClick={handlePrevPage}
                            disabled={page === 1}
                            className="px-3 py-1 border rounded disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <span className="text-sm font-medium">
                            Page {page} of {totalPages}
                        </span>
                        <button
                            onClick={handleNextPage}
                            disabled={page >= totalPages}
                            className="px-3 py-1 border rounded disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductListPage;
