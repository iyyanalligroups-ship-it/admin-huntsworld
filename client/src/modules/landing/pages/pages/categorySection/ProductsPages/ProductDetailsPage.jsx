


// // import React, { useState, useRef } from "react";
// import { useParams, useNavigate, Link } from "react-router-dom"; // Add Link



// import React, { useState, useRef } from "react";
// import { useParams, useNavigate } from "react-router-dom"; // Add useNavigate
// import { Plus, CheckCircle, XCircle, Mails, PhoneOutgoing, CircleEllipsis, Star } from 'lucide-react';
// import { useGetProductByNameQuery, useGetReviewsByProductQuery } from "@/redux/api/ProductApi";
// import {
//   Tooltip,
//   TooltipContent,
//   TooltipProvider,
//   TooltipTrigger,
// } from "@/components/ui/tooltip";
// import { Button } from "@/components/ui/button";
// import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
// import { Label } from "@/components/ui/label";
// import ProductAttributesPage from "./ProductAttributePage";
// import ProductQuoteModel from "./model/ProductQuoteModel";
// import { cn } from "@/lib/utils";

// const ProductDetailsPage = () => {
//   const { product_name } = useParams();
//   const navigate = useNavigate(); // Add navigate hook
//   const { data: productData, isLoading, error } = useGetProductByNameQuery({ product_name });
//   const { data: reviewData } = useGetReviewsByProductQuery(productData?.product?._id, {
//     skip: !productData?.product?._id,
//   });
//   const productAttributesRef = useRef(null);
//   const [activeImageIndex, setActiveImageIndex] = useState(0);
//   const [showAllAttributes, setShowAllAttributes] = useState(false);
//   const [zoomVisible, setZoomVisible] = useState(false);
//   const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
//   const [lensPosition, setLensPosition] = useState({ x: 0, y: 0 });
//   const [openQuoteModal, setOpenQuoteModal] = useState(false);
//   const imageRef = useRef(null);
//   const lensSize = 80;

//   if (isLoading) return <div className="p-4">Loading...</div>;
//   if (error) return <div className="p-4 text-red-500">Error loading product.</div>;

//   const product = productData?.product;
//   const productAttributes = productData?.productAttributes;
//   const seller = productData?.seller;
//   const address = productData?.address;

//   const handleScroll = () => {
//     productAttributesRef.current?.scrollIntoView({ behavior: 'smooth' });
//   };

//   const handleOpenModel = () => {
//     setOpenQuoteModal(true);
//   };

//   const handleMouseMove = (e) => {
//     const rect = imageRef.current.getBoundingClientRect();
//     const x = e.clientX - rect.left;
//     const y = e.clientY - rect.top;

//     const lensX = Math.max(0, Math.min(x - lensSize / 2, rect.width - lensSize));
//     const lensY = Math.max(0, Math.min(y - lensSize / 2, rect.height - lensSize));

//     const zoomX = (x / rect.width) * 100;
//     const zoomY = (y / rect.height) * 100;

//     setLensPosition({ x: lensX, y: lensY });
//     setZoomPosition({ x: zoomX, y: zoomY });
//   };

//   const HandleShowAllAttributes = () => {
//     setShowAllAttributes(true);
//     productAttributesRef.current?.scrollIntoView({ behavior: 'smooth' });
//   };

//   const memberSinceYears = new Date().getFullYear() - new Date(seller.createdAt).getFullYear();

//   const getRatingColor = (rating) => {
//     if (rating >= 4.5) return "bg-green-500 text-white";
//     if (rating >= 3) return "bg-yellow-500 text-white";
//     if (rating > 0) return "bg-red-500 text-white";
//     return "bg-gray-200 text-gray-700";
//   };

//   const StarRating = ({ productId }) => {
//     const averageRating = reviewData?.averageRating || 0;

//     const handleRate = (newRating) => {
//       // Navigate to ReviewProduct page with productId and rating in state
//       navigate(`/review/${productId}`, { state: { rating: newRating } });
//     };

