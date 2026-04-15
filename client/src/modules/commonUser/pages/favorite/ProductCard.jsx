import { useRef, useContext, useMemo } from 'react';
import { Heart, Eye, Trash2 } from 'lucide-react';
import { gsap } from 'gsap';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '@/modules/landing/context/AuthContext';
import {
  useToggleFavoriteMutation,
  useGetFavoritesUsersQuery,
  useRemoveFavoriteMutation,
} from '@/redux/api/FavoriteApi';
import showToast from '@/toast/showToast';

const ProductCard = ({ product }) => {
  const cardRef = useRef(null);
  const iconRef = useRef(null);
  const navigate = useNavigate();

  const { user } = useContext(AuthContext);
  const userId = user?.user?._id;

  const { product_name, price, product_image, sellerInfo, totalTrendingPoints = 0, _id: productId } = product;
  const image = product_image?.[0] || '/fallback-image.jpg';
  const name = product_name || 'Unnamed Product';
  const priceValue = price?.$numberDecimal || '0';

  const [toggleFavorite] = useToggleFavoriteMutation();
  const [removeFavorite] = useRemoveFavoriteMutation();

  const { data: favoriteData } = useGetFavoritesUsersQuery(userId, {
    skip: !userId,
  });

  const favoriteEntry = useMemo(() => {
    return favoriteData?.favorites?.find((fav) => fav.product._id === productId);
  }, [favoriteData, productId]);
console.log(product,"entry");

  const isFavorited = !!favoriteEntry;
  const favoriteId = product?.favoriteId;

  const handleMouseEnter = () => {
    gsap.to(cardRef.current, { scale: 1.05, duration: 0.3, ease: 'power3.out' });
    gsap.fromTo(iconRef.current, { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out' });
  };

  const handleMouseLeave = () => {
    gsap.to(cardRef.current, { scale: 1, duration: 0.3, ease: 'power3.in' });
    gsap.to(iconRef.current, { y: 50, opacity: 0, duration: 0.5, ease: 'power3.in' });
  };

  const handleProduct = (productName) => {
    navigate(`/product/${productName}`);
  };

  const handleToggleFavorite = async (e) => {
    e.stopPropagation();
    if (!productId) return;

    try {
      const response = await toggleFavorite({ productId }).unwrap();

      if (response.favorite) {
        showToast("Product added to favorites!", "success");
      } else {
        showToast("Product removed from favorites.", "info");
      }
    } catch (error) {
      showToast("⚠️ Failed to toggle favorite. Try again.", "error");
      console.error("Toggle favorite error:", error);
    }
  };

  const handleRemoveFavorite = async (e) => {
    e.stopPropagation();
    if (!favoriteId) return;

    try {
      await removeFavorite(favoriteId).unwrap();
      showToast("Removed from favorites", "info");
    } catch (error) {
      showToast("Failed to remove favorite", "error");
      console.error("Remove favorite error:", error);
    }
  };

  return (
    <div
      ref={cardRef}
      onClick={() => handleProduct(name)}
      className="relative flex flex-col p-2 border-r-2 hover:shadow-[1.95px_1.95px_2.6px_rgba(0,0,0,0.15)] hover:border-r-4 hover:border-[#0c1f4d] hover:rounded-xl transition-shadow cursor-pointer"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* 🔥 Trending Badge */}
      <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs font-semibold px-2 py-1 rounded shadow z-10">
        🔥 {totalTrendingPoints} pts
      </div>

      <div className="flex justify-center">
        <img src={image} alt={name} className="w-32 h-32 object-cover mb-2 rounded" />
      </div>
      <p className="text-[#0c1f4d] font-bold text-xs">MODERN EDITION</p>
      <h3 className="text-sm font-semibold text-center">{name}</h3>
      <p className="text-gray-600 text-sm">₹{parseFloat(priceValue).toFixed(0)}</p>

      {sellerInfo && (
        <div className="mt-1 text-[11px] text-gray-700 space-y-1 leading-snug">
          <p><strong>Seller:</strong> {sellerInfo.name}</p>
          <p><strong>Company:</strong> {sellerInfo.company_name}</p>
          {sellerInfo.companyAddress && (
            <p>
              <strong>Location:</strong>{" "}
              {[sellerInfo.companyAddress.city, sellerInfo.companyAddress.state, sellerInfo.companyAddress.country]
                .filter(Boolean)
                .join(", ")}
            </p>
          )}
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <button className="flex-1 bg-[#0c1f4d] text-white text-sm py-2 rounded hover:bg-[#0c1f4dd0] transition cursor-pointer">
          Send Enquiry
        </button>
        <button className="flex-1 bg-[#ea1a24] text-white text-sm py-2 rounded hover:bg-[#ea1a24e0] transition cursor-pointer">
          Show Mobile
        </button>
      </div>

      {/* 👇 Hover Favorite + View + Remove Buttons */}
      <div
        ref={iconRef}
        className="absolute inset-0 flex justify-center items-center gap-4 opacity-0 pointer-events-none"
      >
        {/* ❤️ Toggle Favorite */}
        <button
          onClick={handleToggleFavorite}
          className="p-2 bg-white rounded-full shadow-md hover:bg-gray-100 cursor-pointer pointer-events-auto"
        >
          <Heart
            className={`w-5 h-5 ${isFavorited ? 'text-red-600 fill-red-600' : 'text-gray-400'} transition-all`}
          />
        </button>

        {/* 👁️ View Button */}
        <button
          onClick={() => handleProduct(name)}
          className="p-2 bg-white rounded-full shadow-md hover:bg-gray-100 cursor-pointer pointer-events-auto"
        >
          <Eye className="w-5 h-5 text-[#1C1B1F]" />
        </button>

        {/* 🗑️ Remove Favorite */}
       
          <button
            onClick={handleRemoveFavorite}
            className="p-2 bg-white rounded-full shadow-md hover:bg-gray-100 cursor-pointer pointer-events-auto"
          >
            <Trash2 className="w-5 h-5 text-red-500" />
          </button>
        
      </div>
    </div>
  );
};

export default ProductCard;
