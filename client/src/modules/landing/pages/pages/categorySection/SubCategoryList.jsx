import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { useGetCategoryByNameQuery } from "@/redux/api/CategoryApi";

// export const categories = [
//   {
//     id: 1,
//     label: "Home Supplies",
//     icon: "Boxes",
//     subcategories: [
//       {
//         sub_category_name: "Metal Furniture",
//         sub_category_image: "https://img.freepik.com/free-photo/modern-metal-furniture-living-room_53876-126702.jpg",
//         super_sub_categories: [
//           { label: "Steel Almirah" },
//           { label: "Recliner Chair" },
//           { label: "Steel Table" },
//           { label: "Metal Bed" },
//         ],
//       },
//       {
//         sub_category_name: "Furniture Hardware",
//         sub_category_image: "https://img.freepik.com/free-photo/tools-construction-set-black-background_93675-128110.jpg",
//         super_sub_categories: [
//           { label: "Table Top" },
//           { label: "Backrest" },
//           { label: "Furniture Screws" },
//         ],
//       },
//     ],
//   },
//   {
//     id: 2,
//     label: "Agriculture",
//     icon: "Tractor",
//     subcategories: [
//       {
//         sub_category_name: "Farming Tools",
//         sub_category_image: "https://img.freepik.com/free-photo/agriculture-tools_1122-852.jpg",
//         super_sub_categories: [
//           { label: "Shovels" },
//           { label: "Hoes" },
//           { label: "Tractors" },
//           { label: "Seed Drills" },
//           { label: "Seed Drills" },
//           { label: "Seed Drills" },
//         ],
//       },
//       {
//         sub_category_name: "Irrigation Systems",
//         sub_category_image: "https://img.freepik.com/free-photo/irrigation-system-watering-green-grass_1150-11170.jpg",
//         super_sub_categories: [
//           { label: "Drip Irrigation" },
//           { label: "Sprinkler Systems" },
//         ],
//       },
//     ],
//   },
//   {
//     id: 3,
//     label: "Apparel & Fashion",
//     icon: "Shirt",
//     subcategories: [
//       {
//         sub_category_name: "Men's Clothing",
//         sub_category_image: "https://img.freepik.com/free-photo/men-s-casual-outfit_23-2148864984.jpg",
//         super_sub_categories: [
//           { label: "Shirts" },
//           { label: "T-Shirts" },
//           { label: "Jeans" },
//         ],
//       },
//       {
//         sub_category_name: "Women's Clothing",
//         sub_category_image: "https://img.freepik.com/free-photo/young-beautiful-woman-dressed-blue-dress_144627-56707.jpg",
//         super_sub_categories: [
//           { label: "Kurtis" },
//           { label: "Sarees" },
//           { label: "Leggings" },
//         ],
//       },
//     ],
//   },
//   {
//     id: 4,
//     label: "Food Products & Beverage",
//     icon: "Utensils",
//     subcategories: [
//       {
//         sub_category_name: "Packaged Food",
//         sub_category_image: "https://img.freepik.com/free-photo/top-view-collection-different-snacks-black-background_23-2148419203.jpg",
//         super_sub_categories: [
//           { label: "Biscuits" },
//           { label: "Snacks" },
//           { label: "Canned Food" },
//         ],
//       },
//       {
//         sub_category_name: "Beverages",
//         sub_category_image: "https://img.freepik.com/free-photo/refreshing-drinks-arrangement_23-2148738080.jpg",
//         super_sub_categories: [
//           { label: "Soft Drinks" },
//           { label: "Juices" },
//           { label: "Energy Drinks" },
//         ],
//       },
//     ],
//   },
//   {
//     id: 5,
//     label: "Chemicals",
//     icon: "FlaskConical",
//     subcategories: [
//       {
//         sub_category_name: "Industrial Chemicals",
//         sub_category_image: "https://img.freepik.com/free-photo/laboratory-glassware-arrangement_23-2149234787.jpg",
//         super_sub_categories: [
//           { label: "Acids" },
//           { label: "Solvents" },
//           { label: "Dyes" },
//         ],
//       },
//       {
//         sub_category_name: "Cleaning Chemicals",
//         sub_category_image: "https://img.freepik.com/free-photo/cleaning-products-set_23-2148185478.jpg",
//         super_sub_categories: [
//           { label: "Detergents" },
//           { label: "Sanitizers" },
//         ],
//       },
//     ],
//   },
//   {
//     id: 6,
//     label: "Industrial Supplies",
//     icon: "Factory",
//     subcategories: [
//       {
//         sub_category_name: "Pipes & Fittings",
//         sub_category_image: "https://img.freepik.com/free-photo/plastic-pipes-arranged-stack_1232-2624.jpg",
//         super_sub_categories: [
//           { label: "PVC Pipes" },
//           { label: "Metal Fittings" },
//         ],
//       },
//       {
//         sub_category_name: "Fasteners",
//         sub_category_image: "https://img.freepik.com/free-photo/assortment-metal-nuts_93675-133759.jpg",
//         super_sub_categories: [
//           { label: "Bolts" },
//           { label: "Nuts" },
//           { label: "Washers" },
//         ],
//       },
//     ],
//   },
//   {
//     id: 7,
//     label: "Construction & Real Estate",
//     icon: "Building2",
//     subcategories: [
//       {
//         sub_category_name: "Building Materials",
//         sub_category_image: "https://img.freepik.com/free-photo/construction-materials-concept_23-2149233904.jpg",
//         super_sub_categories: [
//           { label: "Cement" },
//           { label: "Bricks" },
//           { label: "Concrete Blocks" },
//         ],
//       },
//       {
//         sub_category_name: "Real Estate Services",
//         sub_category_image: "https://img.freepik.com/free-photo/hands-holding-house-model_23-2147771838.jpg",
//         super_sub_categories: [
//           { label: "Property Dealers" },
//           { label: "Rental Services" },
//         ],
//       },
//     ],
//   },
//   {
//     id: 8,
//     label: "Furniture",
//     icon: "Wrench",
//     subcategories: [
//       {
//         sub_category_name: "Living Room Furniture",
//         sub_category_image: "https://img.freepik.com/free-photo/living-room-interior-with-couch_23-2148894625.jpg",
//         super_sub_categories: [
//           { label: "Sofa Sets" },
//           { label: "TV Units" },
//           { label: "Coffee Tables" },
//         ],
//       },
//       {
//         sub_category_name: "Bedroom Furniture",
//         sub_category_image: "https://img.freepik.com/free-photo/modern-bedroom-interior_23-2148888122.jpg",
//         super_sub_categories: [
//           { label: "Beds" },
//           { label: "Wardrobes" },
//           { label: "Dressers" },
//         ],
//       },
//     ],
//   },
//   {
//     id: 9,
//     label: "Health & Beauty",
//     icon: "Heart",
//     subcategories: [
//       {
//         sub_category_name: "Personal Care",
//         sub_category_image: "https://img.freepik.com/free-photo/cosmetic-products-still-life_23-2148899506.jpg",
//         super_sub_categories: [
//           { label: "Shampoo" },
//           { label: "Face Wash" },
//           { label: "Moisturizers" },
//         ],
//       },
//       {
//         sub_category_name: "Health Devices",
//         sub_category_image: "https://img.freepik.com/free-photo/blood-pressure-monitor-table_23-2148524923.jpg",
//         super_sub_categories: [
//           { label: "BP Monitor" },
//           { label: "Thermometer" },
//           { label: "Glucometer" },
//         ],
//       },
//     ],
//   },
//   {
//     id: 10,
//     label: "Electronics",
//     icon: "Monitor",
//     subcategories: [
//       {
//         sub_category_name: "Mobile Phones",
//         sub_category_image: "https://img.freepik.com/free-photo/modern-smartphone-digital-device_53876-96803.jpg",
//         super_sub_categories: [
//           { label: "Smartphones" },
//           { label: "Feature Phones" },
//           { label: "Refurbished Phones" },
//         ],
//       },
//       {
//         sub_category_name: "Home Appliances",
//         sub_category_image: "https://img.freepik.com/free-photo/modern-home-appliances_93675-133930.jpg",
//         super_sub_categories: [
//           { label: "Refrigerators" },
//           { label: "Washing Machines" },
//           { label: "Microwaves" },
//         ],
//       },
//     ],
//   },
// ];

