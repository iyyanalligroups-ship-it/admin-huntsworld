// src/redux/api/CategoryApi.js
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const CategoryApi = createApi({
  reducerPath: "categoryApi",
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL,
    prepareHeaders: (headers) => {
      const token = sessionStorage.getItem("token");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["Category"],
  endpoints: (builder) => ({
    // Existing endpoints
    getCategories: builder.query({
      query: ({ page = 1, limit = 10, search = "" }) =>
        `/categories/fetch-all-category?page=${page}&limit=${limit}&search=${search}`,
      transformResponse: (response) => response,
      providesTags: ["Category"],
    }),

    createCategory: builder.mutation({
      query: (data) => ({
        url: "/categories/create-category",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Category"],
    }),

    updateCategory: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/categories/update-category/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Category"],
    }),

    deleteCategory: builder.mutation({
      query: (id) => ({
        url: `/categories/delete-category/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Category"],
    }),

    getTopCategories: builder.query({
      query: () => `/categories/fetch-top-categories`,
      transformResponse: (response) => response,
      providesTags: ["Category"],
    }),
    getTopCategoriesForAdmin: builder.query({
      // Accept an object containing page and limit (defaults provided)
      query: ({ page = 1, limit = 10 } = {}) =>
        `/categories/fetch-top-categories-for-admin?page=${page}&limit=${limit}`,

      // Optional: Merge results if you want "Infinite Scroll",
      // otherwise, standard pagination will replace the data.
      transformResponse: (response) => response,

      // Provides tags based on the current page for specific cache invalidation
      providesTags: (result, error, { page }) =>
        result
          ? [...result.data.map(({ categoryId }) => ({ type: 'Category', id: categoryId })),
          { type: 'Category', id: `PARTIAL-LIST-${page}` }]
          : [{ type: 'Category', id: 'LIST' }],
    }),
    getTopSubCategories: builder.query({
      query: () => `/categories/fetch-top-sub-categories`,
      transformResponse: (response) => response,
      providesTags: ["Category"],
    }),

    getTopProducts: builder.query({
      query: () => `/categories/fetch-top-products`,
      transformResponse: (response) => response,
      providesTags: ["Category"],
    }),

    getCategoryByName: builder.query({
      query: ({ category_name, page = 1 }) =>
        `/categories/fetch-categories-by-name/${category_name}?page=${page}`,
      transformResponse: (response) => response,
      providesTags: ["Category"],
    }),

    getSubCategoryByName: builder.query({
      query: ({ sub_category_name, page = 1 }) =>
        `/categories/fetch-sub-categories-by-name/${sub_category_name}?page=${page}`,
      transformResponse: (response) => response,
      providesTags: ["Category"],
    }),

    getDeepSubProductsByName: builder.query({
      query: ({
        modelName = "deep-sub-category",
        sub_category_name,
        city,
        lat,
        lng,
        searchLocation,
        page = 1,
      }) => {
        const params = new URLSearchParams();
        if (city) params.append("city", city);
        if (lat && lng) {
          params.append("lat", lat);
          params.append("lng", lng);
        }
        if (searchLocation) params.append("searchLocation", searchLocation);
        params.append("page", page);
        return `/categories/fetch-deep-sub-category-products/${modelName}/${sub_category_name}?${params.toString()}`;
      },
      transformResponse: (response) => response,
      providesTags: ["Category"],
    }),

    // New endpoint added here
    createCategoryTree: builder.mutation({
      query: (data) => ({
        url: "/categories/create-full-category-tree",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Category"],
    }),
  }),
});

// Export all existing hooks
export const {
  useGetCategoriesQuery,
  useGetTopCategoriesQuery,
  useGetSubCategoryByNameQuery,
  useGetDeepSubProductsByNameQuery,
  useGetCategoryByNameQuery,
  useGetTopProductsQuery,
  useGetTopSubCategoriesQuery,
  useGetTopCategoriesForAdminQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  // New hook
  useCreateCategoryTreeMutation,
} = CategoryApi;
