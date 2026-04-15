import { useRef, useContext, useMemo } from 'react';
import { Heart, Eye } from 'lucide-react';
import { gsap } from 'gsap';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '@/modules/landing/context/AuthContext';
import { useToggleFavoriteMutation, useGetFavoritesByUserQuery } from '@/redux/api/FavoriteApi'
import showToast from '@/toast/showToast';
import axios from 'axios';
import { ActiveUserContext } from '@/modules/admin/context/ActiveUserProvider';

const ProductCard = ({ product }) => {
  const cardRef = useRef(null);
  const iconRef = useRef(null);
  const navigate = useNavigate();

  const { user } = useContext(AuthContext);
  const {trackProductView }=useContext(ActiveUserContext);
  const userId = user?.user?._id;
  const productId = product?.product?._id;

  const { product: productData, sellerInfo, totalTrendingPoints = 0 } = product;
  const image = productData?.product_image?.[0] || '/fallback-image.jpg';
  const name = productData?.product_name || 'Unnamed Product';
  const price = productData?.price?.$numberDecimal || '0';

  const handleMouseEnter = () => {
    gsap.to(cardRef.current, { scale: 1.05, duration: 0.3, ease: 'power3.out' });
    gsap.fromTo(iconRef.current, { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out' });
  };

  const handleMouseLeave = () => {
    gsap.to(cardRef.current, { scale: 1, duration: 0.3, ease: 'power3.in' });
    gsap.to(iconRef.current, { y: 50, opacity: 0, duration: 0.5, ease: 'power3.in' });
  };

  const handleProduct = (productName,id) => {
    trackProductView(id);
    navigate(`/product/${productName}`);
  };

  const [toggleFavorite] = useToggleFavoriteMutation();
  const { data: favoriteData } = useGetFavoritesByUserQuery(userId, {
    skip: !userId,
  });

  const isFavorited = useMemo(() => {
    return favoriteData?.favorites?.some((fav) => fav.product._id === productId);
  }, [favoriteData, productId]);

  const handleToggleFavorite = async (e) => {
    e.stopPropagation();
    if (!productId) return;

    try {
      // Step 1: Toggle Favorite
      const response = await toggleFavorite({ productId }).unwrap();

      if (response.favorite) {
        showToast("✅ Product added to favorites!", "success");

        // Step 2: Add Trending Point if product is favorited
        try {
          await axios.post(
            `${import.meta.env.VITE_API_URL}/trending-point/create-trending-points-for-favorite`,
            {
              user_id: user?.user?._id,
              product_id: productId,
              trending_points: 2,
              date: new Date().toISOString().split("T")[0],
            }
          );
        } catch (trendingError) {
          console.error("Trending point error:", trendingError);
          // Optional toast:
          // showToast("⚠️ Failed to record trending point.", "warning");
        }

      } else {
        showToast("ℹ️ Product removed from favorites.", "info");
      }
    } catch (error) {
      showToast("⚠️ Failed to toggle favorite. Try again.", "error");
      console.error("Toggle favorite error:", error);
    }
  };



  return (
    <div
      ref={cardRef}
      onClick={() => handleProduct(name,productId)}
      className="relative flex flex-col p-2 border-r-2 hover:shadow-[1.95px_1.95px_2.6px_rgba(0,0,0,0.15)] hover:border-r-4 hover:border-[#0c1f4d] hover:rounded-xl transition-shadow cursor-pointer"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* 🔥 Trending Badge */}
      <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs font-semibold px-2 py-1 rounded shadow z-10">
        🔥 {totalTrendingPoints} pts
      </div>

      <div className="flex justify-center">
        <img src={image} alt={name}     className="w-full shrink-0 h-40 object-cover mb-2 rounded md:h-48 lg:h-56"  />
      </div>
      <p className="text-[#0c1f4d] font-bold text-xs">MODERN EDITION</p>
      <h3 className="text-sm font-semibold text-center">{name}</h3>
      <p className="text-gray-600 text-sm">₹{parseFloat(price).toFixed(0)}</p>

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
        <button
          className="flex-1 bg-[#0c1f4d] text-sm text-white py-2 rounded hover:opacity-90 transition cursor-pointer"
        >
          <span


          >
            Send Enquiry
          </span>
        </button>
        <button className="flex-1 bg-[#ea1a24] text-white text-sm py-2 rounded hover:bg-[#ea1a24e0] transition cursor-pointer">
          Show Mobile
        </button>
      </div>

      {/* 👇 Favorite + Eye Buttons */}
      <div
        ref={iconRef}
        className="absolute inset-0 flex justify-center items-center gap-4 opacity-0 pointer-events-none"
      >
        {/* ❤️ Favorite Toggle */}
        <button
          onClick={handleToggleFavorite}
          className="p-2 bg-white rounded-full shadow-md hover:bg-gray-100 cursor-pointer pointer-events-auto"
        >
          <Heart
            className={`w-5 h-5 ${isFavorited ? 'text-red-600 fill-red-600' : 'text-gray-400'
              } transition-all`}
          />
        </button>

        {/* 👁️ Eye (optional logic) */}
        <button className="p-2 bg-white rounded-full shadow-md hover:bg-gray-100 cursor-pointer pointer-events-auto">
          <Eye className="w-5 h-5 text-[#1C1B1F]" />
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
