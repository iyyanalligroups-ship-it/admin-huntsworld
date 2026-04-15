// huntsworld-admin/client/src/redux/api/TopListingApi.jsx
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const TopListingApi = createApi({
  reducerPath: 'TopListingApi',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL,
    prepareHeaders: (headers, { getState }) => {
      let token = getState().auth?.token || getState().auth?.user?.token;
      if (!token) {
        token = sessionStorage.getItem("token");
      }
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['TopListing'],
  endpoints: (builder) => ({
    // Get active + pending top listing for a specific user
    getActiveTopListing: builder.query({
      query: (userId) => ({
        url: `/top-listing-plan-payment/active/${userId}`,
        method: 'GET',
      }),
      providesTags: (result, error, userId) =>
        result ? [{ type: 'TopListing', id: userId }] : [],
    }),

    // Create new top listing order (first-time activation)
    createTopListingOrder: builder.mutation({
      query: (body) => ({
        url: '/top-listing-plan-payment/create-order',
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { user_id }) => [{ type: 'TopListing', id: user_id }],
    }),

    // Upgrade / Extend existing top listing
    upgradeTopListing: builder.mutation({
      query: (body) => ({
        url: '/top-listing-plan-payment/upgrade',
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { user_id }) => [{ type: 'TopListing', id: user_id }],
    }),

    // Verify Razorpay payment
    verifyTopListingPayment: builder.mutation({
      query: (body) => ({
        url: '/top-listing-plan-payment/verify-payment',
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { user_id }) => [{ type: 'TopListing', id: user_id }],
    }),

    // Cancel active top listing
    cancelTopListing: builder.mutation({
      query: (body) => ({
        url: '/top-listing-plan-payment/cancel',
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { user_id }) => [{ type: 'TopListing', id: user_id }],
    }),

    // Fetch pricing and duration configuration
    getTopListingConfig: builder.query({
      query: () => ({
        url: '/top-listing-plan-payment/top-listing-config',
        method: 'GET',
      }),
    }),

    // Fetch GST percentage configuration
    getGSTConfig: builder.query({
      query: () => ({
        url: '/top-listing-plan-payment/gst-config',
        method: 'GET',
      }),
    }),
  }),
});

export const {
  useGetActiveTopListingQuery,
  useCreateTopListingOrderMutation,
  useUpgradeTopListingMutation,
  useVerifyTopListingPaymentMutation,
  useCancelTopListingMutation,
  useGetTopListingConfigQuery,
  useGetGSTConfigQuery,
} = TopListingApi;
