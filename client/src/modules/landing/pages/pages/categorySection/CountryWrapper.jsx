import React, { useEffect, useState } from "react";
import axios from "axios";
import CountryPage from "./CountryPage"; 

const aliasMap = {
  USA: "United States",
  UK: "United Kingdom",
  "South Korea": "Korea (Republic of)",
};

const CountryWrapper = ({initialCountries}) => {
  const [countries, setCountries] = useState(initialCountries);

  useEffect(() => {
    const fetchFlags = async () => {
      try {
        const res = await axios.get("https://restcountries.com/v3.1/all");

        const updated = initialCountries.map((c) => {
          const matchName = aliasMap[c.name] || c.name;
          const countryData = res.data.find(
            (r) => r.name.common.toLowerCase() === matchName.toLowerCase()
          );

          return {
            ...c,
            image: countryData?.flags?.svg || "", // fallback to blank if not found
          };
        });

        setCountries(updated);
      } catch (err) {
        console.error("Error fetching country flags:", err);
      }
    };

    fetchFlags();
  }, []);

  return <CountryPage countries={countries} />;
};

export default CountryWrapper;
