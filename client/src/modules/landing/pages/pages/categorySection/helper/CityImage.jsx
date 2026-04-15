export const CityImage = async ({ country, accessKey }) => {
    console.log("Received country:", country); // ✅ Check this in your browser console
  
    if (!country || !accessKey) {
      console.error("Missing country or access key");
      return "";
    }
  
    try {
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
          country
        )}&orientation=squarish&per_page=1&client_id=${accessKey}`
      );
      const data = await response.json();
      return data?.results?.[0]?.urls?.regular || "";
    } catch (error) {
      console.error("Error fetching Unsplash image:", error);
      return "";
    }
  };
  