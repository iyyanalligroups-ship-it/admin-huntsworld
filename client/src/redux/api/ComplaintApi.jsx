import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const complaintApi = createApi({
  reducerPath: 'complaintApi',
  baseQuery: fetchBaseQuery({ baseUrl: import.meta.env.VITE_API_URL }),
  endpoints: (builder) => ({
    getComplaints: builder.query({
      query: ({ userId, value }) => {
        console.log('Fetching complaints with URL:', `${import.meta.env.VITE_API_URL}/complaint-form/fetch-user-complaints?user_id=${userId}&option=${value}`);
        return {
          url: 'complaint-form/fetch-user-complaints',
          params: { user_id: userId, option: value },
        };
      },
      transformResponse: (response) => response.data || response,
    }),
    getComplaintsBySupplierNumberAndType: builder.query({
      query: ({ supplierNumber, type }) => ({
        url: 'complaint-form/fetch-complaints-by-supplier-and-type',
        params: { supplier_number: supplierNumber, type },
      }),
      transformResponse: (response) => response.data || response,
    }),
    getMerchantByUserId: builder.query({
      query: (userId) => ({
        url: 'merchant/fetch-merchant-by-user-id',
        params: { user_id: userId },
      }),
      transformResponse: (response) => response.data || response,
    }),
  }),
});

export const { 
  useGetComplaintsQuery, 
  useGetComplaintsBySupplierNumberAndTypeQuery,
  useGetMerchantByUserIdQuery 
} = complaintApi;