//     return (
//       <div className="space-y-2">
//         <Label className="mb-2">Rating</Label>
//         <div className="flex items-center space-x-2">
//           <div className="flex relative group">
//             {[1, 2, 3, 4, 5].map((star) => (
//               <div key={star} className="relative">
//                 <div
//                   className="absolute left-0 top-0 w-1/2 h-full z-10 cursor-pointer"
//                   onClick={() => handleRate(star - 0.5)}
//                 />
//                 <div
//                   className="absolute right-0 top-0 w-1/2 h-full z-10 cursor-pointer"
//                   onClick={() => handleRate(star)}
//                 />
//                 <Star
//                   size={16}
//                   className={`${averageRating >= star
//                     ? "text-yellow-500"
//                     : averageRating >= star - 0.5
//                       ? "text-yellow-300"
//                       : "text-gray-300"
//                     }`}
//                   fill={
//                     averageRating >= star
//                       ? "#facc15"
//                       : averageRating >= star - 0.5
//                         ? "#fde68a"
//                         : "none"
//                   }
//                 />
//               </div>
//             ))}
//           </div>
//           <div
//             className={cn(
//               "rounded-full px-2 py-0.5 text-xs font-medium shadow transition",
//               getRatingColor(averageRating)
//             )}
//           >
//             {averageRating.toFixed(1)} / 5
//           </div>
//         </div>
//       </div>
//     );
//   };

