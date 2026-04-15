import { useContext, useState } from 'react';
import ProductCard from './ProductCard';
import { ChevronLeft, ChevronRight, HeartOff } from 'lucide-react'; // Icon for empty state

import { useGetFavoritesUsersQuery } from '@/redux/api/FavoriteApi';
import { AuthContext } from '@/modules/landing/context/AuthContext';

const FavoriteProduct = () => {
    const { user } = useContext(AuthContext);
    const userId = user?.user?._id;
    const { data: favoriteProducts, isLoading } = useGetFavoritesUsersQuery(userId);
    const categoriesData = favoriteProducts?.data || [];

    const [currentPage, setCurrentPage] = useState(0);
    const categoriesPerPage = 10;
    const totalPages = Math.ceil(categoriesData.length / categoriesPerPage);

    const handleNext = () => {
        setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1));
    };

    const handlePrev = () => {
        setCurrentPage((prev) => Math.max(prev - 1, 0));
    };

    const startIndex = currentPage * categoriesPerPage;
    const currentCategories = categoriesData.slice(startIndex, startIndex + categoriesPerPage);
    const firstRow = currentCategories.slice(0, 5);
    const secondRow = currentCategories.slice(5, 10);

    if (isLoading) {
        return <div className="p-6 text-center">Loading...</div>;
    }

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-4 text-[#0c1f4d]">Favorite Products</h2>

            {categoriesData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                    <HeartOff className="w-16 h-16 mb-4 text-gray-400" />
                    <p className="text-lg font-semibold">No favorite products found.</p>
                </div>
            ) : (
                <div className="relative">
                    <div className="space-y-4">
                        <div className="grid grid-cols-5 gap-4 border-b-2 border-gray-200 pb-4">
                            {firstRow.map((category) => (
                                <ProductCard key={category._id} product={category} />
                            ))}
                        </div>
                        <div className="grid grid-cols-5 gap-4 border-b-2 border-gray-200 pb-4">
                            {secondRow.map((category) => (
                                <ProductCard key={category._id} product={category} />
                            ))}
                        </div>
                    </div>

                    {/* Pagination Buttons */}
                    <div className="flex gap-4 mt-4 justify-center">
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
                </div>
            )}
        </div>
    );
};

export default FavoriteProduct;
