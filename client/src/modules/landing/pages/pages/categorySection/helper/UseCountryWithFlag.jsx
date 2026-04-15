// hooks/useCountriesWithFlags.js
import { useEffect, useState } from 'react';
import axios from 'axios';

const normalize = (name) => {
  const map = {
    USA: 'United States',
    UK: 'United Kingdom',
    'South Korea': 'Korea (Republic of)'
  };
  return map[name] || name;
};

const useCountriesWithFlags = (initialCountries) => {
  const [countriesWithFlags, setCountriesWithFlags] = useState([]);

  useEffect(() => {
    const fetchFlags = async () => {
      try {
        const { data } = await axios.get('https://restcountries.com/v3.1/all');
        const countriesMap = {};

        data.forEach((country) => {
          const name = country.name.common;
          countriesMap[name.toLowerCase()] = country.flags?.svg || country.flags?.png;
        });

        const updated = initialCountries.map((c) => {
          const normalizedName = normalize(c.name);
          const flag = countriesMap[normalizedName.toLowerCase()];
          return {
            ...c,
            image: flag || c.image, // fallback to dummy if not found
          };
        });

        setCountriesWithFlags(updated);
      } catch (error) {
        console.error('Error fetching flags:', error);
        setCountriesWithFlags(initialCountries); // fallback on failure
      }
    };

    fetchFlags();
  }, [initialCountries]);

  return countriesWithFlags;
};

export default useCountriesWithFlags;
