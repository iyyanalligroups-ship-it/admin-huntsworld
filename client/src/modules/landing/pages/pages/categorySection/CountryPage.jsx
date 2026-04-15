import React, { useRef } from 'react'
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import { ChevronLeft, ChevronRight } from 'lucide-react'; // Import lucide-react icons
import "swiper/css";
import "swiper/css/autoplay";
import { useNavigate } from 'react-router-dom';

const CountryPage = ({ countries }) => {
    // Reference to the Swiper instance
    const swiperRef = useRef(null);

    // Use the useNavigate hook from react-router-dom for navigation
    const navigate = useNavigate();

    // Function to go to the previous slide
    const handlePrevClick = () => {
        if (swiperRef.current) {
            swiperRef.current.swiper.slidePrev();
        }
    };

    // Function to go to the next slide
    const handleNextClick = () => {
        if (swiperRef.current) {
            swiperRef.current.swiper.slideNext();
        }
    };

    const handleSeeAll = () => {
        navigate('/all-country'); // Redirect to the all countries page
    };

    return (
        <div className="relative w-full bg-gray-50 p-15">
            <h2 className="text-4xl font-bold mb-4 text-center">Suppliers by Country</h2>
            <Swiper
                ref={swiperRef} // Set the swiper reference
                modules={[Autoplay]}
                autoplay={{ delay: 2500, disableOnInteraction: false }}
                spaceBetween={8} // Customize slide gap here (8px for gap-2)
                slidesPerView={3}
                breakpoints={{
                    640: { slidesPerView: 4 },
                    768: { slidesPerView: 5 },
                    1024: { slidesPerView: 6 },
                }}
                className="gap-2"
            >
                {countries.slice(0, 10).map((country, i) => (
                    <SwiperSlide key={i}>
                        <div className="bg-white border flex !flex-start !flex-col h-30 p-2 rounded shadow text-center m-2"> {/* Custom margin (gap) between each item */}
                            <img
                                src={country.image}
                                alt={country.name}
                                className="w-16 h-16 object-cover mx-auto rounded-full"
                            />
                            <p className="mt-2 text-sm font-semibold">{country.name}</p>
                        </div>
                    </SwiperSlide>

                ))}
                {/* "See All" Slide */}
                <SwiperSlide>
                    <SwiperSlide>
                        <div
                            onClick={handleSeeAll}
                            className="cursor-pointer transition flex flex-col justify-center items-center h-30 p-2 rounded shadow text-center m-2"
                            style={{ backgroundColor: '#eeeeee' }} // $secondary-color
                        >
                            <div
                                className="w-16 h-16 flex items-center justify-center rounded-full text-lg font-bold"
                                style={{ backgroundColor: '#1C1B1F', color: '#ffffff' }} // $primary-color, $accent-color
                            >
                                +
                            </div>
                            <p
                                className="mt-2 text-sm font-semibold"
                                style={{ color: '#e03733' }} // $neutral-color
                            >
                                See All
                            </p>
                        </div>
                    </SwiperSlide>

                </SwiperSlide>
            </Swiper>

            {/* Custom Next and Previous Buttons */}
            <div className="absolute top-1 right-1 flex space-x-2">
                {/* Previous Button */}
                <button
                    onClick={handlePrevClick}
                    className="relative flex cursor-pointer items-center justify-center w-10 h-10 bg-gray-800 text-white rounded-full hover:bg-gray-700 focus:outline-none transition duration-300"
                >
                    <ChevronLeft size={20} />
                    <span className="absolute inset-0 w-full h-full bg-black opacity-0 group-hover:opacity-20 rounded-full transition-opacity duration-300" />
                </button>

                {/* Next Button */}
                <button
                    onClick={handleNextClick}
                    className="relative flex cursor-pointer items-center justify-center w-10 h-10 bg-gray-800 text-white rounded-full hover:bg-gray-700 focus:outline-none transition duration-300"
                >
                    <ChevronRight size={20} />
                    <span className="absolute inset-0 w-full h-full bg-black opacity-0 group-hover:opacity-20 rounded-full transition-opacity duration-300" />
                </button>
            </div>
        </div>
    );
};

export default CountryPage;
