// src/pages/SubCategoryDetail.jsx

import { useParams, useNavigate } from "react-router-dom";
import { useGetSubCategoryByNameQuery } from "@/redux/api/CategoryApi"
import { useState } from "react";


const ITEMS_PER_PAGE = 10;

const SubCategoryDetail = () => {
  const { subcategoryName } = useParams();
  const [currentPageStates, setCurrentPageStates] = useState({});
  const navigate = useNavigate();

  const { data: subCategoryData, isLoading, error } = useGetSubCategoryByNameQuery({
    sub_category_name: subcategoryName,
    page: 1, // API pagination is handled on the backend; we'll manage deep subcategory pagination on the frontend
  });

  if (isLoading) return <div className="p-4">Loading...</div>;
  if (error || !subCategoryData?.data?.[0])
    return <div className="p-4 text-red-500">Subcategory not found.</div>;

  // Extract the first subcategory from the API response
  const selectedSub = subCategoryData.data[0];
  const superSubcategories = selectedSub.superSubcategories || [];

  // Handle pagination for each super subcategory's deep subcategories
  const handlePageChange = (sscIndex, newPage) => {
    setCurrentPageStates((prev) => ({
      ...prev,
      [sscIndex]: newPage,
    }));
  };

  const handleNavigateProduct = ({
    type,
    subCategoryName,
    superSubCategoryName,
    deepSubCategoryName,
  }) => {
    const formattedSubCategory = subCategoryName.toLowerCase().replace(/\s+/g, "-");
    const formattedSuperSubCategory = superSubCategoryName.toLowerCase().replace(/\s+/g, "-");
    const formattedDeepSubCategory = deepSubCategoryName?.toLowerCase().replace(/\s+/g, "-");

    if (type === "super") {
      navigate(`/products/${type}/${formattedSuperSubCategory}`);
    } else if (type === "deep") {
      navigate(`/products/${type}/${formattedDeepSubCategory}`);
    }
  };


  return (
    <div className="p-6">
      {/* Display Subcategory Name from API */}
      <h2 className="text-3xl font-bold mb-6 text-[#0c1f4d]">
        {selectedSub.subCategoryName.replace(/-/g, " ")}
      </h2>

      <div className="flex flex-col gap-6">
        {superSubcategories.map((ssc, sscIndex) => {
          const currentPage = currentPageStates[sscIndex] || 1;
          const deepSubcategories = ssc.deepSubcategories || [];
          const validDeepSubcategories = deepSubcategories.filter(
            (deepSub) => deepSub.deepSubCategoryName // Filter out invalid deep subcategories (e.g., those without a name)
          );
          const totalItems = validDeepSubcategories.length;
          const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

          const paginatedItems = validDeepSubcategories.slice(
            (currentPage - 1) * ITEMS_PER_PAGE,
            currentPage * ITEMS_PER_PAGE
          );

          // Skip rendering if there are no valid deep subcategories
          if (totalItems === 0) return null;

          return (
            <div
              key={sscIndex}
              className="bg-gradient-to-tr from-white to-gray-100 shadow-xl rounded-lg overflow-hidden hover:shadow-2xl transition-all duration-300"
            >
              <div className="p-4 space-y-3">
                {/* Super Subcategory Name */}
                <h3
                  className="text-xl font-semibold border-b-2 cursor-pointer border-[#0c1f4d] text-gray-800"
                  onClick={() =>
                    handleNavigateProduct({
                      type: "super",
                      subCategoryName: selectedSub.subCategoryName,
                      superSubCategoryName: ssc.superSubCategoryName,
                    })
                  }
                >
                  {ssc.superSubCategoryName.replace(/-/g, " ")}
                </h3>


                {/* Deep Subcategories */}
                <ul className="space-y-1 text-sm flex gap-10" >
                  {paginatedItems.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <div
                        className="flex flex-col items-center gap-2 hover:shadow-lg transition-shadow duration-300 cursor-pointer"
                        onClick={() =>
                          handleNavigateProduct({
                            type: "deep",
                            subCategoryName: selectedSub.subCategoryName,
                            superSubCategoryName: ssc.superSubCategoryName,
                            deepSubCategoryName: item.deepSubCategoryName,
                          })
                        }
                      >

                        <img
                          src={item.deepSubCategoryImage || "https://via.placeholder.com/120"}
                          alt={item.deepSubCategoryName}
                          className="w-30 h-30 rounded object-cover"
                        />
                        <span className="text-bold">
                          {item.deepSubCategoryName.replace(/-/g, " ")}
                        </span>{" "}
                        ({item.productCount})
                      </div>
                    </li>
                  ))}
                </ul>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 pt-3">
                    <button
                      onClick={() =>
                        handlePageChange(sscIndex, Math.max(currentPage - 1, 1))
                      }
                      disabled={currentPage === 1}
                      className="text-xs px-2 py-1 bg-gray-200 rounded disabled:opacity-50"
                    >
                      Prev
                    </button>

                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => handlePageChange(sscIndex, i + 1)}
                        className={`text-xs px-2 py-1 rounded ${currentPage === i + 1 ? "bg-gray-800 text-white" : "bg-gray-200"
                          }`}
                      >
                        {i + 1}
                      </button>
                    ))}

                    <button
                      onClick={() =>
                        handlePageChange(sscIndex, Math.min(currentPage + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                      className="text-xs px-2 py-1 bg-gray-200 rounded disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SubCategoryDetail;
