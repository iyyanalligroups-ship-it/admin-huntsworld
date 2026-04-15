// import React from "react";
// import { Phone, MessageSquare } from "lucide-react";
// import ProductCarousel from "./ProductCarousel";

// const ProductCard = ({ product, viewType }) => {
//   return (
//     <div
//       className={`bg-white rounded-lg shadow hover:shadow-md p-4 transition-all duration-200 ${
//         viewType === "list" ? "flex  md:flex-row gap-4" : ""
//       }`}
//     >
//       <div className={viewType === "grid" ? "mb-2" : "md:w-1/3"}>
//         <ProductCarousel images={product.images} />
//       </div>

//       <div className="flex-1">
//         <h2 className="text-md font-semibold text-red-600 mb-2">{product.title}</h2>
//         <p className="text-lg font-bold mb-2">
//           ₹ {product.price} / {product.unit}
//         </p>

//         {/* ✅ Dynamic Attributes */}
//         <ul className="text-sm text-gray-700 space-y-1 mb-2">
//           {product.attributes &&
//             Object.entries(product.attributes).map(([key, value]) => (
//               <li key={key}>
//                 <strong>{key}:</strong> {value}
//               </li>
//             ))}
//         </ul>

//         <div className="flex gap-2 mt-4">
//           <button className="border rounded px-3 py-1 flex items-center gap-1 text-blue-600 border-blue-600 hover:bg-blue-50 text-sm">
//             <Phone size={14} /> View Mobile
//           </button>
//           <button className="bg-green-600 text-white px-3 py-1 rounded flex items-center gap-1 hover:bg-green-700 text-sm">
//             <MessageSquare size={14} /> Send Enquiry
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ProductCard;



// import React, { useState } from "react";
// import axios from "axios";
// import { Phone, MessageSquare } from "lucide-react";
// import ProductCarousel from "./ProductCarousel";

// const ProductCard = ({ product, viewType, currentUserId }) => {
//   const [loading, setLoading] = useState(false);
//   const [given, setGiven] = useState(false);

//   const handleGiveTrendingPoint = async () => {
//     if (loading || given) return;

//     setLoading(true);
//     try {
//       const response = await axios.post(`${import.meta.env.VITE_API_URL}/trending-point/create-trending-points`, {
//         user_id: "67de5caffcfb7c166a0b8f4d",
//         product_id: product?._id,
//         trending_Points: 1,
//         date: new Date().toISOString().split("T")[0],
//       });

//       if (response.status === 200 || response.status === 201) {
//         setGiven(true);
//       } else {
//         alert("Failed to give trending point.");
//       }
//     } catch (error) {
//       console.error("Trending point error:", error);
//       alert(error.response?.data?.message || "Error giving trending point.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div
//       onClick={handleGiveTrendingPoint}
//       className={`bg-white rounded-lg shadow hover:shadow-md p-4 transition-all duration-200 ${viewType === "list" ? "flex md:flex-row gap-4" : ""
//         }`}
//     >
//       <div className={viewType === "grid" ? "mb-2" : "md:w-1/3"}>
//         <ProductCarousel images={product.product_image || []} />
//       </div>

//       <div className="flex-1">
//         <h2 className="text-md font-semibold text-red-600 mb-2">{product.title}</h2>
//         <p className="text-lg font-bold mb-2">
//           ₹ {product.price.$numberDecimal} / {product.unit}
//         </p>

//         {/* 🏙️ City Name */}
//         {product.primaryAddress?.city && (
//           <p className="text-sm text-gray-500 mb-1">
//             📍 <strong>City:</strong> {product.primaryAddress.city}
//           </p>
//         )}

//         {/* 🔥 Trending Points */}
//         {product.trendingPoints !== undefined && (
//           <p className="text-xs text-gray-500 mb-2">
//             🔥 {product.trendingPoints} trending point{product.trendingPoints > 1 ? "s" : ""}
//           </p>
//         )}

//         {/* 📌 Attributes */}
//         {/* 📌 Attributes */}
//         <ul className="text-sm text-gray-700 space-y-1 mb-2">
//           {product.attributes && Array.isArray(product.attributes) &&
//             product.attributes.map((attr) => (
//               <li key={attr._id}>
//                 <strong>{attr.attribute_key}:</strong>{" "}
//                 {String(attr.attribute_value).length > 50
//                   ? String(attr.attribute_value).slice(0, 50) + "..."
//                   : String(attr.attribute_value)}
//               </li>
//             ))}
//         </ul>


