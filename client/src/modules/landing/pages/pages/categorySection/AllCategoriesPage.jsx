// import { ArrowRight } from "lucide-react";
// const categories = [
//     {
//       categoryName: "Fashion",
//       image: "https://img.freepik.com/free-photo/fashion-style-design-ideas-clothing_1150-7757.jpg",
//       subCategories: [
//         { name: "Men's Clothing" },
//         { name: "Women's Clothing" },
//         { name: "Accessories" }
//       ]
//     },
//     {
//       categoryName: "Electronics",
//       image: "https://img.freepik.com/free-photo/futuristic-electronic-products-innovations_1150-19025.jpg",
//       subCategories: [
//         { name: "Mobile Phones" },
//         { name: "Laptops" },
//         { name: "Headphones" }
//       ]
//     },
//     {
//       categoryName: "Home & Furniture",
//       image: "https://img.freepik.com/free-photo/modern-living-room-interior_1150-14171.jpg",
//       subCategories: [
//         { name: "Sofas" },
//         { name: "Beds" },
//         { name: "Dining Tables" }
//       ]
//     },
//     {
//       categoryName: "Books",
//       image: "https://img.freepik.com/free-photo/books-library-with-vintage-effect_1150-14932.jpg",
//       subCategories: [
//         { name: "Fiction" },
//         { name: "Non-fiction" },
//         { name: "Children's Books" }
//       ]
//     },
//     {
//       categoryName: "Groceries",
//       image: "https://img.freepik.com/free-photo/grocery-store-fresh-products_1150-14689.jpg",
//       subCategories: [
//         { name: "Fruits & Vegetables" },
//         { name: "Dairy" },
//         { name: "Snacks" }
//       ]
//     },
//     {
//       categoryName: "Toys",
//       image: "https://img.freepik.com/free-photo/assorted-toys-kids_1150-19414.jpg",
//       subCategories: [
//         { name: "Action Figures" },
//         { name: "Board Games" },
//         { name: "Dolls" }
//       ]
//     },
//     {
//       categoryName: "Sports",
//       image: "https://img.freepik.com/free-photo/sports-equipment-rack-gym_1150-10080.jpg",
//       subCategories: [
//         { name: "Football" },
//         { name: "Basketball" },
//         { name: "Tennis" }
//       ]
//     },
//     {
//       categoryName: "Health & Beauty",
//       image: "https://img.freepik.com/free-photo/health-beauty-products-on-white-background_1150-13629.jpg",
//       subCategories: [
//         { name: "Skincare" },
//         { name: "Hair Care" },
//         { name: "Makeup" }
//       ]
//     },
//     {
//       categoryName: "Automotive",
//       image: "https://img.freepik.com/free-photo/modern-car-interior_1150-12088.jpg",
//       subCategories: [
//         { name: "Car Accessories" },
//         { name: "Motorbikes" },
//         { name: "Auto Parts" }
//       ]
//     },
//     {
//       categoryName: "Pets",
//       image: "https://img.freepik.com/free-photo/pet-care-products_1150-11624.jpg",
//       subCategories: [
//         { name: "Dogs" },
//         { name: "Cats" },
//         { name: "Birds" }
//       ]
//     }
//   ];

// const AllCategoriesPage=()=> {
//     return (
//         <div className="bg-white p-4 w-[250px] border border-gray-200 h-auto">
//         <h3 className="font-bold mb-4 text-black">Top Categories</h3>
//         <ul className="space-y-2">
//           {categories.map((cat) => {
//             const Icon = LucideIcons[cat.icon] || LucideIcons["Square"];
//             return (
//               <li
//                 key={cat.id}
//                 className={cn(
//                   "cursor-pointer text-black border-b border-gray-200 rounded transition hover:bg-gray-100",
//                   selectedId === cat.id && "bg-blue-200"
//                 )}
//                 onMouseEnter={() => onHover(cat)}
//                 onMouseLeave={() => !isTouchActive && onLeave()}
//                 onTouchStart={() => handleTouchStart(cat)}
//               >
//                 <Link
//                   to={`/category/${cat.id}`}
//                   className="flex items-center gap-2 py-[5px] px-2"
//                 >
//                   <Icon size={18} className="text-gray-800" />
//                   <span className="text-sm">{cat.label}</span>
//                 </Link>
//               </li>
//             );
//           })}
//         </ul>
//       </div>
//     );
//   }

