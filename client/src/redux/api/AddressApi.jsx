import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const AddressApi = createApi({
  reducerPath: "AddressApi",
  baseQuery: fetchBaseQuery({ baseUrl:import.meta.env.VITE_API_URL,prepareHeaders: (headers) => {
      const token = sessionStorage.getItem("token");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },}),
  endpoints: (builder) => ({
    getUniqueCities: builder.query({
      query: () => "/address/fetch-all-cities", // backend route
    }),
     getCompetitorProducts: builder.query({
      query: ({ page = 1, limit = 10, city }) => ({
        url: '/address/fetch-seller-location-competitor',
        params: { page, limit, ...(city && { city }) },
      }),
      transformResponse: (response) => ({
        competitors: response.competitors,
        hasMore: response.hasMore,
      }),
    }),
  }),
});

export const { useGetUniqueCitiesQuery ,useGetCompetitorProductsQuery} = AddressApi;
