import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const BrandApi = createApi({
  reducerPath: 'BrandApi',
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
  tagTypes: ['Brands', 'Images'],
  endpoints: (builder) => ({
    // Brand Endpoints
    getBrands: builder.query({
      query: ({ page = 1, limit = 10 }) => `/brands/fetch-all-brands?page=${page}&limit=${limit}`,
      providesTags: ['Brands'],
    }),
    createBrand: builder.mutation({
      query: (body) => ({
        url: '/brands/add-brands',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Brands'],
    }),
    updateBrand: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/brands/update-brands/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Brands'],
    }),
    deleteBrand: builder.mutation({
      query: (id) => ({
        url: `/brands/delete-brands/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Brands'],
    }),

    // Image Endpoints
    uploadBrandImage: builder.mutation({
      query: (formData) => ({
        url: '/brand-images/upload-brand-image',
        method: 'POST',
        body: formData,
        formData: true, // Indicate this is a FormData request
      }),
      invalidatesTags: ['Images'],
    }),
    updateBrandImage: builder.mutation({
      query: (formData) => ({
        url: '/brand-images/update-brand-image',
        method: 'PUT',
        body: formData,
        formData: true,
      }),
      invalidatesTags: ['Images'],
    }),
    deleteBrandImage: builder.mutation({
      query: (body) => ({
        url: '/brand-images/delete-brand-image',
        method: 'DELETE',
        body,
      }),
      invalidatesTags: ['Images'],
    }),
  }),
});

export const {
  useGetBrandsQuery,
  useCreateBrandMutation,
  useUpdateBrandMutation,
  useDeleteBrandMutation,
  useUploadBrandImageMutation,
  useUpdateBrandImageMutation,
  useDeleteBrandImageMutation,
} = BrandApi;