import React, { useRef, useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import { ChevronLeft, ChevronRight } from 'lucide-react';
import "swiper/css";
import "swiper/css/autoplay";
import { useNavigate } from 'react-router-dom';

const UNSPLASH_ACCESS_KEY = "dA3DnnJl8iNqguwsJalNEyGKE2qnshevtWZpbRtBang"; // replace with your actual key

const cities = [
  { name: "New York" },
  { name: "Paris" },
  { name: "London" },
  { name: "Tokyo" },
  { name: "Sydney" },
  { name: "Rome" },
  { name: "Berlin" },
  { name: "Toronto" },
  { name: "Los Angeles" },
  { name: "Rio de Janeiro" },
];

// 🧠 Move CityImage function here
const fetchCityImage = async (city, accessKey) => {
  if (!city || !accessKey) return "";
  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
        city
      )}&orientation=squarish&per_page=1&client_id=${accessKey}`
    );
    const data = await response.json();
    return data?.results?.[0]?.urls?.regular || "";
  } catch (error) {
    console.error("Error fetching image:", error);
    return "";
  }
};

const CityPage = () => {
  const swiperRef = useRef(null);
  const navigate = useNavigate();
  const [citiesWithImages, setCitiesWithImages] = useState([]);

  const handlePrevClick = () => {
    if (swiperRef.current) swiperRef.current.swiper.slidePrev();
  };

  const handleNextClick = () => {
    if (swiperRef.current) swiperRef.current.swiper.slideNext();
  };

  const handleSeeAll = () => navigate('/all-city'); // Changed to `/all-city`

  useEffect(() => {
    const fetchImages = async () => {
      const updated = await Promise.all(
        cities.map(async (city) => {
          const imageUrl = await fetchCityImage(city.name, UNSPLASH_ACCESS_KEY);
          return { ...city, image: imageUrl };
        })
      );
      setCitiesWithImages(updated);
    };

    fetchImages();
  }, []);

  return (
    <div className="relative w-full bg-gray-50 p-15">
      <h2 className="text-4xl font-bold mb-4 text-center">Suppliers by City</h2> {/* Updated text */}
      <Swiper
        ref={swiperRef}
        modules={[Autoplay]}
        autoplay={{ delay: 2500, disableOnInteraction: false }}
        spaceBetween={8}
        slidesPerView={3}
        breakpoints={{
          640: { slidesPerView: 4 },
          768: { slidesPerView: 5 },
          1024: { slidesPerView: 6 },
        }}
        className='gap-2'
      >
        {citiesWithImages.slice(0, 10).map((city, i) => (
          <SwiperSlide key={i}>
            <div className="bg-white border flex !flex-start !flex-col h-30 p-2 rounded shadow text-center m-2">
              <img
                src={city.image}
                alt={city.name}
                className="w-16 h-16 object-cover mx-auto rounded-full"
              />
              <p className="mt-2 text-sm font-semibold">{city.name}</p>
            </div>
          </SwiperSlide>
        ))}

        <SwiperSlide>
          <div
            onClick={handleSeeAll}
            className="cursor-pointer transition flex flex-col justify-center items-center h-30 p-2 rounded shadow text-center m-2"
            style={{ backgroundColor: '#eeeeee' }}
          >
            <div
              className="w-16 h-16 flex items-center justify-center rounded-full text-lg font-bold"
              style={{ backgroundColor: '#1C1B1F', color: '#ffffff' }}
            >
              +
            </div>
            <p
              className="mt-2 text-sm font-semibold"
              style={{ color: '#e03733' }}
            >
              See All
            </p>
          </div>
        </SwiperSlide>
      </Swiper>

      <div className="absolute top-1 right-1 flex space-x-2">
        <button
          onClick={handlePrevClick}
          className="relative flex cursor-pointer items-center justify-center w-10 h-10 bg-gray-800 text-white rounded-full hover:bg-gray-700 focus:outline-none transition duration-300"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={handleNextClick}
          className="relative flex cursor-pointer items-center justify-center w-10 h-10 bg-gray-800 text-white rounded-full hover:bg-gray-700 focus:outline-none transition duration-300"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default CityPage;
