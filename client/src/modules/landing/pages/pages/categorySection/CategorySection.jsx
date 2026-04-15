// App.js
import React from 'react';
import BannerPage from './BannerPage';
import CountryWrapper from './CountryWrapper';
import CityPage from './CityPage';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

// Your data (can be in a separate file)
// const categories = [
//   {
//     name: "Realestate, Building & Construction",
//     bannerImage: "https://img.freepik.com/free-photo/skyscraper-construction_1127-3195.jpg",
//     mainSubcategories: [
//       "Wood and Lumber",
//       "Cladding Materials and Building Panels",
//       "Bricks & Construction Materials",
//       "PVC, HDPE, FRP & Plastic Pipes"
//     ],
//     subcategories: [
//       {
//         name: "Prefabricated & Portable Buildings",
//         image: "https://img.freepik.com/free-photo/portable-container-house_123827-22559.jpg",
//         items: ["Office Container", "Portable Cabins", "Mobile Cabins", "Security Cabins"]
//       },
//       {
//         name: "Hardware Fittings and Accessories",
//         image: "https://img.freepik.com/free-photo/metal-fittings-close-up_93675-133354.jpg",
//         items: ["Steel Angles", "MS Channel", "Ferrules", "Brackets"]
//       },
//       {
//         name: "Door & Window Fittings",
//         image: "https://img.freepik.com/free-photo/metal-hinges-closeup_93675-130849.jpg",
//         items: ["Stainless Steel Door Hardware", "Door Handles", "Brass Handles", "Door Hardware"]
//       },
//       {
//         name: "Paints, Varnishes & Wall Putty",
//         image: "https://img.freepik.com/free-photo/paint-cans-color-palette_23-2148322762.jpg",
//         items: ["Paints", "Special Purpose Paints", "Primer Paint", "Wall Putty"]
//       }
//     ]
//   },
//   {
//     name: "Industrial Machines & Equipment",
//     bannerImage: "https://img.freepik.com/free-photo/modern-industrial-equipment_93675-134235.jpg",
//     mainSubcategories: [
//       "CNC Machines",
//       "Lathe Machines",
//       "Drilling Machines",
//       "Packaging Machines"
//     ],
//     subcategories: [
//       {
//         name: "CNC Machines",
//         image: "https://img.freepik.com/free-photo/cnc-machine-cutting-metal_651396-292.jpg",
//         items: ["CNC Turning Center", "CNC Milling Machine", "CNC Router", "Vertical Machining Center"]
//       },
//       {
//         name: "Drilling Equipment",
//         image: "https://img.freepik.com/free-photo/heavy-industrial-drilling-machine_93675-128245.jpg",
//         items: ["Bench Drill", "Radial Drill", "Pillar Drill", "Core Drilling Machine"]
//       },
//       {
//         name: "Packaging Machines",
//         image: "https://img.freepik.com/free-photo/automated-packaging-line-industrial-factory_146671-20120.jpg",
//         items: ["Pouch Packing Machine", "Vacuum Packaging Machine", "Filling Machine", "Sealing Machine"]
//       },
//       {
//         name: "Welding Equipment",
//         image: "https://img.freepik.com/free-photo/worker-welding-metal-structure-factory_1150-11723.jpg",
//         items: ["Arc Welding", "MIG Welding", "Spot Welding", "Plasma Welding"]
//       }
//     ]
//   },
//   {
//     name: "Electrical & Electronics",
//     bannerImage: "https://img.freepik.com/free-photo/electric-circuit_1150-10890.jpg",
//     mainSubcategories: [
//       "Wires & Cables",
//       "Switches & Circuit Breakers",
//       "Electric Motors",
//       "Lighting Equipment"
//     ],
//     subcategories: [
//       {
//         name: "Electric Motors",
//         image: "https://img.freepik.com/free-photo/large-electric-motor_93675-133183.jpg",
//         items: ["AC Motors", "DC Motors", "Stepper Motors", "Servo Motors"]
//       },
//       {
//         name: "Wires & Cables",
//         image: "https://img.freepik.com/free-photo/colorful-electric-wires_93675-133196.jpg",
//         items: ["Copper Wires", "Multicore Cables", "Flexible Cables", "Armoured Cables"]
//       },
//       {
//         name: "Lighting Equipment",
//         image: "https://img.freepik.com/free-photo/led-bulbs-lighting_1150-10888.jpg",
//         items: ["LED Bulbs", "Tube Lights", "Flood Lights", "Street Lights"]
//       },
//       {
//         name: "Switchgear",
//         image: "https://img.freepik.com/free-photo/switchboard-industrial_1150-10794.jpg",
//         items: ["MCB", "Isolators", "Relays", "Distribution Box"]
//       }
//     ]
//   },
//   {
//     name: "Agriculture & Farming",
//     bannerImage: "https://img.freepik.com/free-photo/tractor-farming-field_1150-12266.jpg",
//     mainSubcategories: [
//       "Seeds & Saplings",
//       "Fertilizers",
//       "Pesticides",
//       "Irrigation Equipment"
//     ],
//     subcategories: [
//       {
//         name: "Seeds & Plants",
//         image: "https://img.freepik.com/free-photo/green-sapling-growing-soil_1150-10768.jpg",
//         items: ["Vegetable Seeds", "Flower Seeds", "Fruit Plants", "Nursery Plants"]
//       },
//       {
//         name: "Fertilizers",
//         image: "https://img.freepik.com/free-photo/hands-holding-fertilizer_53876-141046.jpg",
//         items: ["Organic Fertilizer", "Bio Fertilizer", "Compost", "Vermicompost"]
//       },
//       {
//         name: "Pesticides",
//         image: "https://img.freepik.com/free-photo/farmer-spraying-pesticide_1150-10938.jpg",
//         items: ["Insecticides", "Fungicides", "Weedicides", "Plant Growth Regulators"]
//       },
//       {
//         name: "Irrigation Equipment",
//         image: "https://img.freepik.com/free-photo/irrigation-water-pipe-crops_1150-13041.jpg",
//         items: ["Sprinklers", "Drip Systems", "PVC Pipes", "Hose Reels"]
//       }
//     ]
//   },
//   {
//     name: "Apparel & Fashion",
//     bannerImage: "https://img.freepik.com/free-photo/variety-colorful-clothes-hangers_93675-133345.jpg",
//     mainSubcategories: [
//       "Men's Wear",
//       "Women's Wear",
//       "Kids Clothing",
//       "Fashion Accessories"
//     ],
//     subcategories: [
//       {
//         name: "Men's Clothing",
//         image: "https://img.freepik.com/free-photo/men-s-fashion-clothes_1203-7476.jpg",
//         items: ["Shirts", "T-Shirts", "Trousers", "Blazers"]
//       },
//       {
//         name: "Women's Clothing",
//         image: "https://img.freepik.com/free-photo/women-dresses-store_1203-1579.jpg",
//         items: ["Sarees", "Kurtis", "Tops", "Gowns"]
//       },
//       {
//         name: "Kids Wear",
//         image: "https://img.freepik.com/free-photo/colorful-kids-clothes_93675-133378.jpg",
//         items: ["Onesies", "Frocks", "Shirts", "Pants"]
//       },
//       {
//         name: "Fashion Accessories",
//         image: "https://img.freepik.com/free-photo/collection-fashion-accessories_1203-8234.jpg",
//         items: ["Belts", "Hats", "Sunglasses", "Watches"]
//       }
//     ]
//   }
// ];
const banners = [
  {
    image: "https://img.freepik.com/free-vector/sale-banner-template_23-2148897322.jpg",
    title: "Big Sale",
  },
  {
    image: "https://img.freepik.com/free-vector/flash-sale-banner-design_23-2149101150.jpg",
    title: "Flash Deal",
  },
  {
    image: "https://img.freepik.com/free-vector/modern-sale-banner_23-2148897424.jpg",
    title: "Modern Offer",
  },
  {
    image: "https://img.freepik.com/free-vector/new-arrival-banner_23-2148897435.jpg",
    title: "New Arrivals",
  },
  {
    image: "https://img.freepik.com/free-vector/mega-sale-banner_23-2149101051.jpg",
    title: "Mega Discount",
  },
  {
    image: "https://img.freepik.com/free-vector/ecommerce-sale-banner_23-2148897418.jpg",
    title: "Ecommerce Promo",
  },
  {
    image: "https://img.freepik.com/free-vector/special-offer-promo-banner_23-2148906340.jpg",
    title: "Special Offer",
  },
  {
    image: "https://img.freepik.com/free-vector/discount-banner-template_23-2148897431.jpg",
    title: "Up to 50% Off",
  },
  {
    image: "https://img.freepik.com/free-vector/summer-sale-banner_23-2148897441.jpg",
    title: "Summer Sale",
  },
  {
    image: "https://img.freepik.com/free-vector/promo-banner-design_23-2148897426.jpg",
    title: "Hot Deal",
  },
  {
    image: "https://img.freepik.com/free-vector/super-sale-banner_23-2148897415.jpg",
    title: "Super Saver",
  },
  {
    image: "https://img.freepik.com/free-vector/creative-sale-banner_23-2148897444.jpg",
    title: "Creative Sale",
  },
  {
    image: "https://img.freepik.com/free-vector/final-clearance-banner_23-2148897429.jpg",
    title: "Final Clearance",
  },
  {
    image: "https://img.freepik.com/free-vector/limited-time-offer-banner_23-2148897440.jpg",
    title: "Limited Offer",
  },
  {
    image: "https://img.freepik.com/free-vector/online-discount-banner_23-2148897437.jpg",
    title: "Online Discount",
  },
];
const countries = [
  {
    image: "https://img.freepik.com/free-vector/flag-india_23-2147510083.jpg",
    name: "India",
  },
  {
    image: "https://img.freepik.com/free-vector/flag-china_23-2147510085.jpg",
    name: "China",
  },
  {
    image: "https://img.freepik.com/free-vector/flag-united-states-america_23-2147510081.jpg",
    name: "USA",
  },
  {
    image: "https://img.freepik.com/free-vector/flag-turkey_23-2147510087.jpg",
    name: "Turkey",
  },
  {
    image: "https://img.freepik.com/free-vector/flag-germany_23-2147510092.jpg",
    name: "Germany",
  },
  {
    image: "https://img.freepik.com/free-vector/flag-france_23-2147510086.jpg",
    name: "France",
  },
  {
    image: "https://img.freepik.com/free-vector/flag-japan_23-2147510089.jpg",
    name: "Japan",
  },
  {
    image: "https://img.freepik.com/free-vector/flag-brazil_23-2147510080.jpg",
    name: "Brazil",
  },
  {
    image: "https://img.freepik.com/free-vector/flag-italy_23-2147510090.jpg",
    name: "Italy",
  },
  {
    image: "https://img.freepik.com/free-vector/flag-united-kingdom_23-2147510082.jpg",
    name: "UK",
  },
  {
    image: "https://img.freepik.com/free-vector/flag-russia_23-2147510094.jpg",
    name: "Russia",
  },
  {
    image: "https://img.freepik.com/free-vector/flag-australia_23-2147510079.jpg",
    name: "Australia",
  },
  {
    image: "https://img.freepik.com/free-vector/flag-canada_23-2147510084.jpg",
    name: "Canada",
  },
  {
    image: "https://img.freepik.com/free-vector/flag-mexico_23-2147510093.jpg",
    name: "Mexico",
  },
  {
    image: "https://img.freepik.com/free-vector/flag-south-korea_23-2147510095.jpg",
    name: "South Korea",
  },
];


