import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const BrandImageApi = createApi({
  reducerPath: 'BrandImageApi',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_IMAGE_URL,
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
  useUploadBrandImageMutation,
  useUpdateBrandImageMutation,
  useDeleteBrandImageMutation,
} = BrandImageApi;