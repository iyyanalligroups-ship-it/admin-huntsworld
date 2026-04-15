import React from 'react';
import useCountriesWithFlags from './helper/UseCountryWithFlag';

const initialCountries = [
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

const AllCountriesPage = () => {
  const countries = useCountriesWithFlags(initialCountries);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">All Countries</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {countries.map((country, i) => (
          <div key={i} className="bg-white border p-4 rounded shadow text-center">
            <img
              src={country.image}
              alt={country.name}
              className="w-20 h-20 mx-auto rounded-full object-cover"
            />
            <p className="mt-2 font-semibold">{country.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AllCountriesPage;