//   return (
//     <div className="mx-auto max-w-6xl">
//       <div className="flex flex-col md:flex-row p-4 gap-4 mx-auto max-w-6xl">
//         <div className="flex gap-3 border-1 rounded-lg p-4">
//           <div className="relative">
//             <div
//               className="relative w-full h-64 border rounded-lg overflow-hidden"
//               onMouseEnter={() => setZoomVisible(true)}
//               onMouseLeave={() => setZoomVisible(false)}
//               onMouseMove={handleMouseMove}
//             >
//               <img
//                 src={product.product_image[activeImageIndex]}
//                 alt={product.product_name}
//                 ref={imageRef}
//                 className="w-full h-full object-cover cursor-pointer"
//               />
//               {zoomVisible && (
//                 <div
//                   className="absolute border-2 border-[#0c1f4d] bg-white/30 pointer-events-none"
//                   style={{
//                     width: `${lensSize}px`,
//                     height: `${lensSize}px`,
//                     left: `${lensPosition.x}px`,
//                     top: `${lensPosition.y}px`,
//                   }}
//                 >
//                   <div className="flex items-center justify-center h-full w-full">
//                     <Plus size={20} className="text-[#0c1f4d]" />
//                   </div>
//                 </div>
//               )}
//             </div>
//             {zoomVisible && (
//               <div
//                 className="absolute w-60 h-60 border rounded-lg overflow-hidden hidden md:block z-50 bg-white shadow-lg"
//                 style={{
//                   top: 0,
//                   left: 'calc(100% + 10px)',
//                 }}
//               >
//                 <img
//                   src={product.product_image[activeImageIndex]}
//                   alt="zoom"
//                   className="w-auto h-auto min-w-full min-h-full absolute"
//                   style={{
//                     transform: `translate(-${zoomPosition.x}%, -${zoomPosition.y}%) scale(2.5)`,
//                     transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
//                     pointerEvents: "none",
//                   }}
//                 />
//               </div>
//             )}
//             {product.product_image.length > 1 && (
//               <div className="flex justify-center mt-2 gap-2">
//                 {product.product_image.map((image, index) => (
//                   <img
//                     key={index}
//                     src={image}
//                     alt={`${product.product_name} ${index + 1}`}
//                     className={`w-16 h-16 object-cover rounded-lg cursor-pointer ${activeImageIndex === index ? "border-2 border-[#e03733]" : "opacity-50"}`}
//                     onClick={() => setActiveImageIndex(index)}
//                   />
//                 ))}
//               </div>
//             )}
//           </div>
//           <div className="flex flex-col gap-1">
//             <div className="mt-4">
//               <div className="flex items-center gap-3">
//                 <h1 className="text-xl font-bold">
//                   {(() => {
//                     const words = product.product_name.replace(/-/g, " ").toUpperCase().split(" ");
//                     const firstTwo = words.slice(0, 2).join(" ");
//                     const rest = words.slice(2).join(" ");
//                     return (
//                       <>
//                         <span className="text-[#0c1f4d]">{firstTwo}</span> {rest}
//                       </>
//                     );
//                   })()}
//                 </h1>
//                 <StarRating productId={product._id} />
//               </div>
//               <p className="text-lg text-gray-700 mt-2">
//                 ₹ {product.price.$numberDecimal}
//               </p>
//             </div>
//             <div className="mt-4">
//               {productAttributes.slice(0, 4).map((attr, index) => (
//                 <div key={index} className="flex justify-between py-1">
//                   <span className="font-semibold">{attr.attribute_key}</span>
//                   <span>{attr.attribute_value}</span>
//                 </div>
//               ))}
//               {productAttributes.length > 1 && (
//                 <div className="flex gap-3">
//                   <Button
//                     onClick={HandleShowAllAttributes}
//                     variant="outline"
//                     className="cursor-pointer"
//                   >
//                     View More <CircleEllipsis />
//                   </Button>
//                   <Button
//                     onClick={handleOpenModel}
//                     variant="destructive"
//                     className="cursor-pointer"
//                   >
//                     Send Enquiry <Mails />
//                   </Button>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//         <div className="w-full md:w-1/3 p-4 border rounded-lg">
//           <div className="flex items-center gap-3">
//             <Avatar className="w-12 h-12">
//               <AvatarImage src={seller.company_logo} alt={seller.company_name} />
//               <AvatarFallback>
//                 {seller.company_name
//                   ?.split(" ")
//                   .map(word => word[0])
//                   .join("")
//                   .slice(0, 2)
//                   .toUpperCase()}
//               </AvatarFallback>
//             </Avatar>
//             <h2 className="text-xl font-bold">{seller.company_name || seller?.travels_name}</h2>
//             <TooltipProvider>
//               <Tooltip>
//                 <TooltipTrigger asChild>
//                   <span>
//                     {seller.verified_status ? (
//                       <CheckCircle className="text-green-500 w-5 h-5 cursor-pointer" />
//                     ) : (
//                       <XCircle className="text-red-500 w-5 h-5 cursor-pointer" />
//                     )}
//                   </span>
//                 </TooltipTrigger>
//                 <TooltipContent side="top">
//                   <p>{seller.verified_status ? "Verified" : "Not Verified"}</p>
//                 </TooltipContent>
//               </Tooltip>
//             </TooltipProvider>
//           </div>
//           <p className="text-gray-600 mt-2">
//             {address.address_line_1}, {address.address_line_2}, {address.city}, {address.state}, {address.country}, {address.pincode}
//           </p>
//           <div className="mt-4">
//             <div className="flex flex-col py-1">
//               <span className="font-semibold">Member Since</span>
//               <span>{memberSinceYears} Year{memberSinceYears !== 1 ? "s" : ""}</span>
//             </div>
//             <div className="flex flex-col py-1">
//               <span className="font-semibold">Nature of Business</span>
//               <span>{seller.company_type}</span>
//             </div>
//             <div className="flex flex-col py-1">
//               <span className="font-semibold">Year of Establishment</span>
//               <span>{seller.year_of_establishment}</span>
//             </div>
//           </div>
//           <div className="flex justify-center gap-3 mt-3">
//             <Button variant="outline" className="cursor-pointer">
//               <PhoneOutgoing /> View Number
//             </Button>
//             <Button variant="destructive" className="cursor-pointer" onClick={handleScroll}>
//               <CircleEllipsis /> View More Details
//             </Button>
//           </div>
//         </div>
//       </div>
//       {showAllAttributes && (
//         <div ref={productAttributesRef}>
//           <ProductAttributesPage data={productData} />
//         </div>
//       )}
//       {openQuoteModal && (
//         <ProductQuoteModel
//           product={product}
//           open={openQuoteModal}
//           setOpen={setOpenQuoteModal}
//         />
//       )}
//     </div>
//   );
// };

// export default ProductDetailsPage;










import React, { useState, useRef, useEffect, useContext } from "react";
import { useParams,Link, useNavigate } from "react-router-dom";