// Main App Component
const CategorySection = ({ categories }) => {
  console.log("categories", categories);
  const navigate = useNavigate();
  const handleCategory = (categoryName) => {
    navigate(`/all-categories/${categoryName}`);
  }

  return (
    <div className="p-4 space-y-8">
      {categories
        .filter((category) => category.categoryName !== "All Categories")
        .map((category, index) => (
          <div
            key={category.categoryId}
            className={`${index % 2 === 0 ? "bg-white" : "bg-gray-100"} cursor-pointer`}
          >
            {/* Category Block */}
            <div className="border shadow space-y-5 p-5 flex flex-col md:flex-row-reverse gap-4">
              {/* Right: Banner */}
              <div className="relative group w-full md:w-1/4 flex justify-center items-center h-auto rounded overflow-hidden">
                <div
                  className="w-full h-64 bg-fill bg-center border-2  bg-no-repeat transition-transform duration-500 group-hover:scale-110"
                  style={{
                    backgroundImage: `url(${category.image || "https://via.placeholder.com/600x400"})`,
                  }}
                ></div>
                {/* Overlay with transition from bottom-left to top-right */}
                <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 origin-bottom-left group-hover:origin-top-right"></div>
                {/* Category Name at Bottom-Left */}
                <div onClick={() => handleCategory(category.categoryName?.toLowerCase()
                  ?.replace(/ & /g, '-')
                  ?.replace(/ /g, '-'))} className="absolute inset-0 flex items-center justify-center p-4">
                  <h2 className="text-white text-lg max-w-fit md:text-sm cursor-pointer font-bold text-center bg-black/70  py-1 rounded transition-transform duration-500 group-hover:scale-105">
                    {category.categoryName}
                  </h2>
                </div>
                {/* Explore More Icon at Top-Right */}
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500" onClick={() => handleCategory(category.categoryName?.toLowerCase()
                  ?.replace(/ & /g, '-')
                  ?.replace(/ /g, '-'))}>
                  <ArrowUpRight className="text-white w-6 h-6" />
                  <span className="text-white text-sm font-semibold">Explore More</span>
                </div>
              </div>

              {/* Left: Subcategories */}
              <div className="grid grid-cols-3 gap-0 w-full h-fit md:w-2/2">
                {category?.subCategories?.slice(0, 4).map((sub, subIdx) => (
                  <div
                    key={sub.subCategoryId}
                    className="border p-3 flex gap-2 shadow-sm hover:shadow-lg hover:scale-100 transition-all duration-300"
                  >
                    <div className="flex-shrink-0">
                      <img
                        src={sub.subCategoryImage}
                        alt={sub.subCategoryName}
                        className="w-24 h-24 object-cover rounded"
                      />
                    </div>
                    <div className="flex-1">
                      <Link to={`/subcategory-detail/${sub.subCategoryName}`}>
                        <h3 className="mt-2 font-semibold text-sm mb-2 text-[#0c1f4d] hover:underline cursor-pointer">
                          {sub.subCategoryName}
                        </h3>
                      </Link>
                      <ul className="list-disc list-inside text-xs text-gray-600">
                        {sub?.superSubCategories?.map((item, itemIdx) => (
                          item.deepSubCategories?.map((deep, deepIdx) => (
                            <li key={deep.deepSubCategoryId}>
                              <Link
                                to={`/products/deep/${deep.name}`}
                                className="hover:underline cursor-pointer"
                              >
                                {deep.name}
                              </Link>
                            </li>
                          ))
                        ))}

                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Show banners after 3rd category */}
            {index === 2 && <BannerPage banners={banners} />}
            {index === 3 && <CityPage />}
            {/* Show countries after 7th category */}
            {index === 4 && <CountryWrapper initialCountries={countries} />}
          </div>
        ))}
    </div>
  );
};

export default CategorySection;