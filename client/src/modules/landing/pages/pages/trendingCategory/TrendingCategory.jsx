import React, { useEffect, useRef } from "react";
import CategoryCard from "./CategoryCard"; 
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { gsap } from "gsap";
import {useGetTopSubCategoriesQuery} from "@/redux/api/CategoryApi"


// const categories = [
//   {
//     id: 1,
//     title: "Agriculture",
//     imageUrl: "https://img.freepik.com/free-vector/variety-activities-from-agricultural-workers_23-2148815844.jpg",
//   },
//   {
//     id: 2,
//     title: "Apparel and Fashion Accessories",
//     imageUrl: "https://img.freepik.com/free-photo/flat-lay-trendy-creative-feminine-accessories-arrangement_23-2148430843.jpg",
//   },
//   {
//     id: 3,
//     title: "Service Providers and Consultants Directory",
//     imageUrl: "https://img.freepik.com/free-vector/flat-design-illustration-customer-support_23-2148887720.jpg",
//   },
//   {
//     id: 4,
//     title: "Food Products & Beverages",
//     imageUrl: "https://img.freepik.com/free-photo/creative-assortment-with-hamburger-menu_23-2148430843.jpg",
//   },
//   {
//     id: 5,
//     title: "Office Supplies & Stationery",
//     imageUrl: "https://img.freepik.com/free-photo/top-view-desk-supplies-arrangement-still-life_23-2148430843.jpg",
//   },
//   {
//     id: 6,
//     title: "Electronics",
//     imageUrl: "https://img.freepik.com/free-photo/top-view-electronic-devices-arrangement_23-2148430843.jpg",
//   },
//   {
//     id: 7,
//     title: "Home & Furniture",
//     imageUrl: "https://img.freepik.com/free-photo/modern-living-room-interior-with-furniture_23-2148430843.jpg",
//   },
//   {
//     id: 8,
//     title: "Health & Beauty",
//     imageUrl: "https://img.freepik.com/free-photo/beauty-products-arrangement-flat-lay_23-2148430843.jpg",
//   },
//   {
//     id: 9,
//     title: "Automotive",
//     imageUrl: "https://img.freepik.com/free-photo/car-parts-arrangement-flat-lay_23-2148430843.jpg",
//   },
//   {
//     id: 10,
//     title: "Sports & Outdoors",
//     imageUrl: "https://img.freepik.com/free-photo/sports-equipment-flat-lay_23-2148430843.jpg",
//   },
// ];

const TrendingCategory = () => {
  const cardRefs = useRef([]);
  const { data: trendingSubCategories } = useGetTopSubCategoriesQuery();
  const subCategories= trendingSubCategories?.data || [];
 
  useEffect(() => {
    // Animate the cards with GSAP
    gsap.from(cardRefs.current, {
      opacity: 0,
      y: 50, // Slide up from 50px below
      duration: 0.8,
      stagger: 0.7, // Stagger the animation by 0.2s for each card
      ease: "power3.out",
    });
  }, []);

  return (
    <section className="py-2 px-2 bg-gray-50">
      <h2 className="text-2xl font-bold mb-10 text-[#0c1f4d] ">Trending Categories</h2>
      <Swiper
        spaceBetween={16}
        slidesPerView={8}
        breakpoints={{
          0: { slidesPerView: 2, spaceBetween: 8 },
          640: { slidesPerView: 3, spaceBetween: 12 },
          768: { slidesPerView: 4, spaceBetween: 16 },
          1024: { slidesPerView: 6, spaceBetween: 16 },
          1280: { slidesPerView: 8, spaceBetween: 16 },
        }}
        navigation={false}  
        pagination={false}
        allowTouchMove={true}
        className="mySwiper"
      >
        {subCategories?.map((cat, index) => (
          <SwiperSlide key={cat.id}>
            <div
              className="w-60"
              ref={(el) => (cardRefs.current[index] = el)} // Assign ref to each card
            >
              <CategoryCard title={cat.subCategoryName} imageUrl={cat.subCategoryImage} />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
};

export default TrendingCategory;