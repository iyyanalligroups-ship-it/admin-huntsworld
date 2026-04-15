import { useState } from 'react';
import ProductCard from './ProductCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { useGetTopProductsQuery } from '@/redux/api/CategoryApi';

const TrendingCategory = () => {
  const { data: trendingCategories, isLoading } = useGetTopProductsQuery();
  const categoriesData = trendingCategories?.data || [];
  console.log(trendingCategories, 'trending');

  const [currentPage, setCurrentPage] = useState(0);
  const categoriesPerPage = 10; // 2 rows * 5 columns
  const totalPages = Math.ceil(categoriesData.length / categoriesPerPage);

  const handleNext = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1));
  };

  const handlePrev = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 0));
  };

  const startIndex = currentPage * categoriesPerPage;
  const currentCategories = categoriesData.slice(startIndex, startIndex + categoriesPerPage);

  // Split into two rows of 5 items each
  const firstRow = currentCategories.slice(0, 5);
  const secondRow = currentCategories.slice(5, 10);
  console.log(firstRow, 'firstrow');


  if (isLoading) {
    return <div className="p-6 text-center">Loading...</div>;
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4 text-[#0c1f4d]">Popular Products</h2>
      <div className="relative">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 border-b-2 border-gray-200 pb-4">
            {firstRow.map((category) => (
              <ProductCard key={category.productId} product={category} />
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 border-b-2 border-gray-200 pb-4">
            {secondRow.map((category) => (
              <ProductCard key={category.productId} product={category} />
            ))}
          </div>

        </div>

        {/* Pagination Buttons */}
        <div className="flex gap-4 mt-4 justify-center">
          {/* Navigation Buttons (Positioned both sides) */}
          <button
            onClick={handlePrev}
            disabled={currentPage === 0}
            className={`absolute top-1/2 left-[-24px] transform -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full transition-colors
    ${currentPage === 0
                ? 'bg-gray-300 text-white cursor-not-allowed'
                : 'bg-black text-white hover:bg-[#0c1f4d]'
              }`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            onClick={handleNext}
            disabled={currentPage >= totalPages - 1}
            className={`absolute top-1/2 right-[-24px] transform -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full transition-colors
    ${currentPage >= totalPages - 1
                ? 'bg-gray-300 text-white cursor-not-allowed'
                : 'bg-black text-white hover:bg-[#0c1f4d]'
              }`}
          >
            <ChevronRight className="w-5 h-5" />
          </button>

        </div>

        {/* Empty state */}
        {categoriesData.length === 0 && (
          <p className="text-gray-500 text-sm mt-2">No trending categories found.</p>
        )}
      </div>
    </div>
  );
};

export default TrendingCategory;
