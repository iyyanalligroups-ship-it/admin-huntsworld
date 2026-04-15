import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const PaymentAccountApi = createApi({
  reducerPath: 'PaymentAccountApi',
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
  tagTypes: ['PaymentAccount', 'StudentPaymentHistory'],
  endpoints: (builder) => ({
    getPaymentAccountsByUser: builder.query({
      query: (userId) => `/payment-accounts/user/${userId}`,
      providesTags: ['PaymentAccount'],
    }),
    checkStudentPaymentAccount: builder.query({
      query: (userId) => `/payment-accounts/check-student/${userId}`,
      providesTags: ['PaymentAccount'],
    }),
    recordStudentPayment: builder.mutation({
      query: (data) => ({
        url: '/payment-accounts/record-payment',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['StudentPaymentHistory'],
    }),
    getStudentPaymentHistory: builder.query({
      query: () => '/payment-accounts/student-history',
      providesTags: ['StudentPaymentHistory'],
    }),
  }),
});

export const {
  useGetPaymentAccountsByUserQuery,
  useCheckStudentPaymentAccountQuery,
  useRecordStudentPaymentMutation,
  useGetStudentPaymentHistoryQuery,
} = PaymentAccountApi;
