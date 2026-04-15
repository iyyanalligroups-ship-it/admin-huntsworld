import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const BannerPaymentApi = createApi({
  reducerPath: 'BannerPaymentApi',
  baseQuery: fetchBaseQuery({ baseUrl: import.meta.env.VITE_API_URL }),
  tagTypes: ['BannerPayments', 'Banners', 'Subscriptions'],
  endpoints: (builder) => ({

  getAllActiveBannerPayments: builder.query({
      query: ({ page, limit }) => `/banner-payment/active-purchased-seller?page=${page}&limit=${limit}`,
      providesTags: ['BannerPayments'],
    }),

    createBannerOrder: builder.mutation({
      query: ({ user_id, days, amount, subscription_id }) => ({
        url: '/banner-payment/create-order',
        method: 'POST',
        body: { user_id, days, amount, subscription_id },
      }),
    }),
    verifyBannerPayment: builder.mutation({
      query: (paymentData) => ({
        url: '/banner-payment/verify-payment',
        method: 'POST',
        body: paymentData,
      }),
    }),
    createBanner: builder.mutation({
      query: (bannerData) => ({
        url: '/banner-payment/create-banner',
        method: 'POST',
        body: bannerData,
      }),
      invalidatesTags: ['Banners'],
    }),
    getActiveBanner: builder.query({
      query: (user_id) => `/banner-payment/active/${user_id}`,
      providesTags: ['Banners'],
    }),
    cancelBanner: builder.mutation({
      query: (id) => ({
        url: `/banner-payment/cancel/${id}`,
        method: 'POST',
      }),
      invalidatesTags: ['BannerPayments', 'Banners'],
    }),
    upgradeBanner: builder.mutation({
      query: (bannerData) => ({
        url: '/banner-payment/upgrade',
        method: 'POST',
        body: bannerData,
      }),
      invalidatesTags: ['BannerPayments', 'Banners'],
    }),
    checkUserSubscription: builder.query({
      query: (user_id) => `/user-subscription-plan/fetch-user-active-subscription-for-banner/${user_id}`,
      providesTags: ['Subscriptions'],
    }),
    updateBanner: builder.mutation({
      query: ({ banner_id, title, banner_image, circle_logo, rectangle_logo }) => ({
        url: `/banner-payment/update/${banner_id}`,
        method: 'PUT',
        body: { title, banner_image, circle_logo, rectangle_logo },
      }),
      invalidatesTags: ['Banners'],
    }),
    deleteBanner: builder.mutation({
      
      query: (banner_id) => ({
        url: `/banner-payment/delete/${banner_id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Banners'],
    }),
  }),
});

export const {
  useGetAllActiveBannerPaymentsQuery,
  useCreateBannerOrderMutation,
  useVerifyBannerPaymentMutation,
  useCreateBannerMutation,
  useGetActiveBannerQuery,
  useCancelBannerMutation,
  useUpgradeBannerMutation,
  useCheckUserSubscriptionQuery,
  useUpdateBannerMutation,
  useDeleteBannerMutation,
} = BannerPaymentApi;