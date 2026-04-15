import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const ReviewApi = createApi({
  reducerPath: 'ReviewApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_API_URL}/reviews`,
    prepareHeaders: (headers) => {
      // Add auth token if needed
      const token = sessionStorage.getItem('token');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    getReviewsByProduct: builder.query({
      query: (productId) => `/fetch-all-reviews-by-product/${productId}`,
      transformResponse: (response) => response,
    }),
    createReview: builder.mutation({
      query: (reviewData) => ({
        url: '/create-review',
        method: 'POST',
        body: reviewData,
      }),
    }),
    getReviewById: builder.query({
      query: (id) => `/fetch-review-by-id/${id}`,
    }),
    updateReview: builder.mutation({
      query: ({ id, ...reviewData }) => ({
        url: `/update-review-by-id/${id}`,
        method: 'PUT',
        body: reviewData,
      }),
    }),
    deleteReview: builder.mutation({
      query: (id) => ({
        url: `/delete-review-by-id/${id}`,
        method: 'DELETE',
      }),
    }),
  }),
});

export const {
  useGetReviewsByProductQuery,
  useCreateReviewMutation,
  useGetReviewByIdQuery,
  useUpdateReviewMutation,
  useDeleteReviewMutation,
} = ReviewApi;