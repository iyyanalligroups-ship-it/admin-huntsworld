import { MoveRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CategoryCard = ({ title, imageUrl }) => {

  const navigate = useNavigate();

  const handleSubcategory = (subCategoryName) => {
      navigate(`/subcategory-detail/${subCategoryName}`);
  }

  return (
    <div className="flex flex-col items-center group cursor-pointer" onClick={() => handleSubcategory(title?.toLowerCase()
      ?.replace(/ & /g, '-')
      ?.replace(/ /g, '-'))}>
      {/* Parent Circle Container */}
      <div >
        {/* Inner Circle Image Container */}
        <div
          className="relative w-30 h-30 rounded-full overflow-hidden shadow-lg transition-all duration-300"
          style={{
            backgroundImage: `url(${imageUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20"></div>

          {/* Right Arrow with Left-to-Right Animation on Hover */}
          <div className="absolute inset-0 flex items-center justify-center z-30">
            <div className="opacity-0 group-hover:opacity-100 transform -translate-x-20 group-hover:translate-x-0 transition-all duration-500 ease-in-out">
              <MoveRight className="text-white w-8 h-8" />
            </div>
          </div>
        </div>
      </div>

      {/* Subcategory Name Below Image */}
      <div className="mt-3 text-center">
        <h3 className="text-sm font-semibold text-black hover:text-[#0c1f4d] tracking-wide">{title}</h3>
      </div>
    </div>
  );
};

export default CategoryCard;