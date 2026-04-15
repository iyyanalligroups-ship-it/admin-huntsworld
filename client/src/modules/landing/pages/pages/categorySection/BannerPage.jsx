import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import { ChevronLeft, ChevronRight } from 'lucide-react'; // Import icons
import 'swiper/css';
import 'swiper/css/autoplay';
import '../../../css/BannerPage.css'

const BannerPage = ({ banners }) => {
    // Function to handle previous slide
    const handlePrev = () => {
        swiperRef.current.swiper.slidePrev();
    };

    // Function to handle next slide
    const handleNext = () => {
        swiperRef.current.swiper.slideNext();
    };

    // Reference for Swiper instance
    const swiperRef = React.useRef(null);

    return (
        <div className="w-full bg-gray-50 p-10 overflow-hidden relative">
            <h2 className="text-xl font-bold mb-4">Popular Banners</h2>

            <Swiper
                ref={swiperRef}
                modules={[Autoplay]}
                autoplay={{ delay: 2000, disableOnInteraction: false }}
                spaceBetween={12} // This controls actual space between slides (in px)
                slidesPerView={2.5}
                breakpoints={{
                    640: { slidesPerView: 2.5 },
                    768: { slidesPerView: 3.5 },
                    1024: { slidesPerView: 4.5 },
                }}
                className="custom-swiper"
            >
                {banners.map((banner, i) => (
                    <SwiperSlide key={i}>
                        <div className="h-32 bg-white border rounded flex-start shadow">
                            <img
                                src={banner.image}
                                alt={banner.title}
                                className="w-full h-full object-cover p-2"
                            />
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>


            {/* Customized Previous Button */}
            <button
                onClick={handlePrev}
                className="absolute left-1 cursor-pointer z-50 top-1/2 transform-translate-y-1/2 bg-[#1C1B1F] p-3 rounded-full shadow-md hover:bg-[#e03733] hover:scale-110 hover:rotate-12 focus:outline-none transition-all duration-300 ease-in-out"
            >
                <ChevronLeft size={28} className="transition-all text-white duration-300 ease-in-out" />
            </button>

            {/* Customized Next Button */}
            <button
                onClick={handleNext}
                className="absolute right-1 z-50 cursor-pointer top-1/2 transform-translate-y-1/2 bg-[#1C1B1F] p-3 rounded-full shadow-md hover:bg-[#e03733] hover:scale-110 hover:rotate-12 focus:outline-none transition-all duration-300 ease-in-out"
            >
                <ChevronRight size={28} className="transition-all text-white  duration-300 ease-in-out" />
            </button>
        </div>
    );
};

export default BannerPage;
