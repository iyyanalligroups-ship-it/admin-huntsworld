import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const PhoneNumberAccessApi = createApi({
  reducerPath: 'phoneNumberAccessApi',
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
  endpoints: (builder) => ({
    requestPhoneNumberAccess: builder.mutation({
      query: (data) => ({
        url: '/phone-number-access/request',
        method: 'POST',
        body: data,
      }),
    }),
    approvePhoneNumberAccess: builder.mutation({
      query: (data) => ({
        url: '/phone-number-access/approve',
        method: 'POST',
        body: data,
      }),
    }),
    rejectPhoneNumberAccess: builder.mutation({
      query: (data) => ({
        url: '/phone-number-access/reject',
        method: 'POST',
        body: data,
      }),
    }),
    getPhoneNumberAccessRequests: builder.query({
      query: (seller_id) => `/phone-number-access/seller/${seller_id}`,
    }),
    markNotificationAsRead: builder.mutation({
      query: (data) => ({
        url: '/phone-number-access/mark-read',
        method: 'POST',
        body: data,
      }),
    }),
  }),
});

export const {
  useRequestPhoneNumberAccessMutation,
  useApprovePhoneNumberAccessMutation,
  useRejectPhoneNumberAccessMutation,
  useGetPhoneNumberAccessRequestsQuery,
  useMarkNotificationAsReadMutation,
} = PhoneNumberAccessApi;