import { Plus, CheckCircle, XCircle, Mails, PhoneOutgoing, CircleEllipsis, Star } from 'lucide-react';
import { useGetProductByNameQuery, useGetReviewsByProductQuery } from "@/redux/api/ProductApi";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import ProductAttributesPage from "./ProductAttributePage";
import ProductQuoteModel from "./model/ProductQuoteModel";
import RequestPhoneNumberButton from "./RequestPhoneNumberButton";
import { cn } from "@/lib/utils";
import io from 'socket.io-client';
import { AuthContext } from "@/modules/landing/context/AuthContext";
import verified from "@/assets/images/2.png"
import trust from "@/assets/images/1.png"
import {
  useGetUserTrustSealStatusQuery,
  useCheckTrustSealQuery
} from '@/redux/api/TrustSealRequestApi';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import TrustSealCertificate from "@/modules/merchant/pages/plans/trust-seal/TrustSealCertificate";

const socket = io(import.meta.env.VITE_SOCKET_IO_URL, {
  withCredentials: true,
  transports: ['websocket'],
});

const ProductDetailsPage = () => {
  const { user } = useContext(AuthContext);

  const { product_name } = useParams();
  const navigate = useNavigate();
  const { data: productData, isLoading, error } = useGetProductByNameQuery({ product_name });
  const userId = productData?.user?._id
  const { data } = useCheckTrustSealQuery(userId, {
    skip: !userId
  });
  const { data: reviewData } = useGetReviewsByProductQuery(productData?.product?._id, {
    skip: !productData?.product?._id,
  });
  const productAttributesRef = useRef(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showAllAttributes, setShowAllAttributes] = useState(false);
  const [zoomVisible, setZoomVisible] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [lensPosition, setLensPosition] = useState({ x: 0, y: 0 });
  const [openQuoteModal, setOpenQuoteModal] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState(null);
  const imageRef = useRef(null);
  const lensSize = 80;
  const [isCertificateOpen, setIsCertificateOpen] = useState(false)
  const [trustSealStatus, setTrustSealStatus] = useState(null)


  const { data: trustSealData, } = useGetUserTrustSealStatusQuery(user?.user?._id, {
    skip: !user?.user?._id,
  });



  useEffect(() => {
    if (trustSealData?.trustSealRequest) {
      setTrustSealStatus(trustSealData.trustSealRequest);
    }
  });
  useEffect(() => {
    socket.on('phoneNumberRequestApproved', (data) => {
      if (data.seller_id === productData?.seller?._id) {
        setPhoneNumber(data.phone_number);
      }
    });

    socket.on('phoneNumberRequestRejected', (data) => {
      if (data.seller_id === productData?.seller?._id) {
        setPhoneNumber(null);
      }
    });

    return () => {
      socket.off('phoneNumberRequestApproved');
      socket.off('phoneNumberRequestRejected');
    };
  }, [productData?.seller?._id]);

  if (isLoading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">Error loading product.</div>;

  const product = productData?.product;
  const productAttributes = productData?.productAttributes;
  const seller = productData?.seller;
  console.log(productData, 'product data');
  const userData = productData.user;


  const address = productData?.address;
  const addressString = [
    address.address_line_1,
    address.address_line_2,
    address.city,
    address.state,
    address.country,
    address.pincode,
  ].join(", ");
  // Create a URL-safe slug from company_name or travels_name
  const companySlug = (seller?.company_name || seller?.travels_name || "")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

  const handleScroll = () => {
    productAttributesRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleOpenModel = () => {
    setOpenQuoteModal(true);
  };

  const handleMouseMove = (e) => {
    const rect = imageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const lensX = Math.max(0, Math.min(x - lensSize / 2, rect.width - lensSize));
    const lensY = Math.max(0, Math.min(y - lensSize / 2, rect.height - lensSize));

    const zoomX = (x / rect.width) * 100;
    const zoomY = (y / rect.height) * 100;

    setLensPosition({ x: lensX, y: lensY });
    setZoomPosition({ x: zoomX, y: zoomY });
  };

  const HandleShowAllAttributes = () => {
    setShowAllAttributes(true);
    productAttributesRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const memberSinceYears = new Date().getFullYear() - new Date(seller.createdAt).getFullYear();

  const getRatingColor = (rating) => {
    if (rating >= 4.5) return "bg-green-500 text-white";
    if (rating >= 3) return "bg-yellow-500 text-white";
    if (rating > 0) return "bg-red-500 text-white";
    return "bg-gray-200 text-gray-700";
  };

  const StarRating = ({ productId }) => {
    const averageRating = reviewData?.averageRating || 0;

    const handleRate = (newRating) => {
      navigate(`/review/${productId}`, { state: { rating: newRating } });
    };

    return (
      <div className="space-y-2">
        <Label className="mb-2">Rating</Label>
        <div className="flex items-center space-x-2">
          <div className="flex relative group">
            {[1, 2, 3, 4, 5].map((star) => (
              <div key={star} className="relative">
                <div
                  className="absolute left-0 top-0 w-1/2 h-full z-10 cursor-pointer"
                  onClick={() => handleRate(star - 0.5)}
                />
                <div
                  className="absolute right-0 top-0 w-1/2 h-full z-10 cursor-pointer"
                  onClick={() => handleRate(star)}
                />
                <Star
                  size={16}
                  className={`${averageRating >= star
                    ? "text-yellow-500"
                    : averageRating >= star - 0.5
                      ? "text-yellow-300"
                      : "text-gray-300"
                    }`}
                  fill={
                    averageRating >= star
                      ? "#facc15"
                      : averageRating >= star - 0.5
                        ? "#fde68a"
                        : "none"
                  }
                />
              </div>
            ))}
          </div>
          <div
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-medium shadow transition",
              getRatingColor(averageRating)
            )}
          >
            {averageRating.toFixed(1)} / 5
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col md:flex-row p-4 gap-4 mx-auto max-w-6xl">
        <div className="flex gap-3 border-1 rounded-lg p-4">
          <div className="relative">
            <div
              className="relative w-full h-64 border rounded-lg overflow-hidden"
              onMouseEnter={() => setZoomVisible(true)}
              onMouseLeave={() => setZoomVisible(false)}
              onMouseMove={handleMouseMove}
            >
              <img
                src={product.product_image[activeImageIndex]}
                alt={product.product_name}
                ref={imageRef}
                className="w-full h-full object-cover cursor-pointer"
              />
              {zoomVisible && (
                <div
                  className="absolute border-2 border-[#0c1f4d] bg-white/30 pointer-events-none"
                  style={{
                    width: `${lensSize}px`,
                    height: `${lensSize}px`,
                    left: `${lensPosition.x}px`,
                    top: `${lensPosition.y}px`,
                  }}
                >
                  <div className="flex items-center justify-center h-full w-full">
                    <Plus size={20} className="text-[#0c1f4d]" />
                  </div>
                </div>
              )}
            </div>
            {zoomVisible && (
              <div
                className="absolute w-60 h-60 border rounded-lg overflow-hidden hidden md:block z-50 bg-white shadow-lg"
                style={{
                  top: 0,
                  left: 'calc(100% + 10px)',
                }}
              >
                <img
                  src={product.product_image[activeImageIndex]}
                  alt="zoom"
                  className="w-auto h-auto min-w-full min-h-full absolute"
                  style={{
                    transform: `translate(-${zoomPosition.x}%, -${zoomPosition.y}%) scale(2.5)`,
                    transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                    pointerEvents: "none",
                  }}
                />
              </div>
            )}
            {product.product_image.length > 1 && (
              <div className="flex justify-center mt-2 gap-2">
                {product.product_image.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`${product.product_name} ${index + 1}`}
                    className={`w-16 h-16 object-cover rounded-lg cursor-pointer ${activeImageIndex === index ? "border-2 border-[#e03733]" : "opacity-50"}`}
                    onClick={() => setActiveImageIndex(index)}
                  />
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <div className="mt-4">
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold">
                  {(() => {
                    const words = product.product_name.replace(/-/g, " ").toUpperCase().split(" ");
                    const firstTwo = words.slice(0, 2).join(" ");
                    const rest = words.slice(2).join(" ");
                    return (
                      <>
                        <span className="text-[#0c1f4d]">{firstTwo}</span> {rest}
                      </>
                    );
                  })()}
                </h1>
                <StarRating productId={product._id} />
              </div>
              <p className="text-lg text-gray-700 mt-2">
                ₹ {product.price.$numberDecimal}
              </p>
            </div>
            <div className="mt-4">
              {productAttributes.slice(0, 4).map((attr, index) => (
                <div key={index} className="flex justify-between py-1">
                  <span className="font-semibold">{attr.attribute_key}</span>
                  <span>{attr.attribute_value}</span>
                </div>
              ))}
              {productAttributes.length > 1 && (
                <div className="flex gap-3">
                  <Button
                    onClick={HandleShowAllAttributes}
                    variant="outline"
                    className="cursor-pointer"
                  >
                    View More <CircleEllipsis />
                  </Button>
                  <Button
                    onClick={handleOpenModel}
                    variant="destructive"
                    className="cursor-pointer"
                  >
                    Send Enquiry <Mails />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="w-full md:w-1/3 p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12">
              <AvatarImage src={seller.company_logo} alt={seller.company_name} />
              <AvatarFallback>
                {seller.company_name
                  ?.split(" ")
                  .map(word => word[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-xl font-bold">
              <Link to={`/company/${companySlug}`} className="hover:underline">
                {seller.company_name || seller?.travels_name}
              </Link>
            </h2>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    {seller.verified_status ? (
                      // <CheckCircle className="text-green-500 w-5 h-5 cursor-pointer" />
                      <img src={verified} className="w-8 h-8" alt="verified symbol" />
                    ) : (
                      <XCircle className="text-red-500 w-5 h-5 cursor-pointer" />
                    )}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>{seller.verified_status ? "Verified" : "Not Verified"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className="text-gray-600 mt-2">
            {address.address_line_1}, {address.address_line_2}, {address.city}, {address.state}, {address.country}, {address.pincode}
          </p>
          <div className="mt-4">
            {data?.exists && (
              <div className="flex gap-4 py-1">
                <span className="font-semibold">Trust Seal</span>
                <img
                  src={trust}
                  alt="Trust seal"
                  onClick={() => setIsCertificateOpen(true)}
                  className="w-6 h-6 cursor-pointer"
                />
              </div>
            )}
            <Dialog open={isCertificateOpen} onOpenChange={setIsCertificateOpen}>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Trust Seal Certificate</DialogTitle>
                </DialogHeader>

                {isLoading ? (
                  <div className="flex justify-center items-center p-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#0c1f4d]"></div>
                  </div>
                ) : (
                  <TrustSealCertificate
                    companyName={seller?.company_name}
                    address={addressString || "N/A"}
                    director={userData?.name || "N/A"}
                    gstin={seller?.gst_number || "N/A"}
                    mobile={seller?.company_phone_number || user?.user?.phone || "N/A"}
                    email={seller?.company_email || user?.user?.email || "N/A"}
                    issueDate={trustSealStatus?.issueDate || new Date()}
                    expiryDate={trustSealStatus?.expiryDate || new Date()}
                  />
                )}
              </DialogContent>
            </Dialog>
            <div className="flex flex-col py-1">
              <span className="font-semibold">Member Since</span>
              <span>{memberSinceYears} Year{memberSinceYears !== 1 ? "s" : ""}</span>
            </div>
            <div className="flex flex-col py-1">
              <span className="font-semibold">Nature of Business</span>
              <span>{seller.company_type?.name || seller.company_type || "N/A"}</span>
            </div>
            <div className="flex flex-col py-1">
              <span className="font-semibold">Year of Establishment</span>
              <span>{seller.year_of_establishment}</span>
            </div>

          </div>
          <div className="flex justify-around items-center ">
            <div className="flex justify-center gap-3 mt-3">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="destructive"
                      className="cursor-pointer"
                      onClick={() => {
                        handleScroll();
                        HandleShowAllAttributes();
                      }}
                    >
                      <CircleEllipsis /> View More Details
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Click me twice</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

            </div>
            <div>
              {phoneNumber ? (
                <div className="flex flex-col py-1">
                  <span className="font-semibold">Phone Number</span>
                  <span>{phoneNumber}</span>
                </div>
              ) : (
                <RequestPhoneNumberButton
                  customerId={user?.user?._id}
                  sellerId={seller._id}
                  merchantId={seller._id}
                />
              )}
            </div>
          </div>
        </div>
      </div>
      {showAllAttributes && (
        <div ref={productAttributesRef}>
          <ProductAttributesPage data={productData} />
        </div>
      )}
      {openQuoteModal && (
        <ProductQuoteModel
          product={product}
          open={openQuoteModal}
          setOpen={setOpenQuoteModal}
        />
      )}
    </div>
  );
};

export default ProductDetailsPage;  