//         {/* 🧰 Actions */}
//         <div className="flex flex-wrap gap-2 mt-4">
//           <button className="border rounded px-3 py-1 flex items-center gap-1 text-[#e03733] border-[#e03733] hover:bg-red-50 text-sm">
//             <Phone size={14} /> View Mobile
//           </button>
//           <button className="bg-green-600 text-white px-3 py-1 rounded flex items-center gap-1 hover:bg-green-700 text-sm">
//             <MessageSquare size={14} /> Send Enquiry
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ProductCard;


import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom"; // ✅ Import useNavigate
import axios from "axios";
import { Phone, Mails, Ban } from "lucide-react";
import ProductCarousel from "./ProductCarousel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AuthContext } from "@/modules/landing/context/AuthContext";


const ProductCard = ({ product, viewType, currentUserId }) => {
  const [loading, setLoading] = useState(false);
  const {user}=useContext(AuthContext);
  const [given, setGiven] = useState(false);
  const navigate = useNavigate(); // ✅ Hook for navigation

  const handleGiveTrendingPoint = async () => {
    if (loading || given) return;

    setLoading(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/trending-point/create-trending-points`,
        {
          user_id: user?.user?._id,
          product_id: product?._id,
          trending_points: 1,
          date: new Date().toISOString().split("T")[0],
        }
      );

      if (response.status === 200 || response.status === 201) {
        setGiven(true);
      } else {
        // alert("Failed to give trending point.");
      }
    } catch (error) {
      // console.error("Trending point error:", error);
      // alert(error.response?.data?.message || "Error giving trending point.");
    } finally {
      setLoading(false);
    }
  };
  const handleReadMoreClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const formattedName = product.product_name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-"); // replaces all spaces with a single hyphen
    navigate(`/product/${formattedName}`);
  };


  const displayedAttributes = product.attributes?.slice(0, 5);

  return (
    <div
      onClick={handleGiveTrendingPoint}
      className={`bg-white rounded-lg shadow hover:shadow-md p-4 transition-all duration-200 block ${viewType === "list" ? "flex md:flex-row gap-4" : ""
        }`}
    >
      {!product && (
        <div className="flex items-center justify-center py-20">
          <Card className="max-w-md w-full text-center shadow-md border border-red-200">
            <CardContent className="flex flex-col items-center justify-center space-y-4 py-10">
              <Ban className="w-12 h-12 text-red-500" />
              <h2 className="text-xl font-semibold text-gray-800">Product Not Found</h2>
              <p className="text-gray-500 text-sm">
                Sorry, we couldn’t find any product matching your search.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
      <div className={viewType === "grid" ? "mb-2" : "md:w-1/3"}>
        <ProductCarousel images={product.product_image || []} />
      </div>

      <div className="flex-1">
        <h2 className="text-md font-semibold text-[#0c1f4d] mb-2">
          {product.title}
        </h2>
        <p className="text-lg font-bold mb-2">
          ₹ {product.price.$numberDecimal} / {product.unit}
        </p>

        {product.primaryAddress?.city && (
          <p className="text-sm text-gray-500 mb-1">
            📍 <strong>City:</strong> {product.primaryAddress.city}
          </p>
        )}

        {product.trendingPoints !== undefined && (
          <p className="text-xs text-gray-500 mb-2">
            🔥 {product.trendingPoints} trending point
            {product.trendingPoints > 1 ? "s" : ""}
          </p>
        )}

        <ul className="text-sm text-gray-700 space-y-1 mb-2">
          {displayedAttributes?.map((attr) => (
            <li key={attr._id}>
              <strong>{attr.attribute_key}:</strong>{" "}
              {String(attr.attribute_value).length > 50
                ? String(attr.attribute_value).slice(0, 50) + "..."
                : String(attr.attribute_value)}
            </li>
          ))}
        </ul>

        {/* ✅ Read More navigates to details page */}
        {product.attributes?.length > 1 && (
          <button
            type="button"
            className="text-[#0c1f4d] text-sm underline cursor-pointer"
            onClick={handleReadMoreClick}
          >
            Read more...
          </button>
        )}

        <div className="flex flex-wrap gap-2 mt-4">
          <button className="border rounded px-3 py-1 flex items-center gap-1 text-[#0c1f4d] border-[#0c1f4d] hover:bg-red-50 text-sm">
            <Phone size={14} /> View Mobile
          </button>
          <Button
            onClick={() => setShowAllAttributes(true)}
            variant="destructive"
            className="cursor-pointer"
          >
            send enquiry <Mails />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
