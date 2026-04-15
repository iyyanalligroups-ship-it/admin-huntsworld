import { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import CategorySidebar from './pages/pages/category/CategorySidebar';
import BannerCarousel from './components/BannerCarousel';
import TrendingCategory from './pages/pages/trendingCategory/TrendingCategory';
import CategorySection from './pages/pages/categorySection/CategorySection';
import Testimonial from '../landing/pages/pages/testimonial/Testimonial';
import PopularProducts from './pages/pages/products/PopularProduct';
import { useGetTopCategoriesQuery } from '@/redux/api/CategoryApi';
import "./css/Submenu.css";
import { useGetCategoryAccessQuery } from "@/redux/api/AccessApi";
import AllProductsPage from './pages/pages/categorySection/ProductsPages/ShowProductWise';
import { AuthContext } from './context/AuthContext';
import CityPage from './pages/pages/categorySection/CityPage';


const Submenu = ({ subcategories }) => {
  const navigate = useNavigate();


  // Filter subcategories that have at least one superSubCategory
  const validSubcategories = subcategories?.filter(
    (subCat) => subCat?.superSubCategories?.length > 0
  ) || [];

  const handleSubCategory = (subCategoryname) => {
    navigate(`/subcategory-detail/${subCategoryname}`);
  };

  // If no valid subcategories, show message
  if (validSubcategories.length === 0) {
    return (
      <div className="w-full bg-white p-6 rounded-lg shadow-md text-center text-gray-500">
        No data found
      </div>
    );
  }

  return (
    <div className="w-full bg-white p-6 rounded-lg shadow-md overflow-y-auto max-h-[300px] submenu-container">
      <div className="grid grid-cols-3 gap-4">
        {validSubcategories.map((subCat, index) => {
          const formattedName = subCat.subCategoryName
            ?.toLowerCase()
            ?.replace(/ & /g, "-")
            ?.replace(/ /g, "-");

          return (
            <div key={index} className="flex flex-col min-h-[150px]">
              <h3
                className="text-sm font-semibold text-[#0c1f4d] uppercase mb-3 border-b border-gray-200 cursor-pointer pb-1"
                onClick={() => handleSubCategory(formattedName)}
              >
                {subCat.subCategoryName}
              </h3>
              <ul className="space-y-2 flex-1">
                {subCat.superSubCategories.slice(0, 3).map((item, itemIndex) => (
                  <li key={itemIndex}>
                    <Link
                      to={`/products/super/${item.name
                        ?.toLowerCase()
                        ?.replace(/ & /g, "-")
                        ?.replace(/ /g, "-")}`}
                      className="text-sm text-gray-600 cursor-pointer hover:text-black hover:underline transition-colors duration-150 block"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                to={`/subcategory-detail/${formattedName}`}
                className="text-blue-600 text-sm mt-3 cursor-pointer hover:underline transition-colors duration-150 block"
              >
                View More
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
};


const HomePage = () => {
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const { data: topCategoriesData,  isLoading: categoriesLoading } = useGetTopCategoriesQuery();
  const categories = topCategoriesData?.data || [];
    const {user}=useContext(AuthContext);
  console.log('categories home', categories);
  const {
    data: accessData,
    isLoading: accessLoading,
    isFetching: accessFetching,
  } = useGetCategoryAccessQuery( );
  console.log(accessData,'accessdata');
  

  const isCategory = accessData?.data?.is_category ?? false;

  if (accessLoading || accessFetching || categoriesLoading) {
    return <div className="p-6">Loading homepage...</div>;
  }

  return (
    <>
      <div className="relative w-full h-[42vh] flex overflow-hidden">
        <div className="relative z-10 h-[40vh] overflow-y-auto mt-4">
          <CategorySidebar
            categories={categories}
            onHover={(cat) =>
              setHoveredCategory({
                id: cat.categoryId,
                ...cat,
                subCategories: cat.subCategories || [],
              })
            }
            onLeave={() => { }}
            selectedId={hoveredCategory?.id}
          />
        </div>
        {hoveredCategory?.subCategories?.length > 0 && (
          <div
            className="absolute top-4 left-[250px] right-0 bottom-0 z-20 p-4 submenu-container"
            onMouseEnter={() => setHoveredCategory(hoveredCategory)}
            onMouseLeave={() => setHoveredCategory(null)}
          >
            <Submenu subcategories={hoveredCategory.subCategories} />
          </div>
        )}
        <div className="relative flex-1 bg-gray-100 mt-4 z-0 overflow-hidden">
          <BannerCarousel />
        </div>
      </div>

      <div className="mt-4">
        <TrendingCategory />
      </div>
      <div className="mt-4">
        {isCategory ? (
          <AllProductsPage />
        ) : (
          <CategorySection categories={categories} />
        )}
      </div>
      <div className="mt-4">
        <Testimonial />
      </div>
    
      <div className="mt-4">
        <PopularProducts />
      </div>
   
    </>
  );
};

export default HomePage;