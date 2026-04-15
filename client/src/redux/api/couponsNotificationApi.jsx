import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const CouponsNotificationApi = createApi({
  reducerPath: 'couponsNotificationApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_API_URL}`,
    prepareHeaders: (headers) => {
      const token = sessionStorage.getItem("token");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Coupon', 'Notification', 'RedeemPoints', 'Merchant'],
  endpoints: (builder) => ({
    // ===== Coupons =====
    getCoupons: builder.query({
      query: () => '/coupons/fetch-all-coupons',
      providesTags: ['Coupon'],
    }),

    redeemPoints: builder.mutation({
      query: (body) => ({
        url: '/redeem-points/create-redeempoints-for-notification',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Merchant', 'RedeemPoints', 'Notification'],
    }),
    redeemUpdatePoints: builder.mutation({
      query: (id) => ({
        url: `/redeem-points/update-redeempoints-by-id/${id}`,
        method: 'PUT',
      }),
      invalidatesTags: ['Merchant', 'RedeemPoints', 'Notification'],
    }),
    markRedeemPointAsRead: builder.mutation({
      query: (id) => ({
        url: `/redeem-points/mark-read/${id}`,
        method: 'PUT',
      }),
      invalidatesTags: ['RedeemPoints', 'Notification'],
    }),

    // ===== Notifications =====
    getNotifications: builder.query({
      query: ({ userId, page, limit, status }) =>
        `/coupons-notification/fetch-notifications-by-user/${userId}?page=${page}&limit=${limit}&status=${status}`,
      providesTags: ['Notification'],
    }),
    getAllRedeemRequests: builder.query({
      query: ({ userId, page = 1, limit = 5 }) => ({
        url: `/coupons-notification/fetch-notifications-by-user/${userId}`,
        params: { page, limit },
      }),
      providesTags: ['Notification'],
    }),
    markNotificationAsRead: builder.mutation({
      query: ({ notificationId, userId }) => ({
        url: '/coupons-notification/mark-as-read',
        method: 'POST',
        body: { notificationId, userId },
      }),
      invalidatesTags: ['Notification'],
    }),
    markNotificationAsUnread: builder.mutation({
      query: ({ notificationId, userId }) => ({
        url: '/coupons-notification/mark-as-unread',
        method: 'POST',
        body: { notificationId, userId },
      }),
      invalidatesTags: ['Notification'],
    }),

    sendRedeemAmount: builder.mutation({
      query: ({ notificationId, receiverId }) => ({
        url: '/coupons-notification/send-redeem-amount',
        method: 'POST',
        body: { notificationId, receiverId },
      }),
      invalidatesTags: ['Notification'],
    }),
    rejectRedeemRequest: builder.mutation({
      query: ({ notificationId, reason }) => ({
        url: '/coupons-notification/reject-redeem',
        method: 'POST',
        body: { notificationId, reason },
      }),
      invalidatesTags: ['Notification'],
    }),
    deleteNotification: builder.mutation({
      query: ({ notificationId, userId }) => ({
        url: `/coupons-notification/${notificationId}`,   // or `/notifications` if using body
        method: 'DELETE',
        body: userId ? { userId } : undefined,
      }),
      invalidatesTags: ['CouponNotifications'],
    }),
    getRedeemHistory: builder.query({
      query: ({ page = 1, limit = 10 }) => ({
        url: `/redeem-points/redeem-history?page=${page}&limit=${limit}`,
        method: 'GET',
      }),
      providesTags: ['RedeemHistory'],
    }),
    getNotificationDetails: builder.query({
      query: (notificationId) => `/coupons-notification/notifications/coupons/${notificationId}`,
      providesTags: ['Notification'],
    }),
  }),
});

export const {
  // Coupon
  useGetCouponsQuery,
  useRedeemPointsMutation,
  useRedeemUpdatePointsMutation,
  useGetRedeemHistoryQuery,
  useMarkRedeemPointAsReadMutation,
  // Notifications
  useDeleteNotificationMutation,
  useGetNotificationsQuery,
  useGetNotificationDetailsQuery,
  useGetAllRedeemRequestsQuery,
  useMarkNotificationAsUnreadMutation,
  useMarkNotificationAsReadMutation,
  useSendRedeemAmountMutation,
  useRejectRedeemRequestMutation
} = CouponsNotificationApi;