//   export default AllCategoriesPage;


import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingBasket, ArrowBigRight, Minimize2 } from "lucide-react";
import { useGetCategoriesQuery } from "@/redux/api/CategoryApi";
import { Link, useNavigate } from "react-router-dom";

const AllCategoriesPage = () => {
  const { data: enhancedCategories, isLoading } = useGetCategoriesQuery({ page: 1, limit: 10 });
  const categories = enhancedCategories?.data || [];
  const navigate = useNavigate()
  const handleCategory = (categoryName) => {
    navigate(`/all-categories/${categoryName}`);
  }
  const handleSubCategory =(subCategoryName)=>{
    navigate(`/subcategory-detail/${subCategoryName}`);
  }
  return (
    <div className="p-6">
      <div className="border-1 border-gray-200 p-4 mb-6">
        <h2 className="text-2xl font-bold mb-2 text-[#0c1f4d] hover:text-[#1C1B1F]">Market for Products</h2>
        <p className="text-gray-500 mb-3 text-[14px]">
          Welcome to this section of the product catalog from India's largest B2B trade junction. The wide variety of product categories are covered on this page. With a single click, you can now search for the things you want. You can send online inquiries and find products in certain categories with ease here.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {categories
          .filter((cat) => cat.categoryName !== "All Categories" && cat.subcategories?.length > 0)
          .map((category) => (
            <Card key={category.categoryId} className="overflow-hidden rounded-none flex flex-col h-60 p-0">
              {/* Label Section */}
              <div className="bg-[#0c1f4d] bg-opacity-60 cursor-pointer text-white flex justify-between text-sm px-3 py-2">
                <span className="truncate cursor-pointer" onClick={() => handleCategory(category.categoryName.toLowerCase().replace(/\s+/g, '-'))}>{category.categoryName}</span>
                <Badge variant="secondary" className="text-white">
                  <ShoppingBasket className="mr-1 w-4 h-4" />
                  {category.productCount} Items
                </Badge>
                <Minimize2 className="w-4 h-4 inline-block cursor-pointer" />
              </div>

              {/* Content */}
              <div className="flex flex-row h-full">
                {/* Left: Category Image */}
                <div className="w-1/2 h-full p-2">
                  <img
                    src={category.categoryImage}
                    alt={category.categoryName}
                    className="w-full h-full object-cover border-2 hover:border-[#0c1f4d] rounded-none p-1"
                  />
                </div>

                {/* Right: Subcategories */}
                <CardContent className="w-1/2 p-2 flex flex-col justify-between">
                  <ul className="space-y-2 text-sm text-gray-700">
                    {category.subcategories.slice(0, 5).map((sub, idx) => (
                      <li
                        key={idx}
                        className="relative group overflow-hidden cursor-pointer flex items-center gap-3"
                      >
                        <ArrowBigRight className="w-5 h-5 shrink-0 text-[#0c1f4d] group-hover:text-blue-800 transition-colors duration-300" />
                        <span className="relative z-10 hover:text-white truncate" onClick={()=>handleSubCategory(sub?.subCategoryName)} >{sub.subCategoryName}</span>
                        <span className="absolute bottom-0 left-0 h-full w-0 bg-[#3d7e96] group-hover:w-full transition-all duration-300 ease-out brightness-110 z-0"></span>
                      </li>
                    ))}
                  </ul>

                  {category.subcategories.length > 5 && (
                    <Link
                      to={`/categories/${category.categoryName.toLowerCase().replace(/\s+/g, "-")}`}
                      className="mt-3 text-blue-600 hover:underline text-sm font-medium"
                    >
                      Explore More
                    </Link>
                  )}
                </CardContent>
              </div>
            </Card>
          ))}
      </div>
    </div>
  );
};

export default AllCategoriesPage;