const SubCategoryList = () => {
  const { category } = useParams();
  const decodedCategory = decodeURIComponent(category || "");
  console.log("Decoded Category:", decodedCategory);

  const [currentPage, setCurrentPage] = useState(1);
  const [expandedSubcategories, setExpandedSubcategories] = useState({}); // Track which subcategories are expanded

  const { data: responseData, isLoading, isError } = useGetCategoryByNameQuery({
    category_name: decodedCategory,
    page: currentPage,
  });

  const selectedCategory = responseData?.data?.[0];
  const pagination = responseData?.pagination;

  if (isLoading) return <div className="p-4">Loading...</div>;

  if (isError || !selectedCategory)
    return <div className="p-4 text-red-500">Category not found.</div>;

  const subcategories = selectedCategory.subcategories || [];

  // Pagination handlers
  const handlePrevPage = () => {
    if (pagination && currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (pagination && currentPage < pagination.totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePageClick = (pageNum) => {
    if (pageNum !== currentPage) setCurrentPage(pageNum);
  };

  // Toggle expanded state for a subcategory
  const toggleExpand = (subcategoryName) => {
    setExpandedSubcategories((prev) => ({
      ...prev,
      [subcategoryName]: !prev[subcategoryName],
    }));
  };

  return (
    <div className="p-4">
      {/* Category Header */}
      <h2 className="text-2xl font-semibold mb-6 capitalize">
        {selectedCategory.categoryName.replace(/-/g, ' ')}
      </h2>

      {/* Subcategory Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {subcategories.map((subcategory, idx) => {
          const isExpanded = expandedSubcategories[subcategory.subCategoryName];
          const superSubcategories = subcategory.superSubcategories || [];
          const visibleSuperSubcategories = isExpanded
            ? superSubcategories
            : superSubcategories.slice(0, 5);

          return (
            <div
              key={idx}
              className="border border-gray-300 flex justify-between rounded-lg shadow-md p-4 bg-white"
            >
              <div>
                {/* Subcategory Image */}
                <img
                  src={subcategory.subCategoryImage || 'https://via.placeholder.com/150'}
                  alt={subcategory.subCategoryName}
                  className="w-full h-40 object-cover rounded-md mb-4"
                />
              </div>

              {/* Subcategory Title */}
              <div>
                <h3 className="text-lg font-bold text-[#0c1f4d] mb-2 capitalize">
                  <Link
                    to={`/subcategory-detail/${subcategory.subCategoryName.toLowerCase().replace(/\s+/g, '-')}`}
                    className="hover:underline block w-full overflow-hidden whitespace-nowrap cursor-pointer text-ellipsis"
                  >
                    {subcategory.subCategoryName.split(" ").slice(0, 3).join(" ") +
                      (subcategory.subCategoryName.split(" ").length > 3 ? "..." : "")}
                  </Link>

                </h3>

                {/* Super Subcategories */}
                {superSubcategories.length > 0 && (
                  <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                    {visibleSuperSubcategories.map((ssc, sscIdx) => (
                      <li key={sscIdx}>
                        <Link
                          to={`/products/${subcategory.subCategoryName.toLowerCase().replace(/\s+/g, '-')}/${ssc.superSubCategoryName.toLowerCase().replace(/\s+/g, '-')}`}
                          className="hover:underline"
                        >
                          {ssc.superSubCategoryName.replace(/-/g, ' ')}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Toggle Explore More / Show Less */}
                {superSubcategories.length > 5 && (
                  <button
                    onClick={() => toggleExpand(subcategory.subCategoryName)}
                    className="mt-2 text-blue-600 hover:underline text-sm"
                  >
                    {isExpanded ? '- Show Less' : '+ Explore More'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Controls */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8 flex-wrap">
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded bg-gray-300 disabled:opacity-50"
          >
            Prev
          </button>

          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
            (pageNum) => (
              <button
                key={pageNum}
                onClick={() => handlePageClick(pageNum)}
                className={`px-4 py-2 rounded ${pageNum === currentPage
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200'
                  }`}
              >
                {pageNum}
              </button>
            )
          )}

          <button
            onClick={handleNextPage}
            disabled={currentPage === pagination.totalPages}
            className="px-4 py-2 rounded bg-gray-300 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>

  );
};

export default SubCategoryList;