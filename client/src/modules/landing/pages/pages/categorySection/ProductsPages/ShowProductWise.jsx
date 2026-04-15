import { useContext, useState, useMemo } from "react";
import { useGetAllProductsQuery } from "@/redux/api/ProductApi";
import { useToggleFavoriteMutation, useGetFavoritesByUserQuery } from "@/redux/api/FavoriteApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import axios from "axios";
import { Heart } from "lucide-react";
import clsx from "clsx";
import showToast from "@/toast/showToast";

const LIMIT = 10;

const AllProductsPage = () => {
  const [page, setPage] = useState(0);
  const [products, setProducts] = useState([]);
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const userId = user?.user?._id;
  const [loading, setLoading] = useState(false);

  const { data, isFetching, isLoading } = useGetAllProductsQuery({
    skip: page * LIMIT,
    limit: LIMIT,
  });

  const [toggleFavorite] = useToggleFavoriteMutation();
  const { data: favoriteData } = useGetFavoritesByUserQuery(userId, {
    skip: !userId,
  });

  const favoriteIds = useMemo(() => {
    return favoriteData?.favorites?.map((fav) => fav.product?._id) || [];
  }, [favoriteData]);

  // Handle product updates to avoid duplicates
  useMemo(() => {
    if (data?.data?.length) {
      setProducts((prev) => {
        // If page is 0, reset products to avoid duplicates on refresh
        if (page === 0) {
          return data.data;
        }
        // Filter out duplicates based on product _id
        const newProducts = data.data.filter(
          (newProduct) => !prev.some((existing) => existing._id === newProduct._id)
        );
        return [...prev, ...newProducts];
      });
    }
  }, [data, page]);

  const handleGiveTrendingPoint = async (productId) => {
    if (loading) return;
    setLoading(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/trending-point/create-trending-points`, {
        user_id: user?.user?._id,
        product_id: productId,
        trending_points: 1,
        date: new Date().toISOString().split("T")[0],
      });
    } catch (err) { }
    finally {
      setLoading(false);
    }
  };

  const handleProduct = (productName, productId) => {
    handleGiveTrendingPoint(productId);
    navigate(`/product/${productName}`);
  };

  const handleToggleFavorite = async (e, productId) => {
    e.stopPropagation();
    if (!productId) return;

    try {
      const response = await toggleFavorite({ productId }).unwrap();

      if (response.favorite) {
        showToast("✅ Product added to favorites!", "success");
        try {
          await axios.post(
            `${import.meta.env.VITE_API_URL}/trending-point/create-trending-points-for-favorite`,
            {
              user_id: user?.user?._id,
              product_id: productId,
              trending_points: 1,
              date: new Date().toISOString().split("T")[0],
            }
          );
        } catch (trendingError) {
          console.error("Trending point error:", trendingError);
        }
      } else {
        showToast("ℹ️ Product removed from favorites.", "info");
      }
    } catch (error) {
      showToast("⚠️ Failed to toggle favorite. Try again.", "error");
      console.error("Toggle favorite error:", error);
    }
  };

  const hasMore = data?.data?.length === LIMIT;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-10 text-[#0c1f4d] ">All Products</h2>

      {products.length === 0 && !isLoading && (
        <p className="text-gray-500">No products found.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6">
        {products.map((product) => {
          const isFavorited = favoriteIds.includes(product?._id);
          return (
            <Card key={product._id} onClick={() => handleProduct(product?.product_name, product?._id)} className="relative cursor-pointer">
              <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs font-semibold px-2 py-1 rounded shadow z-10">
                🔥 {product.totalTrendingPoints || 0} pts
              </div>

              <button
                onClick={(e) => handleToggleFavorite(e, product._id)}
                className="absolute top-2 left-2 bg-white p-2 rounded-full shadow z-10 hover:bg-gray-100"
              >
                <Heart
                  className={clsx("w-5 h-5 transition", {
                    "text-red-500 fill-red-500": isFavorited,
                    "text-gray-400": !isFavorited,
                  })}
                />
              </button>

              <CardContent className="p-4 space-y-2">
                <img
                  src={product.product_image?.[0] || "/no-image.png"}
                  alt={product.product_name}
                  className="w-full h-40 object-cover rounded"
                />
                <h2 className="text-lg font-semibold">{product?.product_name}</h2>
                <p className="font-medium">₹{parseFloat(product?.price.$numberDecimal).toFixed(0)}</p>
                <p className="text-xs text-gray-500">Stock: {product.stock_quantity}</p>

                {product.sellerInfo && (
                  <div className="mt-2 text-sm text-gray-700">
                    <p><strong>Seller:</strong> {product.sellerInfo.name || 'N/A'}</p>
                    <p><strong>Company Name:</strong> {product.sellerInfo.company_name}</p>
                    {product.sellerInfo.companyAddress && (
                      <p>
                        <strong>Company Location:</strong>{" "}
                        {[product?.sellerInfo?.companyAddress?.city, product?.sellerInfo?.companyAddress?.state, product?.sellerInfo?.companyAddress?.country]
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

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleProduct(product?.product_name, product?._id);
                  }}
                  className="mt-2 w-full bg-gray-100 text-sm py-2 rounded hover:bg-gray-200 transition"
                >
                  View More
                </button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {hasMore && (
        <div className="flex justify-center mt-6">
          <Button onClick={() => setPage((prev) => prev + 1)} disabled={isFetching}>
            {isFetching ? "Loading..." : "Load More"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default AllProductsPage;
